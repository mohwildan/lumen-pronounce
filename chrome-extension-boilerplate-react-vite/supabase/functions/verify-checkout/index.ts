import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!,
);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) return json({ error: 'Missing session_id' }, 400);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.status !== 'complete' && session.payment_status !== 'paid') {
      return json({ error: 'Payment not complete', status: session.status }, 402);
    }

    const userId = session.metadata?.supabase_user_id;
    if (!userId) return json({ error: 'No user id in session metadata' }, 400);

    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null;

    const { error: dbErr } = await supabase
      .from('profiles')
      .update({
        tier: 'pro',
        subscription_id: subscriptionId,
        subscription_status: 'active',
        stripe_customer_id: typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id ?? null,
      })
      .eq('id', userId);

    if (dbErr) {
      console.error('DB update failed:', dbErr);
      return json({ error: 'DB update failed' }, 500);
    }

    return json({ tier: 'pro', userId });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
