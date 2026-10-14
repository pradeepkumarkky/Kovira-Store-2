import registerHandler from './customer/register';
import loginHandler from './customer/login';
import ordersHandler from './customer/orders';
import addressHandler from './customer/address';
import profileHandler from './customer/profile';
import adminLoginHandler from './admin/login';
import importUrlHandler from './dropship/deodap/import-url';
import uploadedLinksHandler from './dropship/uploaded-links';
import productsHandler from './products';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const pathname = url.split('?')[0];

  if (pathname.endsWith('/products') || pathname.includes('/api/products')) {
    return productsHandler(req, res);
  }

  if (pathname.endsWith('/customer/register') || pathname === '/api/customer/register') {
    return registerHandler(req, res);
  }

  if (pathname.endsWith('/customer/login') || pathname === '/api/customer/login') {
    return loginHandler(req, res);
  }

  if (pathname.endsWith('/customer/orders') || pathname === '/api/customer/orders') {
    return ordersHandler(req, res);
  }

  if (pathname.endsWith('/customer/address') || pathname === '/api/customer/address') {
    return addressHandler(req, res);
  }

  if (pathname.endsWith('/customer/profile') || pathname === '/api/customer/profile') {
    return profileHandler(req, res);
  }

  if (pathname.endsWith('/admin/login') || pathname === '/api/admin/login') {
    return adminLoginHandler(req, res);
  }

  if (
    pathname.includes('/dropship/deodap/import-url') ||
    pathname.includes('/dropship/web-link/upload')
  ) {
    return importUrlHandler(req, res);
  }

  if (pathname.includes('/dropship/uploaded-links')) {
    return uploadedLinksHandler(req, res);
  }

  return res.status(200).json({
    success: true,
    message: 'Kovira Store API Gateway is running with Supabase & Vercel integration',
    timestamp: new Date().toISOString(),
  });
}
