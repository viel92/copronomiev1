import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { Logtail } from '@logtail/node';
import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/node';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' });
const logger = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN || '');
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

Sentry.init({ dsn: process.env.VITE_SENTRY_DSN });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID as string, quantity: 1 }],
      success_url: `${req.headers.origin}/app`,
      cancel_url: `${req.headers.origin}/billing`,
      customer_email: user.email ?? undefined,
    });
    return res.status(200).json({ id: session.id });
  } catch (err) {
    await logger.error('Stripe session error', err as any);
    Sentry.captureException(err);
    return res.status(500).json({ error: 'Stripe error' });
  }
}
