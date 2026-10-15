import { getSupabase } from './_supabase';

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const {
      items,
      customer,
      currency = 'INR',
      subtotal = 0,
      shipping = 0,
      tax = 0,
      total = 0,
      paymentMethod = 'UPI',
      paymentIntentId,
      upiDetails,
      dropshipSync,
    } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty. Please add items before checking out.' });
    }

    const orderNumber = `KOV-${Math.floor(10000 + Math.random() * 90000)}`;
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const trackingNumber = `TRK-EXP-${Math.floor(100000 + Math.random() * 900000)}`;
    const destinationCountry = customer?.country || 'India';

    const newOrder = {
      id: orderId,
      orderNumber,
      createdAt: new Date().toISOString(),
      items: items.map((it: any) => ({
        ...it,
        supplierLink: it.supplierLink || '',
        supplierPlatform: it.supplierPlatform || 'DeoDap',
      })),
      customer: {
        name: customer?.name || 'Valued Customer',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        city: customer?.city || '',
        country: destinationCountry,
        postalCode: customer?.postalCode || '',
      },
      currency,
      subtotal: Number(subtotal) || 0,
      shipping: Number(shipping) || 0,
      tax: Number(tax) || 0,
      total: Number(total) || 0,
      paymentMethod: paymentMethod || 'UPI',
      paymentStatus: 'Paid',
      paymentIntentId: paymentIntentId || `upi_txn_${Date.now()}`,
      upiDetails: upiDetails || null,
      fulfillmentStatus: 'Order Placed with Supplier',
      trackingNumber,
      carrier: dropshipSync?.carrier || 'Delhivery Surface & Air / DHL Express',
      originWarehouse: dropshipSync?.originHub || 'DeoDap Rajkot Central Logistics Hub',
      estimatedDelivery: dropshipSync?.deliveryDateRange || '2–4 business days',
      destinationCountry,
      destinationPincode: customer?.postalCode || '',
      dropshipSyncDetails: dropshipSync || null,
    };

    // Save to Supabase if connected
    const supabase = getSupabase(true) || getSupabase(false);
    if (supabase) {
      try {
        const { error: orderError } = await supabase.from('orders').insert({
          id: orderId,
          order_number: orderNumber,
          customer_name: newOrder.customer.name,
          customer_email: newOrder.customer.email,
          customer_phone: newOrder.customer.phone,
          customer_address: newOrder.customer.address,
          customer_city: newOrder.customer.city,
          customer_country: newOrder.customer.country,
          customer_postal_code: newOrder.customer.postalCode,
          currency: newOrder.currency,
          subtotal: newOrder.subtotal,
          shipping: newOrder.shipping,
          tax: newOrder.tax,
          total: newOrder.total,
          payment_method: newOrder.paymentMethod,
          payment_status: newOrder.paymentStatus,
          fulfillment_status: newOrder.fulfillmentStatus,
          tracking_number: trackingNumber,
          carrier: newOrder.carrier,
          estimated_delivery: newOrder.estimatedDelivery,
          upi_details: upiDetails || {},
        });

        if (orderError) {
          console.warn('Supabase insert orders warning:', orderError.message);
        } else {
          // Insert order items
          const orderItemsData = items.map((it: any) => ({
            id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            order_id: orderId,
            product_id: it.productId || it.id,
            title: it.title || 'Product Item',
            sku: it.sku || '',
            price: Number(it.price) || 0,
            currency: currency,
            quantity: Number(it.quantity) || 1,
            image: it.image || '',
            selected_size: it.selectedSize || null,
            is_dress: Boolean(it.isDress),
            supplier_name: it.supplierName || 'DeoDap Direct Dropshipping',
          }));

          const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
          if (itemsError) {
            console.warn('Supabase insert order_items warning:', itemsError.message);
          }
        }
      } catch (dbErr: any) {
        console.warn('Error saving order to Supabase:', dbErr?.message || dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      order: newOrder,
      triggeredRestocks: [],
      contact: {
        email: 'support@kovira.com',
        shopName: 'Kovira & Shivora Retail',
      },
    });
  } catch (err: any) {
    console.error('Error in /api/checkout handler:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to complete checkout.',
    });
  }
}
