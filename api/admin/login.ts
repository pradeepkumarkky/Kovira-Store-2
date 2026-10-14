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

    const { username, password } = body || {};
    const trimmedUser = String(username || '').trim();
    const trimmedPass = String(password || '').trim();

    const envAdminPass = (process.env.ADMIN_PASSWORD || '').trim();

    // Super Admin validation credentials:
    // Username: pradeepkumarkky
    // Password: Kovira@143 (or configured ADMIN_PASSWORD / fallback admin123)
    const isSuperAdmin =
      (trimmedUser === 'pradeepkumarkky' && trimmedPass === 'Kovira@143') ||
      (trimmedPass === 'Kovira@143') ||
      (trimmedUser === 'pradeepkumarkky' && trimmedPass === 'admin123') ||
      (envAdminPass && trimmedPass === envAdminPass) ||
      (trimmedPass === 'admin123');

    if (isSuperAdmin) {
      const adminToken = `kov_admin_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return res.status(200).json({
        success: true,
        token: adminToken,
        user: {
          username: trimmedUser || 'pradeepkumarkky',
          role: 'Super Administrator',
          shopName: 'Kovira Store',
          email: 'support@kovira.com',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid Super Admin credentials. Username: pradeepkumarkky, Password: Kovira@143',
    });
  } catch (error: any) {
    console.error('Admin login handler fatal error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error during admin authentication.',
    });
  }
}
