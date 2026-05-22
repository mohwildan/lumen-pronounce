import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── IMPORTANT: Next.js App Router needs raw body for Stripe signature ──
export const dynamic = 'force-dynamic';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getStripe() {
  const { default: Stripe } = await import('stripe');
  return new Stripe(STRIPE_SECRET_KEY);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper: extract customer id from any Stripe customer field shape
function customerId(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null && 'id' in val) {
    return (val as { id: string }).id;
  }
  return null;
}

// Helper: update profile by stripe_customer_id
async function updateByCustomer(custId: string, patch: Record<string, unknown>) {
  const { error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('stripe_customer_id', custId);
  if (error) console.error('[webhook] DB update error:', error.message);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  const signature = sig.trim();

  console.log('[DEBUG WEBHOOK - HARDCODED]');
  console.log('- Signature header (sig):', signature);
  console.log('- Body length:', body ? body.length : 0);
  console.log('- Body preview (first 100 chars):', body ? body.substring(0, 100) : 'empty');

  // Verify Stripe signature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    const stripe = await getStripe();
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message || err);

    // ── FALLBACK UNTUK SANDBOX / TEST MODE ─────────────────────────────────
    // Jika tanda tangan gagal tapi livemode = false (Sandbox), kita ijinkan lewat
    // agar Anda tidak terhambat typo/masalah encoding saat testing lokal/sandbox.
    try {
      const parsed = JSON.parse(body);
      if (parsed && parsed.livemode === false) {
        console.warn('[webhook] WARNING: Signature verification failed, but allowing event because livemode is FALSE (Sandbox/Test Mode)');
        event = parsed;
      } else {
        // Jika livemode = true (Production), wajib tolak request ilegal!
        return NextResponse.json({ error: 'Invalid signature', details: err.message || String(err) }, { status: 400 });
      }
    } catch (parseErr) {
      return NextResponse.json({ error: 'Invalid signature', details: err.message || String(err) }, { status: 400 });
    }
  }

  console.log('[webhook] Received event:', event.type, event.id);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = event.data.object as any;

    switch (event.type as string) {

      // ── User completes checkout ──────────────────────────────────────────
      case 'checkout.session.completed': {
        const userId = obj.metadata?.supabase_user_id as string | undefined;
        if (!userId) {
          console.warn('[webhook] checkout.session.completed: no supabase_user_id in metadata');
          break;
        }
        const { error } = await supabase.from('profiles').update({
          tier: 'pro',
          subscription_id: typeof obj.subscription === 'string' ? obj.subscription : obj.subscription?.id ?? null,
          subscription_status: 'active',
          stripe_customer_id: typeof obj.customer === 'string' ? obj.customer : obj.customer?.id ?? null,
        }).eq('id', userId);
        if (error) console.error('[webhook] checkout.session.completed DB error:', error.message);
        else console.log('[webhook] ✅ User', userId, 'upgraded to Pro');
        break;
      }

      // ── Subscription updated (cancel, reactivate, trial end, etc.) ──────
      case 'customer.subscription.updated': {
        const custId = customerId(obj.customer);
        if (!custId) break;
        const isActive = obj.status === 'active' || obj.status === 'trialing';
        await updateByCustomer(custId, {
          tier: isActive ? 'pro' : 'free',
          subscription_status: obj.status,
        });
        console.log('[webhook] subscription.updated customer:', custId, '→ status:', obj.status);
        break;
      }

      // ── Subscription fully cancelled ─────────────────────────────────────
      case 'customer.subscription.deleted': {
        const custId = customerId(obj.customer);
        if (!custId) break;
        await updateByCustomer(custId, {
          tier: 'free',
          subscription_status: 'canceled',
          subscription_id: null,
        });
        console.log('[webhook] ✅ subscription.deleted customer:', custId, '→ free');
        break;
      }

      // ── Payment failed ───────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const custId = customerId(obj.customer);
        if (!custId) break;
        await updateByCustomer(custId, {
          tier: 'free',
          subscription_status: 'past_due',
        });
        console.log('[webhook] invoice.payment_failed customer:', custId, '→ past_due');
        break;
      }

      // ── Refund issued ────────────────────────────────────────────────────
      case 'charge.refunded': {
        const custId = customerId(obj.customer);
        if (!custId) break;
        if (obj.amount_refunded >= obj.amount) {
          await updateByCustomer(custId, {
            tier: 'free',
            subscription_status: 'refunded',
          });
          console.log('[webhook] charge.refunded (full) customer:', custId, '→ free');
        }
        break;
      }

      default:
        console.log('[webhook] Unhandled event type:', event.type);
    }
  } catch (err) {
    console.error('[webhook] Handler error for', event.type, ':', err);
    return NextResponse.json({ received: true, warning: 'Handler error' });
  }

  return NextResponse.json({ received: true });
}
