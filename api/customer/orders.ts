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
      return res.status(400).json({ success: false, error: 'Customer email parameter is required.' });
    }

    const supabase = getSupabase(true) || getSupabase(false);
    if (!supabase) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const { data: dbOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Failed to query customer orders:', ordersError);
      return res.status(200).json({ success: true, orders: [] });
    }

    const formattedOrders = (dbOrders || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      createdAt: o.created_at,
      totalUSD: Number(o.total_amount_usd || 0),
      totalINR: Number(o.total_amount_inr || 0),
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      fulfillmentStatus: o.fulfillment_status,
      courierPartner: o.courier_name,
      courierTrackingNumber: o.courier_tracking_number,
      customer: {
        name: o.customer_name,
        email: o.customer_email,
        phone: o.customer_phone,
        address: o.customer_address,
        city: o.customer_city,
        postalCode: o.customer_postal_code,
        country: o.customer_country,
      },
      items: (o.order_items || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        title: item.title,
        priceUSD: Number(item.unit_price_usd || 0),
        priceINR: Number(item.unit_price_inr || 0),
        quantity: Number(item.quantity || 1),
        image: item.image_url,
      })),
    }));

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
    });
  } catch (err: any) {
    console.error('Customer orders handler error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error fetching customer orders.',
    });
  }
}
