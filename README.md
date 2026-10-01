# 🛍️ Amarantus Clothings Manager
> **A complete clothing business management platform for used-clothing (thrift/okrika) retail businesses.**

Built as a production-quality, mobile-first full-stack application tailored for Nigerian clothing retail shops. It streamlines purchasing from weekly wholesale markets (e.g., Amarantus Clothings, Balogun, Yaba, Aswani), inventory tracking, touch-friendly Point of Sale (POS), operating expenses, customer purchase histories, clearance markdown recommendations, social media advertising, and automated Thursday market purchasing planning.

---

## 🌟 Key Features

### 1. 📊 Executive Dashboard
- **Live Metrics:** Real-time today's sales, actual gross profit (calculated using real unit purchase cost), total inventory value (cost and retail), and monthly expenses.
- **Visual Trends:** 7-day revenue vs. gross profit area charts using Recharts.
- **Inventory Intelligence:** Automatic identification of fast-moving styles, low stock alerts ($\le$ minimum stock), and stagnant items ($> 45$ days in shop).
- **Recent Activity:** Quick transaction feed for sales and market purchase batches.

### 2. 🛒 Point of Sale (POS) & Printable Receipts
- **Mobile-First POS:** Fast product search by name, SKU, or category; 1-tap add to cart; quantity adjustments.
- **Stock Protection:** Atomic database transactions prevent overselling or negative inventory.
- **Customer & Payment Methods:** Support for **CASH**, **TRANSFER**, **POS (Card)**, and **OTHER**.
- **Printable Thermal Receipts:** Thermal 80mm printable layout with shop details, receipt number, itemized totals, and 1-click **WhatsApp receipt text** copy.

### 3. 📦 Inventory & Stock Movement Audit
- **Thrift Catalog:** Track size, condition (Grade A / Like New, Very Good, Good, Fair), brand, color, cost price, and selling price.
- **Dual Views:** Switch between visual product card grids and dense data tables.
- **Stock Movements Audit:** Every sale, purchase, customer return, damage, or adjustment creates an immutable `StockMovement` audit record.
- **Manual Stock Adjustments:** Authorized managers can correct counts with required audit notes.

### 4. 🚚 Purchasing & Thursday Market Intake
- **Wholesale Workflow:** Built for weekly market trips (Amarantus Clothings, Balogun, Yaba, etc.).
- **Total Investment Accounting:** Accounts for purchase bale price, market transport, gate fees, and porter costs.
- **Automatic Stock Inflow:** Recording a purchase batch automatically increments inventory quantities, updates unit cost prices, and logs `PURCHASE` stock movements.

### 5. 📅 Thursday Purchasing Planning Engine
- **30-Day Sales Window:** Calculates average weekly sales per clothing category over the previous 30 days.
- **Recommended Purchase Formula:**
  $$\text{Recommended Quantity} = \max(0, \lceil \text{Weekly Average Sales} \times 2.5 \rceil - \text{Current Stock})$$
- **Manual Overrides:** Allows shop owners to fine-tune quantities before leaving for the market.
- **Printable Market Shopping List:** Formatted printable view for physical use at the wholesale market.

### 6. 🏷️ Clearance & Stagnant Stock Markdown
- **Age Identification:** Highlights unsold inventory in stock for more than 45 days.
- **Tiered Discounts:** Suggested discount recommendations: **10%**, **15%**, **20%**, or **30% Off** (rounded to clean Naira values).
- **One-Click Application:** Marks item as `CLEARANCE`, updates selling price, and tracks clearance sales.

### 7. 📲 Social Selling Studio
- **Drop Announcements:** Select any piece in inventory to generate engaging, emoji-rich captions.
- **WhatsApp Status Ready:** Single-piece exclusivity urgency, sizing, location, and direct call to action.
- **Instagram Ready:** Formatted details, local FCT thrift hashtags, and DM order steps.
- **One-Click Copy:** Instant clipboard copy for immediate posting.

### 8. 👥 Customer Relationship Management
- **Purchase History:** Track lifetime spend, transaction count, and last purchase date.
- **Instant Connect:** Direct click-to-WhatsApp and click-to-call links.
- **Quick Registration:** Create customers directly on the fly during POS checkout.

### 9. 💸 Operating Expenses
- **Cost Categories:** `TRANSPORT`, `RENT`, `ELECTRICITY` (NEPA & generator fuel), `PACKAGING` (nylon bags & tags), `STAFF`, `MARKETING`, `MARKET_EXPENSE` (porter/gate fees), and `OTHER`.
- **Monthly Summary:** Real-time breakdown of operational overhead.

### 10. 📈 Reports & Financial Profit/Loss
- **Formula Integrity:** 
  - $\text{Gross Profit} = \text{Total Sales} - \text{Cost of Goods Sold (COGS)}$
  - $\text{Net Profit} = \text{Gross Profit} - \text{Operating Expenses}$
  *(Never calculates profit as sales minus purchase spend for the same day!)*
- **Date Filters:** Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, Custom.
- **Visual Analytics:** Category sales share, expenses breakdown, and margin percentages.

