import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { Role } from './types';
import { query } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'clothshop-manager-super-secure-production-secret-key-2026'
);

export const SESSION_COOKIE_NAME = 'clothshop_session';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.id || !payload.email || !payload.role) {
      return null;
    }
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const user = await verifySessionToken(token);
    if (!user) return null;

    // Verify user is still active in database
    const dbRes = await query(
      'SELECT id, name, email, role, "isActive" FROM users WHERE id = $1',
      [user.id]
    );

    if (dbRes.rows.length === 0 || !dbRes.rows[0].isActive) {
      return null;
    }

    return {
      id: dbRes.rows[0].id,
      name: dbRes.rows[0].name,
      email: dbRes.rows[0].email,
      role: dbRes.rows[0].role as Role,
    };
  } catch {
    return null;
  }
}

/**
 * Server-side route permission checker
 */
export async function checkPermissions(
  allowedRoles: Role[] = ['OWNER', 'MANAGER', 'STAFF']
): Promise<{ user: SessionUser | null; authorized: boolean }> {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, authorized: false };
  }
  const authorized = allowedRoles.includes(user.role);
  return { user, authorized };
}

/**
 * Log sensitive administrative or sales operations into audit_logs table
 */
export async function logAudit(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  description: string;
}) {
  try {
    await query(
      `INSERT INTO audit_logs (id, "userId", action, entity, "entityId", description, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        'aud_' + Math.random().toString(36).substring(2, 9),
        params.userId || null,
        params.action,
        params.entity,
        params.entityId || null,
        params.description,
      ]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
