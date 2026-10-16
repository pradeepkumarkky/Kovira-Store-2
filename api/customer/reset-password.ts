import crypto from 'crypto';
import { getSupabase } from '../_supabase';
import { logInfo, logError } from '../_logger';

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

    const { email, newPassword } = body || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required to reset password.',
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const supabase = getSupabase(true) || getSupabase(false);

    // If newPassword provided, update password directly
    if (newPassword && String(newPassword).trim().length >= 6) {
      const cleanPassword = String(newPassword).trim();
      const passwordHash = crypto.createHash('sha256').update(cleanPassword).digest('hex');

      if (supabase) {
        // 1. Update customer_users table
        const { data: updatedUser, error: updateErr } = await supabase
          .from('customer_users')
          .update({
            password_hash: passwordHash,
            updated_at: new Date().toISOString(),
          })
          .eq('email', cleanEmail)
          .select('id, name, email')
          .maybeSingle();

        if (updateErr) {
          logError('AUTH', 'Password reset error in customer_users:', updateErr.message);
          return res.status(500).json({
            success: false,
            error: `Failed to update password: ${updateErr.message}`,
          });
        }

        if (!updatedUser) {
          return res.status(404).json({
            success: false,
            error: 'No account found with this email address.',
          });
        }

        logInfo('AUTH', `Password reset successfully for ${cleanEmail}`);
        return res.status(200).json({
          success: true,
          message: 'Password updated successfully! You can now log in with your new password.',
          user: updatedUser,
        });
      }
    }

    // Otherwise initiate Supabase Auth password reset email
    if (supabase) {
      try {
        await supabase.auth.resetPasswordForEmail(cleanEmail);
      } catch (authErr: any) {
        logError('AUTH', 'Supabase Auth reset notice:', authErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Password reset instructions sent to ${cleanEmail}. You can also enter a new password directly to update immediately.`,
    });
  } catch (err: any) {
    logError('AUTH', 'Fatal error in reset-password:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server error during password reset.',
    });
  }
}
