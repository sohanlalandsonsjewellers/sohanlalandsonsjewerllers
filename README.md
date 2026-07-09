# 💎 Sohan Lal and Sons Jewellers — Backend API

A production-ready **TypeScript + Express + Prisma + MongoDB** backend powering the Sohan Lal and Sons Jewellers management system (Users, Products, Bills, Authentication, PDF Invoices, Exports, WhatsApp, Email).

---

## 🚀 Features

### ⚙️ Modern Tech Stack
- TypeScript (strict mode)
- tsx runtime (native ESM)
- Express.js API structure
- Prisma ORM (MongoDB Connector)
- Modular controllers & routes

### 🔐 Authentication & Security
- JWT-based authentication
- Password hashing
- Admin role verification (middleware)
- Protected routes
- Rate limiting (10,000 requests / 5 minutes)
- Secure session handling

### 📑 Billing / Invoice System
- Auto-invoice number generator
- Bill creation with GST calculation
- PDF invoice generation
- Base64 PDF output
- Excel export (base64)
- WhatsApp message support
- Email invoice sending

### 🧩 Additional
- Multi-environment support (`.env`, `.env.dev`, `.env.prod`)
- Scalable production-ready structure
- Static file serving for shop logo & invoice resources
- GZip PDF compression for faster transfer

---

## 📁 Folder Structure

```
SOHANLALANDSONSJEWELLERS/
│
├── prisma/
│   └── schema.prisma
│
├── public/                 # static files (logo, banners, etc.)
│   └── Shop.jpg
│
├── src/
│   ├── config/
│   │   └── db.config.ts
│   ├── controller/
│   │   ├── AuthController.ts
│   │   ├── UserController.ts
│   │   ├── ProductController.ts
│   │   └── BillController.ts
│   │
│   ├── middleware/
│   │   ├── AuthMiddleware.ts
│   │   └── AdminMiddleware.ts
│   │
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── productRoutes.ts
│   │   ├── billRoutes.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── invoiceTemplate.ts
│   │   ├── pdfBuffer.ts
│   │   ├── counter.ts
│   │   ├── invoice.ts
│   │   └── email.ts
│   │
│   └── server.ts
│
├── tsconfig.json
├── package.json
├── .env
├── .env.dev
└── README.md
```

---

## ⚙️ Environment Setup

### 1️⃣ Prerequisites
- Node.js ≥ 18  
- npm ≥ 9  
- MongoDB Atlas or Local MongoDB  
- Prisma CLI  

Install Prisma:
```bash
npm install prisma --save-dev
```

---

## 2️⃣ Clone & Install

```bash
git clone https://github.com/yourusername/SohanLalAndSonsJewellers.git
cd backend
npm install
```

---

## 3️⃣ Environment Variables

### 📌 `.env.dev`
```
SERVER_URL=http://localhost:8000
PORT=8000
NODE_ENV=development

DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/jewellery"

JWT_SECRET="dev-secret"
SESSION_SECRET="dev-session"

CORS_ORIGIN="http://localhost:3000"
```

### 📌 `.env`
```
SERVER_URL=https://yourdomain.com
PORT=8000
NODE_ENV=production

DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/jewellery"

JWT_SECRET="prod-secret"
SESSION_SECRET="prod-session"

CORS_ORIGIN="*"
```

---

## 🧩 Prisma

Generate Client:
```bash
npx prisma generate
```

Open Prisma Studio:
```bash
npx prisma studio
```

MongoDB does NOT use migration system.

---

## 🧠 NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run development server with .env.dev |
| `npm run serve` | Run production server |
| `npm start` | Normal Node server |
| `npm run generate` | Generate keys (utility) |

---

## 🧱 Components Overview

| Folder | Description |
|--------|-------------|
| `src/config` | DB config, Prisma connect |
| `src/controller` | Business logic |
| `src/routes` | Route definitions |
| `src/middleware` | JWT, Admin verification |
| `src/utils` | PDF, Counter, Email, Invoice Template |
| `prisma` | Database schema |

---

## 🔧 Security

- **express-rate-limit** applied globally  
- **express-session** for secure session management  
- **CORS** dynamic based on environment  
- **JWT** encrypted with env secret  

---


# Analytics Module

Responsible for collecting user behaviour.

Current Features

- Product View
- Search
- Cart
- Wishlist
- Orders

Future

- Recommendation Dataset
- Customer Segmentation
- Sales Forecast
- AI Personalization

## 🧾 License
Private & Proprietary — Developed for **Sohan Lal and Sons Jewellers (SLSJ)**.

---

## 👨‍💻 Author
**Hariom Verma**  
📧 Email: *your email*  
🌐 Website: *optional*  
