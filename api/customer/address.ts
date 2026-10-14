import { getSupabase } from '../_supabase';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
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

    const { email, address } = body || {};
    if (!email || !address) {
      return res.status(400).json({ success: false, error: 'Email and address details are required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const supabase = getSupabase(true) || getSupabase(false);

    if (supabase) {
      const { data: user } = await supabase
        .from('customer_users')
        .select('id, name, phone')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!user) {
        return res.status(404).json({ success: false, error: 'Customer not found.' });
      }

      const addrId = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const isDefault = Boolean(address.isDefault);

      if (isDefault) {
        await supabase
          .from('saved_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      await supabase.from('saved_addresses').insert({
        id: addrId,
        user_id: user.id,
        label: address.label || 'Home',
        recipient_name: address.recipientName || user.name,
        phone: address.phone || user.phone || '',
        address_line: address.address || address.addressLine1 || '',
        city: address.city || '',
        state: address.state || '',
        postal_code: address.postalCode || '',
        country: address.country || 'India',
        is_default: isDefault,
      });

      const { data: addresses } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      return res.status(200).json({
        success: true,
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
      });
    }

    return res.status(500).json({ success: false, error: 'Supabase client not configured.' });
  } catch (err: any) {
    console.error('Customer address handler error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error saving customer address.',
    });
  }
}
