import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logAudit } from '@/lib/auth';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(8, 'Phone number is required'),
  message: z.string().min(3, 'Message is required'),
  inquiryType: z.enum(['GENERAL', 'ITEM_INQUIRY', 'THURSDAY_REQUEST']).default('GENERAL'),
  productName: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid contact data' },
        { status: 400 }
      );
    }

    const { name, phone, message, inquiryType, productName } = parsed.data;

    // Record inquiry into audit logs and link/upsert into customers
    await logAudit({
      userId: null,
      action: 'CUSTOMER_INQUIRY',
      entity: 'Customer',
      description: `Inquiry (${inquiryType}) from ${name} (${phone}): "${message}" ${
        productName ? `[Regarding: ${productName}]` : ''
      }`,
    });

    // Check if customer exists or create them
    const existing = await query(`SELECT id FROM customers WHERE phone = $1`, [phone.trim()]);
    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO customers (id, name, phone, notes, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [
          'cust_' + Math.random().toString(36).substring(2, 9),
          name.trim(),
          phone.trim(),
          `Inquiry note: ${message}`,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been received. Our team will contact you on WhatsApp shortly.',
    });
  } catch (error: any) {
    console.error('Contact error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try WhatsApp directly.' },
      { status: 500 }
    );
  }
}
