# Supabase & Vercel Hosting Setup Guide (with GitHub & CJ Dropshipping)

This guide provides the complete setup for hosting your **Kovira & Shivora Store** with **Supabase PostgreSQL** as the database, **GitHub** for version control, and **Vercel** as the cloud hosting provider.

---

## Part 1: Supabase Database Setup

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **"New Project"**.
3. Choose your organization, set a project name (e.g., `kovira-store`), and set a strong database password.
4. Select the region closest to your customers (e.g., `South Asia (Mumbai) - ap-south-1` for India).
5. Click **"Create new project"** (takes ~1-2 minutes).

### Step 2: Run the SQL Table Schema
1. In your Supabase project dashboard, open the **SQL Editor** from the left navigation bar (icon `>_`).
2. Click **"New query"**.
3. Open the file `supabase_schema.sql` from your repository, copy all the SQL code, and paste it into the SQL Editor.
4. Click **"Run"** (or press `Cmd + Enter` / `Ctrl + Enter`).
5. You should see `Success. No rows returned`.

### What This Creates:
- `products`: Catalog items, dropship feeds, categories, margins (default 50%), stock, price floors, and images.
- `dresses`: Shivora Collections in-house boutique dresses, fabric, sizes, and discount deals.
- `suppliers`: Verified suppliers (**DeoDap Rajkot Hub**, **Baapstore Chennai Hub**, **CJ Dropshipping Global Hub**, **Shivora Boutique**).
- `uploaded_web_links`: Drop ship Hub imported web links with custom margin dropdown (default 50%), discount banners, and link status.
- `store_offers`: Seasonal festival offers and individual product-level offers.
- `dropship_settings`: Live API configurations for **CJ Dropshipping**, DeoDap, and Baapstore.
- `payment_settings`: UPI Payment Gateway (**UPI ID: `9656850012@upi`**) & QR code scan and pay.
- `orders`: Placed customer orders with UPI UTR, payment status, stages (*Accepted, Under Process, Shipping, etc.*), and live courier tracking numbers.
- `order_items`: Line items inside each placed order.
- `customer_users`: Customer profiles and accounts.
- `saved_addresses`: Saved shipping addresses for 1-click checkout.
- `announcements`: Store banner offers and discount coupon codes.
- **Indexes & RLS Policies**: Production-grade Row-Level Security ensuring secure customer transactions and public catalog reads.

### Step 3: Copy Your Supabase API Keys
1. In Supabase, go to **Project Settings** (gear icon) -> **API**.
2. Copy the following keys:
   - **Project URL**: `https://<your-project-ref>.supabase.co`
   - **anon / public key**: `eyJhbGci...`
   - **service_role key** (keep secret, for admin backend operations): `eyJhbGci...`

---

## Part 2: CJ Dropshipping Configuration

Your store supports automated dropshipping synchronization with CJ Dropshipping.

### Required CJ Dropshipping Keys:
1. Log in to [https://cjdropshipping.com](https://cjdropshipping.com).
2. Go to **Authorization / API Settings** in your CJ Dashboard:
   - **CJ API Key**: Your personal API token.
   - **CJ Email / Account**: Your CJ Dropshipping registered email.
   - **Partner ID** (optional): Your CJ merchant partner ID.

Add these keys in your Vercel Environment Variables or `.env` file as shown below.

---

## Part 3: GitHub & Vercel Hosting Setup

### Step 1: Push Code to GitHub
Ensure all code and the `supabase_schema.sql` file are committed to your GitHub repository:
```bash
git add .
git commit -m "CJ Dropshipping key support and Supabase table schema"
git push origin main
```

### Step 2: Import into Vercel
1. Go to [https://vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** -> **"Project"**.
3. Select your GitHub repository and click **"Import"**.

### Step 3: Configure Build Settings
- **Framework Preset**: `Vite`
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Add Environment Variables in Vercel
Under the **Environment Variables** section in the Vercel import screen, add:

| Key | Value | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<your-project>.supabase.co` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJh...` | Your Supabase Public Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJh...` | Your Supabase Secret Service Role Key |
| `CJDROPSHIPPING_API_KEY` | `<your-cj-token>` | CJ Dropshipping API Key |
| `CJDROPSHIPPING_EMAIL` | `<your-cj-email>` | CJ Dropshipping Account Email |
| `VITE_UPI_ID` | `9656850012@upi` | Primary Store UPI ID for QR Scan & Pay |
| `VITE_UPI_PAYEE_NAME` | `Kovira & Shivora Retail` | Store Display Name for UPI apps |
| `ADMIN_PASSWORD` | `admin123` | Password for Admin Portal (Ctrl+Shift+A) |
| `VITE_APP_URL` | `https://your-store.vercel.app` | Production store URL |
| `NODE_ENV` | `production` | Production environment flag |

### Step 5: Click "Deploy"
1. Click **"Deploy"**. Vercel will install dependencies, build the Vite applet, and provision your live global CDN URL (e.g., `https://kovira-store.vercel.app`).
2. Once deployed, any git push to your GitHub `main` branch will automatically trigger instant deployments.
