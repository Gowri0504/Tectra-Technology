# Tectra SaaS - Enterprise Multi-Tenant Expense & Income Manager

A production-grade, multi-tenant SaaS application built with Next.js 16, Node.js, PostgreSQL, Prisma, and Redis.

## 🚀 Key Features

- **Multi-Tenant Isolation**: Strict data isolation at the database level using `organizationId`.
- **Enterprise Auth**: JWT with short-lived access tokens and secure refresh token rotation/reuse detection.
- **RBAC**: Role-based access control (ADMIN, ACCOUNTANT, USER) with granular permission checks.
- **Financial Consistency**: Atomic operations using Prisma transactions for all financial data.
- **Advanced Analytics**: Interactive dashboards and deep-dive analytics using Recharts.
- **High Performance**: Redis caching, DB indexing, and optimized aggregation queries.
- **Scalable Exports**: Cursor-based streaming for large CSV datasets.
- **Production Ready**: Multi-stage Docker builds, health checks, and CI/CD pipelines.

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS + Framer Motion
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma + PostgreSQL
- **Cache**: Redis
- **Security**: Helmet, Rate Limiting, Bcrypt
- **Logging**: Pino

## 🏗 Architecture

The project follows a **Layered Architecture (N-Tier)**:
1. **Controller Layer**: Request handling and input validation.
2. **Service Layer**: Business logic and transaction orchestration.
3. **Repository Layer**: Data access and Prisma query optimization.

## 🚦 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### Installation

1. Clone the repository
2. Set up environment variables:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
3. Start the infrastructure:
   ```bash
   docker-compose up --build
   ```

## 🛡 Security

- **JWT Rotation**: Every refresh token usage generates a new pair and revokes the old one.
- **HTTP-Only Cookies**: Refresh tokens are stored in secure, HttpOnly cookies to prevent XSS.
- **CSRF Protection**: SameSite cookie policy combined with frontend state management.
- **Audit Logging**: Every sensitive action (login, create, update, delete) is logged with actor and timestamp.

## 📈 Scalability

- **Database**: Indexed for O(log N) lookups on tenant and date fields.
- **Concurrency**: Designed to handle 10k+ concurrent users through stateless design and caching.
- **Memory**: Streaming exports ensure constant memory footprint regardless of dataset size.

## 📄 License

ISC License. Built for Tectra Technology Assessment.
