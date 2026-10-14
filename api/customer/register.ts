import crypto from 'crypto';
import { getSupabase } from '../_supabase';

// In-memory fallback if Supabase environment variables are not yet configured
const inMemoryCustomers: any[] = [];

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

    const {
      name,
      email,
      password,
      phone,
      address,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      country = 'India',
    } = body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email address, and password are required.',
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = String(name).trim();
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanPassword = String(password).trim();
    const passwordHash = crypto.createHash('sha256').update(cleanPassword).digest('hex');

    const combinedAddress =
      address ||
      [
        addressLine1,
        addressLine2,
        landmark ? `Near ${landmark}` : '',
        city,
        state,
        postalCode,
        country,
      ]
        .filter(Boolean)
        .join(', ');

    const supabase = getSupabase(true) || getSupabase(false);

    if (supabase) {
      // 1. Check if an account already exists with this email
      const { data: existingUser, error: queryError } = await supabase
        .from('customer_users')
        .select('id, email, name')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (queryError && queryError.code !== 'PGRST116') {
        console.warn('Supabase query error during registration check:', queryError.message);
      }

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'An account with this email address already exists. Please log in.',
        });
      }

      // 2. Generate clean user ID and insert into public.customer_users
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const { data: newUser, error: insertError } = await supabase
        .from('customer_users')
        .insert({
          id: userId,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          password_hash: passwordHash,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Supabase customer insertion failed:', insertError);
        return res.status(500).json({
          success: false,
          error: `Database registration error: ${insertError.message}. Make sure supabase_schema.sql was run in Supabase SQL editor.`,
        });
      }

      // 3. Save shipping address if provided
      let savedAddressItem: any = null;
      if (combinedAddress || addressLine1) {
        const addrId = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const { data: addrRecord } = await supabase
          .from('saved_addresses')
          .insert({
            id: addrId,
            user_id: userId,
            label: 'Default Address',
            recipient_name: cleanName,
            phone: cleanPhone || '',
            address_line: combinedAddress || 'Default Address',
            city: city ? String(city).trim() : '',
            state: state ? String(state).trim() : '',
            postal_code: postalCode ? String(postalCode).trim() : '',
            country: country ? String(country).trim() : 'India',
            is_default: true,
          })
          .select()
          .maybeSingle();

        savedAddressItem = addrRecord;
      }

      const token = `kov_cust_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: userId,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone || undefined,
          createdAt: newUser?.created_at || new Date().toISOString(),
          membershipTier: 'Kovira Member',
          savedAddresses: savedAddressItem
            ? [
                {
                  id: savedAddressItem.id,
                  label: savedAddressItem.label || 'Default Address',
                  recipientName: savedAddressItem.recipient_name,
                  address: savedAddressItem.address_line,
                  city: savedAddressItem.city,
                  state: savedAddressItem.state,
                  postalCode: savedAddressItem.postal_code,
                  country: savedAddressItem.country,
                  isDefault: savedAddressItem.is_default,
                },
              ]
            : [],
        },
        message: 'Account created successfully! Welcome to Kovira Store.',
      });
    }

    // Fallback in-memory if Supabase credentials are not set
    const existingMemory = inMemoryCustomers.find(
      (c) => c.email.toLowerCase() === cleanEmail
    );
    if (existingMemory) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists. Please log in.',
      });
    }

    const fallbackUser = {
      id: `usr_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone || undefined,
      password: cleanPassword,
      createdAt: new Date().toISOString(),
      membershipTier: 'Kovira Member',
      savedAddresses: combinedAddress
        ? [
            {
              id: `addr_${Date.now()}`,
              label: 'Default Address',
              recipientName: cleanName,
              address: combinedAddress,
              city: city ? String(city).trim() : '',
              state: state ? String(state).trim() : '',
              postalCode: postalCode ? String(postalCode).trim() : '',
              country: country ? String(country).trim() : 'India',
              isDefault: true,
            },
          ]
        : [],
    };
    inMemoryCustomers.unshift(fallbackUser);

    const token = `kov_cust_tok_${Date.now()}`;
    const { password: _, ...userProfile } = fallbackUser;
    return res.status(200).json({
      success: true,
      token,
      user: userProfile,
      message: 'Account created successfully! Welcome to Kovira Store.',
    });
  } catch (error: any) {
    console.error('Registration handler fatal error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error during customer registration.',
    });
  }
}
