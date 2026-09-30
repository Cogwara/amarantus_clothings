import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, hashPassword, logAudit } from '@/lib/auth';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF']).default('STAFF'),
});

const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only business owners can manage staff accounts' },
        { status: 403 }
      );
    }

    const usersRes = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u."isActive",
        u."createdAt",
        u."updatedAt",
        (SELECT COUNT(*) FROM sales WHERE "soldById" = u.id)::int as "salesCount",
        (SELECT COALESCE(SUM("totalAmount"), 0) FROM sales WHERE "soldById" = u.id)::float as "totalSalesHandled"
      FROM users u
      ORDER BY u."createdAt" ASC
    `);

    const auditLogsRes = await query(`
      SELECT a.*, u.name as "userName"
      FROM audit_logs a
      LEFT JOIN users u ON a."userId" = u.id
      ORDER BY a."createdAt" DESC
      LIMIT 30
    `);

    return NextResponse.json({
      users: usersRes.rows,
      auditLogs: auditLogsRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching staff users:', error);
    return NextResponse.json({ error: 'Failed to fetch staff list' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const data = parsed.data;

    // Check email uniqueness
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [data.email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'A user with this email address already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(data.password);
    const userId = 'usr_' + Math.random().toString(36).substring(2, 9);

    const insertRes = await query(
      `
      INSERT INTO users (id, name, email, phone, "passwordHash", role, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
      RETURNING id, name, email, phone, role, "isActive", "createdAt"
    `,
      [userId, data.name, data.email.toLowerCase(), data.phone || null, passwordHash, data.role]
    );

    await logAudit({
      userId: user.id,
      action: 'CREATE_STAFF',
      entity: 'User',
      entityId: userId,
      description: `Created new staff account for ${data.name} with role ${data.role}`,
    });

    return NextResponse.json({ success: true, user: insertRes.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating staff user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    const data = parsed.data;

    let updateSql = `
      UPDATE users 
      SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        role = COALESCE($3, role),
        "isActive" = COALESCE($4, "isActive"),
        "updatedAt" = NOW()
    `;
    const params: any[] = [data.name, data.phone, data.role, data.isActive];

    if (data.password) {
      const passwordHash = await hashPassword(data.password);
      updateSql += `, "passwordHash" = $5 WHERE id = $6`;
      params.push(passwordHash, data.id);
    } else {
      updateSql += ` WHERE id = $5`;
      params.push(data.id);
    }

    updateSql += ` RETURNING id, name, email, phone, role, "isActive", "updatedAt"`;

    const res = await query(updateSql, params);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'UPDATE_STAFF',
      entity: 'User',
      entityId: data.id,
      description: `Updated staff profile for ${res.rows[0].name} (Status: ${res.rows[0].isActive ? 'Active' : 'Deactivated'})`,
    });

    return NextResponse.json({ success: true, user: res.rows[0] });
  } catch (error: any) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
