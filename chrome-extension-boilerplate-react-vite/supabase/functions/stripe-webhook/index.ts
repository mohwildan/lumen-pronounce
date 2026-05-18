import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Bad signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;
        const subscriptionId = session.subscription as string;
        await supabase.from('profiles').update({
          tier: 'pro',
          subscription_id: subscriptionId,
          subscription_status: 'active',
        }).eq('id', userId);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single();
        if (!profile) break;

        const isActive = ['active', 'trialing'].includes(sub.status);
        await supabase.from('profiles').update({
          tier: isActive ? 'pro' : 'free',
          subscription_status: sub.status,
        }).eq('id', profile.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single();
        if (!profile) break;
        await supabase.from('profiles').update({
          tier: 'free',
          subscription_status: 'canceled',
          subscription_id: null,
        }).eq('id', profile.id);
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response('Handler error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
