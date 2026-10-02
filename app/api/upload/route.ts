import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'image/heic',
  'image/heif',
]);

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

let tableCreated = false;
async function ensureUploadedFilesTable() {
  if (tableCreated) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id TEXT PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        "mimeType" TEXT NOT NULL,
        data BYTEA NOT NULL,
        size INTEGER NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    tableCreated = true;
  } catch (err: any) {
    console.error('Failed to ensure uploaded_files table:', err?.message);
  }
}

async function uploadToCloudinaryIfConfigured(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (
    !cloudName ||
    !apiKey ||
    !apiSecret ||
    cloudName === 'demo-clothshop' ||
    apiKey === 'demo-key' ||
    apiSecret === 'demo-secret'
  ) {
    // Cloudinary is not configured with real production credentials
    return null;
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const signaturePayload = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    formData.append('file', blob, filename);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', 'clothshop_products');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.secure_url || data.url || null;
    } else {
      console.warn('Cloudinary upload returned non-200, falling back to local storage');
      return null;
    }
  } catch (err) {
    console.warn('Cloudinary upload error, falling back to local storage:', err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to upload photos' },
        { status: 401 }
      );
    }

    if (user.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Staff members are not permitted to upload product photos' },
        { status: 403 }
      );
    }

    const formData = (await request.formData()) as any;
    const files: File[] = [];
    const allFiles = formData.getAll('files') as File[];
    const singleFiles = formData.getAll('file') as File[];

    if (allFiles && allFiles.length > 0) {
      files.push(...allFiles.filter((f) => f && typeof f === 'object' && 'size' in f));
    } else if (singleFiles && singleFiles.length > 0) {
      files.push(...singleFiles.filter((f) => f && typeof f === 'object' && 'size' in f));
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No file was provided in the upload request' },
        { status: 400 }
      );
    }

    await ensureUploadedFilesTable();

    const uploadResults: Array<{ url: string; filename: string; storage: string }> = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the maximum limit of 10MB` },
          { status: 400 }
        );
      }

      const fileType = file.type?.toLowerCase() || '';
      if (fileType && !ALLOWED_MIME_TYPES.has(fileType)) {
        return NextResponse.json(
          {
            error: `Invalid file format for "${file.name}". Please upload an image file (JPG, PNG, WebP, GIF, SVG, or AVIF).`,
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine appropriate extension
      let extension = path.extname(file.name).toLowerCase();
      if (!extension || extension.length < 2) {
        extension = EXTENSION_MAP[fileType] || '.jpg';
      }

      // Sanitize base name
      const rawBaseName = path.basename(file.name, extension);
      const sanitizedBase = rawBaseName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 32);
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const finalFilename = `${sanitizedBase ? sanitizedBase + '_' : ''}${uniqueSuffix}${extension}`;

      // 1. Try Cloudinary if real credentials exist
      const cloudinaryUrl = await uploadToCloudinaryIfConfigured(
        buffer,
        finalFilename,
        fileType || 'image/jpeg'
      );

      if (cloudinaryUrl) {
        uploadResults.push({
          url: cloudinaryUrl,
          filename: finalFilename,
          storage: 'cloudinary',
        });
        continue;
      }

      // 2. Persist to PostgreSQL database (works seamlessly on Vercel read-only serverless filesystem)
      const fileId = 'upl_' + Math.random().toString(36).substring(2, 10);
      await query(
        `
        INSERT INTO uploaded_files (id, filename, "mimeType", data, size, "createdAt")
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (filename) DO UPDATE SET data = $4, "mimeType" = $3, size = $5
      `,
        [fileId, finalFilename, fileType || 'image/jpeg', buffer, buffer.length]
      );

      // 3. Best-effort cache write to public/uploads
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.promises.mkdir(uploadsDir, { recursive: true });
        await fs.promises.writeFile(path.join(uploadsDir, finalFilename), buffer);
      } catch (fsErr: any) {
        if (fsErr?.code !== 'EROFS') {
          console.warn('Local disk cache write notice:', fsErr?.message);
        }
      }

      uploadResults.push({
        url: `/uploads/${finalFilename}`,
        filename: finalFilename,
        storage: 'database',
      });
    }

    return NextResponse.json({
      success: true,
      url: uploadResults[0]?.url,
      filename: uploadResults[0]?.filename,
      storage: uploadResults[0]?.storage,
      urls: uploadResults.map((r) => r.url),
      files: uploadResults,
    });
  } catch (error: any) {
    console.error('Error handling image upload:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
