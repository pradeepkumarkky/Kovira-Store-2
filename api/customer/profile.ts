import { getSupabase } from '../_supabase';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use GET.' });
  }

  try {
    const email = String(req.query.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email parameter required.' });
    }

    const supabase = getSupabase(true) || getSupabase(false);
    if (!supabase) {
      return res.status(404).json({ success: false, error: 'Database client unavailable.' });
    }

    const { data: user, error: userError } = await supabase
      .from('customer_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    const { data: addresses } = await supabase
      .from('saved_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    const { data: orders } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || undefined,
        createdAt: user.created_at,
        membershipTier: 'Kovira Member',
        ordersCount: orders?.length || 0,
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
      orders: orders || [],
    });
  } catch (err: any) {
    console.error('Customer profile handler error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Error fetching customer profile.' });
  }
}
