import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    // Strict basename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const ext = path.extname(safeFilename).toLowerCase();
    let contentType = MIME_TYPES[ext] || 'application/octet-stream';
    let fileBuffer: Buffer | null = null;

    // 1. Try reading from local filesystem cache if available
    const filePath = path.join(process.cwd(), 'public', 'uploads', safeFilename);
    if (fs.existsSync(filePath)) {
      try {
        fileBuffer = await fs.promises.readFile(filePath);
      } catch {
        fileBuffer = null;
      }
    }

    // 2. Fall back to PostgreSQL database storage (used on Vercel serverless)
    if (!fileBuffer) {
      try {
        const dbRes = await query(
          `SELECT "mimeType", data FROM uploaded_files WHERE filename = $1 LIMIT 1`,
          [safeFilename]
        );
        if (dbRes.rows.length > 0) {
          fileBuffer = dbRes.rows[0].data;
          if (dbRes.rows[0].mimeType) {
            contentType = dbRes.rows[0].mimeType;
          }
        }
      } catch (dbErr: any) {
        console.warn('Database image retrieval warning:', dbErr?.message);
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('Error serving upload:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to serve image' },
      { status: 500 }
    );
  }
}