### 11. 🛡️ Staff Management & Role-Based Access Control
- **Roles:**
  - **OWNER:** Full access to all financials, settings, staff accounts, and demo data resets.
  - **MANAGER:** Sales POS, Inventory, Purchasing batches, Customers, Expenses, Reports, Clearance, Thursday Plan, and Social Selling.
  - **STAFF:** Sales POS, Customer records, and View-only inventory.
- **Audit Logs:** Complete chronological audit trail for logins, sales, purchases, adjustments, and price updates.

---

## 🎨 Design System

- **Theme:** Modern African Retail Business
- **Color Palette:**
  - Primary Brand Green: `#16803C` (Hover/Dark: `#0F5C2E`, Light: `#EAF7EE`)
  - Secondary Accent Orange: `#F28C28` (Dark: `#D96F0B`, Light: `#FFF1E2`)
  - Canvas Background: `#F8FAF9` (Off-white)
  - Cards & Surfaces: `#FFFFFF` (White with soft subtle shadow)
  - Typography: Dark Text `#17211B`, Muted Text `#66736B`, Borders `#DDE5DF`
- **Component Geometry:** 12px card border radius, rounded pill badges, large touch-friendly buttons for Android/tablets/desktops.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15+ (App Router, Server Actions, Route Handlers)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + PostCSS
- **Database:** PostgreSQL (with transaction support)
- **ORM / Schemas:** Prisma (with PostgreSQL direct connection pool)
- **Authentication:** Auth.js / Jose JWT with HTTP-only session cookies
- **Security:** bcrypt password hashing, server-side RBAC, Zod validation
- **Charts:** Recharts
- **Icons:** Lucide React

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js v18+ or v20+
- PostgreSQL database (Local, Supabase, Neon, or Railway)

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your `.env` variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/clothshop_db"
AUTH_SECRET="your-super-secure-production-secret-key"
NEXTAUTH_URL="http://localhost:3000"
DEFAULT_CURRENCY="NGN"
SHOP_NAME="Elegance Thrift Haven"
```

### 3. Database Initialization & Schema Push
```bash
# Push schema and create all 18 tables and indexes
npx prisma contract emit
npx prisma db update

# Seed realistic Nigerian thrift shop sample data
npx tsx prisma/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Demo Accounts

The database includes accounts for shop management:

| Role | Email | Password | Access Level |
|---|---|---|---|
| 👑 **Shop Owner** | `amarantus@gmail.com` | `Amarantus@123` | Full access (Financials, Staff, Settings, Reset) |
| 👑 **Shop Owner (Demo)** | `owner@clothshop.ng` | `password123` | Full access (Financials, Staff, Settings, Reset) |
| 📋 **Shop Manager** | `manager@clothshop.ng` | `password123` | Operations, Purchasing, POS, Reports, Clearance |
| 🛍️ **Shop Staff** | `staff@clothshop.ng` | `password123` | Sales POS, Customer Directory, View-only Inventory |

---

## 🧪 Automated End-to-End Verification

The codebase includes an automated test runner verifying 47 production test assertions:
```bash
node scripts/test-all-features.js
```
Verifies:
- Page rendering across mobile and desktop
- Authentication and session cookies
- Live database calculations for Today's Sales and Gross Profit
- POS cart checkout with atomic stock deduction
- Prevention of negative stock
- Printable thermal receipt generation
- Purchasing intake and auto stock increment
- Thursday purchasing recommendation engine formulas
- 45-day clearance stagnant inventory identification
- Role-based security (403 Forbidden enforcement on restricted endpoints).

---

## 🚢 Deployment to Vercel

Amarantus Clothings Manager is engineered to be deployed directly to Vercel with zero filesystem dependency:

1. **Push to GitHub / GitLab:**
   ```bash
   git init
   git add .
   git commit -m "feat: complete Amarantus Clothings Manager platform"
   git push origin main
   ```

2. **Import Project to Vercel:**
   - Log into [Vercel Dashboard](https://vercel.com).
   - Click **Add New Project** and select your repository.
   - Choose **Next.js** framework preset.

3. **Configure Environment Variables in Vercel:**
   - `DATABASE_URL`: Your production PostgreSQL connection string (Neon / Supabase / Railway / Vercel Postgres).
   - `AUTH_SECRET`: Random 32+ character string (generate with `openssl rand -base64 32`).
   - `NEXTAUTH_URL`: Your production Vercel URL (e.g. `https://clothshop-manager.vercel.app`).
   - `CLOUDINARY_CLOUD_NAME`: (Optional) Your Cloudinary cloud name.
   - `CLOUDINARY_API_KEY`: (Optional) Your Cloudinary API key.
   - `CLOUDINARY_API_SECRET`: (Optional) Your Cloudinary API secret.

4. **Deploy & Migrate Database:**
   In your Vercel project settings or via local terminal:
   ```bash
   # Run against your production database
   DATABASE_URL="<your-production-db-url>" npx prisma contract emit
   DATABASE_URL="<your-production-db-url>" npx prisma db update
   DATABASE_URL="<your-production-db-url>" npx tsx prisma/seed.ts
   ```

---

## 📜 License
Private Commercial Software for Used-Clothing Retail Business Management.
