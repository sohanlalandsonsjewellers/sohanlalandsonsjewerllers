<div align="center">

# 💎 Sohan Lal And Sons Jewellers

### Backend Documentation

**Enterprise Grade REST API**

Built using TypeScript • Express • Prisma • MongoDB • JWT

AI Ready Backend Architecture

![NodeJS](https://img.shields.io/badge/Node.js-24-green)
![Express](https://img.shields.io/badge/Express-5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![JWT](https://img.shields.io/badge/Auth-JWT-success)
![Analytics](https://img.shields.io/badge/AI-Analytics-purple)
![License](https://img.shields.io/badge/License-Private-red)

</div>

---

## 📑 Table of Contents

- [About the Backend](#-about-the-backend)
- [Objectives](#-objectives)
- [Core Features](#-core-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-backend-architecture)
- [Project Structure](#-backend-project-structure)
- [Folder Description](#-folder-description)
- [Installation Guide](#️-installation-guide)
- [Environment Configuration](#-environment-configuration)
- [Prisma ORM](#-prisma-orm)
- [Authentication System](#-authentication-system)
- [REST API Documentation](#-rest-api-documentation)
- [Analytics APIs](#-analytics-apis)
- [AI Dataset Architecture](#-ai-dataset-architecture)
- [Security](#-security)
- [Performance Optimization](#-performance-optimization)
- [Deployment](#-deployment)
- [AI Roadmap](#-artificial-intelligence-roadmap)
- [Version Roadmap](#-version-roadmap)
- [Author](#-author)
- [License](#-license)

---

## 📖 About the Backend

The backend powers the complete **Sohan Lal And Sons Jewellers** luxury jewellery e-commerce platform. It is designed as a scalable, enterprise-grade REST API supporting:

- Authentication
- Products
- Orders
- Billing
- Shipping
- Analytics
- AI-ready dataset collection

The project follows modular architecture, REST principles, type safety, clean code, and production-ready practices.

---

## 🎯 Objectives

The backend has been designed to:

- ✅ Handle millions of API requests
- ✅ Separate business logic
- ✅ Support future AI modules
- ✅ Maintain secure authentication
- ✅ Provide scalable APIs
- ✅ Support research work

---

## 🚀 Core Features

### 🔐 Authentication
JWT authentication · Login/Register · Protected APIs · Admin authorization · Password hashing · Session validation

### 👥 User Module
User registration & login · Profile · Admin users · Customer users · JWT verification

### 💎 Product Module
Product CRUD · Categories & sub-categories · Images · Search · Stock management · SKU · Inventory

### 🛒 Cart Support
Cart validation · Stock validation · Quantity validation · Product availability

### ❤️ Wishlist Support
**Current:** add/remove wishlist
**Future:** personalized wishlist

### 📦 Order Module
Create order · Update status · Shipping · Courier selection · GST calculation · Order history

### 📑 Billing Module
Auto invoice · GST · PDF invoice · Base64 PDF · Excel export · WhatsApp invoice · Email invoice

### 🚚 Shipping Module
**Current:** shipping charges, courier selection, delivery charges
**Future:** shipment tracking, live courier updates

### 📊 Analytics Module
**Tracks:** product view, product click, search, wishlist, cart, orders
**Future:** recommendation dataset, customer segmentation, demand forecasting, AI personalization

---

## 🧠 AI-Ready Backend

Unlike traditional REST APIs, this backend continuously records customer behaviour. These records will later become training datasets for Machine Learning.

---

## 🏗 Technology Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Language** | TypeScript (strict mode enabled) |
| **Framework** | Express.js |
| **ORM** | Prisma (MongoDB connector) |
| **Database** | MongoDB Atlas |
| **Authentication** | JWT |
| **Validation** | Express middleware |
| **AI Stack (future)** | Python · FastAPI · Pandas · NumPy · Scikit-learn · TensorFlow · PyTorch |

---

## 🏛 Backend Architecture

```
                Client
                  │
                  ▼
           Express Router
                  │
                  ▼
             Middleware
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
Authentication  Controllers  Analytics
      │           │           │
      └───────────┼───────────┘
                  ▼
            Prisma ORM
                  │
                  ▼
           MongoDB Atlas
                  │
                  ▼
     Future Dataset Generator
                  │
                  ▼
          Machine Learning
                  │
                  ▼
       Recommendation Engine
```

---

## 📈 Behaviour Analytics

The backend continuously collects customer activities.

**Current events:**
`PRODUCT_VIEW` · `PRODUCT_CLICK` · `SEARCH` · `ADD_TO_CART` · `REMOVE_FROM_CART` · `ADD_TO_WISHLIST` · `REMOVE_FROM_WISHLIST` · `ORDER_CREATED`

**Every event stores:** user, product, timestamp, metadata, browser, device, page.

This architecture has been intentionally designed to support future AI models.

---

## 🎓 Academic Purpose

| | |
|---|---|
| **Program** | M.Tech — Artificial Intelligence & Data Science |
| **Institute** | Indian Institute of Technology Patna |
| **Research Focus** | AI commerce, recommendation systems, behaviour analytics, customer intelligence, data science |

---

## 📌 Design Principles

SOLID principles · Clean architecture · Modular structure · Separation of concerns · RESTful APIs · Type safety · Enterprise scalability · AI-ready design

---

## 📁 Backend Project Structure

```
backend/
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── README.md
│
├── public/
│   ├── Shop.jpg
│   ├── invoice/
│   ├── logo/
│   └── uploads/
│
├── src/
│   ├── analytics/
│   │   ├── controller/
│   │   ├── routes/
│   │   ├── service/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── config/
│   │   ├── db.config.ts
│   │   ├── env.ts
│   │   ├── cloudinary.ts
│   │   ├── mail.ts
│   │   └── logger.ts
│   │
│   ├── controller/
│   │   ├── AuthController.ts
│   │   ├── UserController.ts
│   │   ├── ProductController.ts
│   │   ├── OrderController.ts
│   │   ├── BillController.ts
│   │   ├── ShippingController.ts
│   │   └── ...
│   │
│   ├── middleware/
│   │   ├── AuthMiddleware.ts
│   │   ├── AdminMiddleware.ts
│   │   ├── ErrorMiddleware.ts
│   │   ├── UploadMiddleware.ts
│   │   └── RateLimiter.ts
│   │
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── productRoutes.ts
│   │   ├── orderRoutes.ts
│   │   ├── shippingRoutes.ts
│   │   ├── analyticsRoutes.ts
│   │   └── index.ts
│   │
│   ├── service/
│   │   ├── ShippingService.ts
│   │   ├── MailService.ts
│   │   ├── AnalyticsService.ts
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── invoice.ts
│   │   ├── invoiceTemplate.ts
│   │   ├── pdfBuffer.ts
│   │   ├── counter.ts
│   │   ├── email.ts
│   │   ├── helper.ts
│   │   └── ...
│   │
│   ├── types/
│   ├── constants/
│   ├── interfaces/
│   ├── validators/
│   │
│   ├── app.ts
│   └── server.ts
│
├── .env
├── .env.dev
├── .env.prod
├── tsconfig.json
├── package.json
└── README.md
```

---

## 📂 Folder Description

| Folder | Description |
|---|---|
| **prisma/** | Complete database schema — models, collections, indexes, relations, Prisma client. Main file: `schema.prisma`. Future: seed scripts, backup scripts. |
| **public/** | Public static assets — shop logo, invoice images, uploads, static files. No business logic here. |
| **src/** | Main application source code — every backend module starts here. |
| **analytics/** | Dedicated behaviour analytics module — event collection, behaviour tracking, dataset generation, AI-ready data. Sub-modules: `controller/`, `routes/`, `service/`, `types/`, `utils/`. Future: recommendation dataset, funnel analysis, customer journey, session analytics. |
| **config/** | App configuration — Prisma connection, environment variables, Cloudinary, mail, logger. Initializes services, loads environment, configures external providers. |
| **controller/** | Complete business logic — validation, service calls, responses, error handling. Current: Auth, User, Product, Order, Bill, Shipping. |
| **middleware/** | Request lifecycle processing — JWT authentication, admin authorization, error handling, upload handling, rate limiting. Future: audit logs, API monitoring, API metrics. |
| **routes/** | Defines all API endpoints. Routes never contain business logic — controllers handle all processing. |
| **service/** | Reusable business services — Shipping, Analytics, Mail. Benefits: reusability, separation of concerns, easier testing. |
| **utils/** | Utility helpers — invoice generator, PDF buffer, email, counter, helpers. Remain independent from controllers. |
| **types/** | Shared TypeScript types for type safety, reusable interfaces, and better IntelliSense. |
| **interfaces/** | Reusable interfaces — Auth payload, Order payload, Analytics payload. |
| **validators/** | Input validation. Future: Zod, Joi, Express Validator — for clean controllers and better error messages. |
| **constants/** | Application constants — roles, status, event types, messages, configuration values. |

### Key Files

| File | Responsibility |
|---|---|
| `db.config.ts` | Creates the Prisma Client — MongoDB connection, singleton Prisma instance. |
| `env.ts` | Loads `.env`, `.env.dev`, `.env.prod`. |

### AuthMiddleware & AdminMiddleware

- **AuthMiddleware** — verifies the JWT token and adds `req.user`.
- **AdminMiddleware** — allows access only when `adminRole == true`.

---

## 🏛 Layered Backend Architecture

```
Client → Routes → Middleware → Controllers
       → Services → Prisma ORM → MongoDB Atlas
```

## 🔄 Request Lifecycle

```
Incoming Request → Express Route → JWT Middleware
     → Admin Middleware → Controller → Business Service
     → Prisma → MongoDB → JSON Response
```

## 🎯 Backend Design Principles

Modular development · SOLID principles · Clean code · Thin controllers · Reusable services · REST standards · Dependency separation · Enterprise scalability · AI-ready architecture

> Controllers should never directly contain heavy business logic — business rules belong inside the Service layer.

---

## ⚙️ Installation Guide

Built using **Node.js**, **Express**, **TypeScript**, **Prisma ORM**, and **MongoDB Atlas**.

### 📋 Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- MongoDB Atlas account
- Git

### 📥 Clone & Install

```bash
git clone https://github.com/yourusername/SohanLalAndSonsJewellers.git
cd backend
npm install
```

---

## 🌍 Environment Configuration

The project supports multiple environments: `.env`, `.env.dev`, `.env.prod`

**Development**
```env
SERVER_URL=http://localhost:8000
PORT=8000
NODE_ENV=development
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jewellery
JWT_SECRET=your-secret
SESSION_SECRET=your-session
CORS_ORIGIN=http://localhost:3000
```

**Production**
```env
SERVER_URL=https://your-domain.onrender.com
PORT=8000
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jewellery
JWT_SECRET=production-secret
SESSION_SECRET=production-session
CORS_ORIGIN=https://your-frontend.vercel.app
```

---

## 🗄 Prisma ORM

Uses **Prisma ORM** with the **MongoDB connector**.

```bash
npx prisma generate     # Generate Prisma Client
npx prisma studio       # Open Prisma Studio
```

**Workflow:**
```
schema.prisma → Prisma Generate → Prisma Client → Controllers → MongoDB
```

### 📊 Database Design

| Current Collections | Future Collections |
|---|---|
| User, Product, Order, Bill, Event, Counter | Recommendation, CustomerSegment, Forecast, Notification |

---

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs backend using development configuration |
| `npm run serve` | Runs the production server |
| `npm start` | Standard Node execution |
| `npm run generate` | Utility scripts |

### 🚀 Express Server Startup

```
server.ts → Express App → Environment
          → Prisma Connection → Middlewares → Routes → Server Listening
```

---

## 🔐 Authentication System

Uses **JWT**.

```
Register → Password Hash → MongoDB → Login → JWT
         → Frontend → Authorization Header → Protected APIs
```

### 🔑 JWT Payload Example

```json
{
  "id": "USER_ID",
  "name": "Hariom",
  "email": "user@gmail.com",
  "phoneNumber": "9876543210",
  "adminRole": true,
  "iat": 123456,
  "exp": 123456
}
```

### 🔒 Password Security

Passwords are never stored in plain text.

```
Register:  Password → Hash → Database
Login:     Password → Hash Compare → JWT
```

### 🛡 Middleware Flow

```
Incoming Request → Rate Limiter → CORS → JSON Parser
     → Authentication → Admin Check → Controller
     → Prisma → MongoDB → Response
```

### 🧩 Controller Responsibilities

**Controllers should:** validate input, call services, return responses, handle exceptions.

**Controllers should NOT:** perform database-heavy logic, contain reusable business rules, or generate datasets — those belong to the Service layer.

### 🧠 Service Layer

Business logic lives here — shipping calculation, analytics processing, invoice generation, email sending, WhatsApp formatting. Future: recommendation engine, dataset generator, AI prediction.

### 📦 Standard Response Format

```json
// Success
{ "success": true, "data": {} }
```
```json
// Error
{ "success": false, "message": "Unauthorized" }
```

---

## 📡 REST API Documentation

All requests follow: `Client → Express Route → Middleware → Controller → Service → Prisma → MongoDB → JSON Response`. All APIs return JSON.

### 🌐 API Base URL

| Environment | URL |
|---|---|
| Development | `http://localhost:8000/api` |
| Production | `https://your-backend.onrender.com/api` |

### 🔐 Authentication APIs

**Register**
```
POST /auth/register
```
```json
// Request
{
  "name": "Hariom",
  "email": "hariom@gmail.com",
  "password": "********",
  "phoneNumber": "9876543210"
}
```
```json
// Response
{ "success": true, "user": {} }
```

**Login**
```
POST /auth/login
```
Returns JWT token and user information.

**Profile**
```
GET /auth/profile
Authorization: Bearer JWT
```
Returns the current user.

### 👤 User APIs *(Admin only)*

```
GET    /users
POST   /users
PUT    /users/:id
DELETE /users/:id
```

### 💎 Product APIs

```
GET    /products          # Supports search, category, pagination, filters
GET    /products/:id
POST   /products           # Requires Admin JWT
PUT    /products/:id
DELETE /products/:id
```

### 📦 Order APIs

**Create Order**
```
POST /orders
```
Handles stock validation, GST, shipping, order creation, and analytics.

```
GET   /orders               # Admin only
GET   /orders/my-orders     # Customer orders
PATCH /orders/:id           # Update order status — future: shipment/delivery status
```

### 🚚 Shipping APIs

**Current:** shipping charges, courier selection, delivery cost
**Future:** shipment tracking, courier webhooks

### 📑 Billing APIs

Supports invoice generation, PDF, Excel, WhatsApp, and email.

```
POST /bill                # Create bill
GET  /bill/:id/pdf         # Download PDF
POST /bill/email           # Email invoice
POST /bill/whatsapp        # WhatsApp invoice
```

---

## 📊 Analytics APIs

```
POST /analytics/track
```

```json
{
  "eventType": "PRODUCT_VIEW",
  "productId": "...",
  "page": "/product/123",
  "metadata": {
    "productName": "Ring",
    "price": 2500
  }
}
```

### 📈 Supported Events

| Event | Purpose |
|---|---|
| `PRODUCT_VIEW` | Product viewed |
| `PRODUCT_CLICK` | Product clicked |
| `SEARCH` | User search |
| `ADD_TO_CART` | Shopping intent |
| `REMOVE_FROM_CART` | Cart abandonment |
| `ADD_TO_WISHLIST` | Favourite products |
| `REMOVE_FROM_WISHLIST` | Preference changes |
| `ORDER_CREATED` | Purchase completed |

### 📊 Analytics Database

Each event stores: user, product, order, browser, OS, device, IP address, page, timestamp, metadata.

```json
{
  "eventType": "ORDER_CREATED",
  "userId": "...",
  "productId": "...",
  "orderId": "...",
  "page": "/checkout",
  "metadata": {
    "subtotal": 2100,
    "shipping": 96,
    "gst": 63
  }
}
```

---

## 🤖 AI Dataset Architecture

```
Analytics Events → MongoDB → Dataset Generator → CSV
     → Pandas → Feature Engineering → Machine Learning
```

### 🧠 Planned Machine Learning Models

Recommendation engine · Customer segmentation · Purchase prediction · Demand forecasting · Frequently bought together · Trending products

### 📈 Recommendation Flow (Example)

```
Customer → Viewed Ring → Viewed Necklace → Added Necklace
         → Purchased Necklace → Recommendation Engine → Suggested Earrings
```

### 📊 Behaviour Funnel

```
SEARCH → PRODUCT_CLICK → PRODUCT_VIEW
       → ADD_TO_WISHLIST → ADD_TO_CART → ORDER_CREATED
```

Enables conversion analysis, drop-off detection, and marketing insights.

### Behaviour Tracking Details

| Area | Currently Captured | Future |
|---|---|---|
| **Cart** | Product, quantity, SKU, price, timestamp | Cart value, abandonment prediction |
| **Wishlist** | Favourite products, wishlist growth, product popularity | Personalized recommendations, inventory planning |
| **Search** | Query, source, timestamp | AI search, semantic search, search ranking |
| **Orders** | Products, courier, shipping charges, GST, total | Repeat purchase prediction, CLV, market basket analysis |

---

## 🔄 API Design Principles

REST standards · JSON responses · JWT authorization · HTTP status codes · Centralized error handling · Consistent response format · Modular controller design

---

## 🔒 Security

Every API request passes through multiple security layers before reaching business logic.

**Current features:** JWT authentication · Role-based authorization · Password hashing · Express rate limiting · Environment variables · CORS protection · Secure session handling · Request validation · Error handling · Hidden secrets

### 🔐 Authentication Security Flow

```
Client → Login API → Password Verification → JWT Generation
       → Frontend Storage → Authorization Header → Protected APIs
```

JWT contains: user ID, name, email, phone number, admin role, issued time, expiration time. Passwords are never stored in plain text.

### 🛡 Authorization (RBAC)

| Role | Access |
|---|---|
| **Customer** | Login, register, profile, orders, wishlist, checkout |
| **Administrator** | Create/update/delete product, users, analytics dashboard, orders management, billing, shipping |

### 🚦 Rate Limiting

Global rate limiting protects the server against abuse — example: **10,000 requests per 5 minutes**.
Future: Redis rate limiter, IP-based blocking, DDoS protection.

### 🌍 CORS Configuration

| Environment | Origin |
|---|---|
| Development | `http://localhost:3000` |
| Production | `https://your-frontend.vercel.app` |

Only trusted origins should be allowed.

### 🔑 Environment Variables

Never commit sensitive values: `DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, `MAIL_PASSWORD`, `CLOUDINARY_SECRET`

**Production recommendations:** Render environment variables, GitHub secrets, Vercel environment variables. ❌ Never push secrets to GitHub.

---

## ⚡ Performance Optimization

**Current:** singleton Prisma client · modular routes · lightweight controllers · utility functions · reusable services
**Future:** Redis cache · CDN · background jobs · queue processing

### 📊 Database Performance

**Current:** indexed collections, Prisma Client, MongoDB Atlas
**Future:** compound indexes, query optimization, read replicas, sharding

### 📈 Analytics Performance

Analytics collection is intentionally lightweight.

```
Current: Frontend → Analytics API → MongoDB → Response
Future:  Analytics API → Queue → Worker → MongoDB
```

This prevents analytics from slowing down user requests.

### 📨 Email & 📄 PDF Performance

| | Current | Future |
|---|---|---|
| **Email** | Direct sending | Background queue, retry mechanism, templates, SMTP pooling |
| **PDF** | On-demand generation, Base64 response, compression | Cached PDFs, background generation |

---

## ☁ Deployment

```
Frontend → Vercel → Backend → Render → MongoDB Atlas
```

### 🚀 Production Deployment Checklist

- ✔ Environment variables
- ✔ Prisma generate
- ✔ Build
- ✔ Start server
- ✔ Database connected
- ✔ CORS configured
- ✔ JWT secret configured
- ✔ HTTPS enabled

### 📋 Build Process

```bash
npm run dev      # Development
npm run build    # Production build
npm run serve    # Start server
```

---

## 🧪 Testing Strategy

**Current:** manual testing, Postman, frontend integration
**Future:** Jest (unit), Supertest (API), k6/Artillery (load testing)

## 📈 Logging

**Current:** console logs
**Future:** Winston, Pino, cloud logging, audit logs

## 📊 Monitoring

**Recommended:** Render monitoring, MongoDB Atlas metrics, Uptime Robot, Google Analytics, Microsoft Clarity
**Future:** Grafana, Prometheus

## 📦 Scalability

Designed for horizontal growth — future services include notification service, recommendation service, analytics dashboard, inventory prediction, search engine, payment gateway, and AI assistant, without requiring major architectural changes.

---

## 🧩 Coding Standards

TypeScript strict mode · SOLID principles · RESTful APIs · Modular architecture · Thin controllers · Reusable services · Clean folder structure · Consistent naming

## 📚 Best Practices

✔ Business logic inside services · ✔ Controllers remain lightweight · ✔ Middleware handles authentication · ✔ Environment variables for secrets · ✔ Consistent API responses · ✔ Proper HTTP status codes · ✔ Modular project structure · ✔ AI-ready analytics collection

## 🛡 Production Checklist

Database connected · Prisma generated · Environment variables added · JWT secret configured · CORS updated · HTTPS enabled · Logging enabled · Error handling verified · Analytics working · Health check tested

---

## 🎯 Backend Responsibilities

The backend is responsible for authentication, authorization, products, orders, billing, shipping, analytics, invoice generation, email, WhatsApp, and AI dataset collection.

> The frontend should never access the database directly — all communication must occur through secure REST APIs.

---

## 🤖 Artificial Intelligence Roadmap

The backend serves as the data collection layer for future AI and Machine Learning models. The current implementation focuses on collecting high-quality customer behaviour while maintaining a clean, scalable architecture. Future releases will transform these behavioural events into intelligent recommendation systems and predictive analytics.

### 🧠 Machine Learning Pipeline

```
Customer → Frontend Events → Analytics API → Express Backend
        → MongoDB → Dataset Generator → CSV/JSON Dataset
        → Python → Pandas → Feature Engineering
        → Machine Learning → FastAPI → Recommendation API → Frontend
```

### 📊 Behaviour Dataset

Events: `PRODUCT_VIEW` · `PRODUCT_CLICK` · `SEARCH` · `ADD_TO_CART` · `REMOVE_FROM_CART` · `ADD_TO_WISHLIST` · `REMOVE_FROM_WISHLIST` · `ORDER_CREATED`

Each event stores: user, product, order, browser, device, OS, page, timestamp, metadata, IP address — these become the training dataset for future AI models.

### 🤖 Planned AI Modules

| Module | Details |
|---|---|
| **Recommendation Engine** | Based on recently viewed, similar customers, purchase history, wishlist, cart behaviour, frequently bought together |
| **Customer Segmentation** | K-Means, DBSCAN, hierarchical clustering — outputs VIP, premium, new, and returning customers |
| **Demand Forecasting** | Predicts future sales, festival demand, inventory — Prophet, ARIMA, LSTM |
| **Smart Search** | Semantic search, natural language search, AI ranking, query correction, similar products |
| **AI Shopping Assistant** | Jewellery recommendation, product search, order tracking, FAQ, personalized suggestions |

### 📈 Recommendation Architecture

```
Behaviour Events → MongoDB → Dataset Generator → Feature Engineering
     → Recommendation Model → FastAPI → REST API → Frontend
```

### 📚 Research Paper Potential

**Possible topics:** AI-powered jewellery recommendation system · Behaviour analytics in e-commerce · Customer purchase prediction · Intelligent retail analytics · MERN-based AI commerce platform

**Potential publication targets:** IEEE · Springer · Elsevier · Scopus-indexed journals

---

## 🎓 Academic Information

| | |
|---|---|
| **Degree** | Master of Technology |
| **Specialization** | Artificial Intelligence & Data Science |
| **Institute** | Indian Institute of Technology Patna |
| **Research Areas** | AI, Machine Learning, Deep Learning, Data Science, Recommendation Systems, Behaviour Analytics |

## 🏗 Software Architecture Principles

SOLID principles · Clean architecture · Separation of concerns · Thin controllers · Service layer pattern · Repository pattern via Prisma ORM · Dependency isolation · Modular design · Enterprise scalability

---

## 📦 Version Roadmap

### v1.0 — ✅ Completed
Authentication · Users · Products · Orders · Billing · Shipping · Analytics · PDF · Email · WhatsApp

### v2.0 — Planned
Analytics dashboard · Recommendation dataset · Product ranking · Search analytics · Inventory dashboard

### v3.0 — Planned
Recommendation engine · Customer segmentation · Demand forecasting · AI search · Personalized shopping · AI assistant

---

## 🗺 Development Timeline

| Phase | Modules | Progress |
|---|---|---|
| **Phase 1** | Authentication, Products, Orders, Billing, Analytics | ████████████████████ Complete |
| **Phase 2** | Analytics Dashboard | ████████░░░░░░░░░░░ In progress |
| | Recommendation Dataset | ██████░░░░░░░░░░░░░ In progress |
| | Inventory Prediction | ███░░░░░░░░░░░░░░░░ Early stage |
| **Phase 3** | Machine Learning | ██░░░░░░░░░░░░░░░░░ Planned |
| | Recommendation Engine | ██░░░░░░░░░░░░░░░░░ Planned |
| | AI Assistant | ░░░░░░░░░░░░░░░░░░░ Planned |

---

## 🤝 Contributing

Currently this project is private. Recommended future workflow:

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push the branch
5. Open a pull request

---

## 📦 Deployment Architecture

```
Frontend (React) → Vercel → Backend (Express) → Render
     → MongoDB Atlas → Cloudinary
     → Analytics Module → Future AI Services
```

---

## 🙏 Acknowledgements

Special thanks to Node.js, Express.js, TypeScript, Prisma, MongoDB, React, Material UI, and the open-source community.

---

## 📄 License

**Private & Proprietary**
Copyright © 2026 Sohan Lal And Sons Jewellers. All Rights Reserved.

This software has been developed exclusively for Sohan Lal And Sons Jewellers. Unauthorized copying, modification, distribution, or commercial use is strictly prohibited without written permission.

---

## 👨‍💻 Author

**Hariom Verma**
Master of Technology (M.Tech) — Artificial Intelligence & Data Science
Indian Institute of Technology Patna

| Area | Skills |
|---|---|
| **Backend** | Node.js, Express.js, TypeScript, Prisma ORM, MongoDB |
| **Frontend** | React, Material UI, TypeScript |
| **Artificial Intelligence** | Python, Pandas, NumPy, Scikit-learn, TensorFlow, PyTorch |
| **Research Interests** | Artificial Intelligence, Machine Learning, Recommendation Systems, Behaviour Analytics, Intelligent Commerce |

---

## ⭐ Project Summary

Sohan Lal And Sons Jewellers Backend is an enterprise-grade, AI-ready backend platform designed to power a modern jewellery e-commerce ecosystem. The architecture combines Express.js, TypeScript, Prisma ORM, MongoDB Atlas, JWT authentication, analytics, shipping, billing, PDF generation, email, and WhatsApp integration — while laying the foundation for machine learning, recommendation systems, customer analytics, demand forecasting, and AI-powered commerce.

This backend is suitable for production deployment, academic research, M.Tech project submission, future research publications, and enterprise-scale development.

<div align="center">

### ⭐ Thank You ⭐

If this project helped you, consider giving it a ⭐ on GitHub.

*Built with ❤️ by Hariom Verma*
**M.Tech (AI & Data Science) — Indian Institute of Technology Patna**

</div>
