import crypto from 'crypto';
import { getSupabase } from '../_supabase';

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Expected POST request.',
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const { email, password } = body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanPassword = String(password).trim();
    const passwordHash = crypto.createHash('sha256').update(cleanPassword).digest('hex');

    const supabase = getSupabase(true) || getSupabase(false);

    if (supabase) {
      // 1. Fetch user from customer_users
      const { data: dbUser, error: fetchError } = await supabase
        .from('customer_users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (fetchError) {
        console.error('Supabase customer login query error:', fetchError);
      }

      if (!dbUser) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password. Please verify your credentials.',
        });
      }

      // Check password (hash or raw match for seamless compatibility)
      const matches =
        dbUser.password_hash === passwordHash ||
        dbUser.password_hash === cleanPassword;

      if (!matches) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password. Please verify your credentials.',
        });
      }

      // 2. Fetch saved addresses
      const { data: addresses } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', dbUser.id)
        .order('is_default', { ascending: false });

      // 3. Count past orders
      const { count: orderCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_email', cleanEmail);

      const token = `kov_cust_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone || undefined,
          createdAt: dbUser.created_at,
          membershipTier: 'Kovira Member',
          ordersCount: orderCount || 0,
          savedAddresses: (addresses || []).map((a: any) => ({
            id: a.id,
            label: a.label || 'Default Address',
            recipientName: a.recipient_name,
            address: a.address_line,
            city: a.city,
            state: a.state,
            postalCode: a.postal_code,
            country: a.country,
            isDefault: a.is_default,
          })),
        },
        message: `Welcome back, ${dbUser.name}!`,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Supabase database client not configured on server.',
    });
  } catch (error: any) {
    console.error('Customer login error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error during customer login.',
    });
  }
}
