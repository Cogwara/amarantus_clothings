import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  logAudit,
} from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please provide a valid email and password' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const res = await query(
      'SELECT id, name, email, "passwordHash", role, "isActive" FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = res.rows[0];

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'This user account has been deactivated. Please contact the owner.' },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = await createSessionToken(sessionUser);

    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      description: `User ${user.name} logged into the system`,
    });

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login' },
      { status: 500 }
    );
  }
}
