import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@lumenpronunciation.com';

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl) {
    console.error('[refund-request] Error: NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  
  const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');
  try {
    const { email, reason, note } = await req.json() as {
      email?: string;
      reason?: string;
      note?: string;
    };

    if (!email || !email.includes('@') || !reason) {
      return NextResponse.json({ error: 'Email and reason are required' }, { status: 400 });
    }

    // 1. Log the refund request in Supabase
    const { error: dbError } = await supabase.from('refund_requests').insert({
      email: email.toLowerCase().trim(),
      reason,
      note: note?.trim() ?? '',
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    // Don't fail if table doesn't exist yet — just log it
    if (dbError) {
      console.error('[refund-request] DB error:', dbError.message);
    }

    // 2. Send notification email via Supabase (or log for now)
    // You can replace this with Resend, SendGrid, or any email provider
    const notifBody = [
      `📩 New refund request`,
      ``,
      `Email:  ${email}`,
      `Reason: ${reason}`,
      `Note:   ${note ?? '(none)'}`,
      `Time:   ${new Date().toISOString()}`,
    ].join('\n');

    console.log('[refund-request] Received:\n', notifBody);

    // Optional: send via email using Resend (uncomment when configured)
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'Lumen <noreply@lumenpronunciation.com>',
    //     to: [SUPPORT_EMAIL],
    //     subject: `[Refund Request] ${email}`,
    //     text: notifBody,
    //   }),
    // });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[refund-request] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
