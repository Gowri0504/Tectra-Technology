# 🚀 Tectra-Technology: Enterprise Multi-Tenant SaaS Expense Manager

An enterprise-grade, production-ready SaaS system built for high scalability, strict security, and comprehensive observability.

## 🏗 Architecture
The system follows a **Layered Architecture** (Controller-Service-Repository) for the backend and **Next.js App Router** for the frontend, ensuring modularity and clean separation of concerns.

### Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, React Query, Lucide Icons, next-themes.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM.
- **Data & Cache**: PostgreSQL, Redis.
- **Async Processing**: BullMQ (Background Jobs).
- **Observability**: Prometheus, Pino (Structured Logging).
- **DevOps**: Docker, Docker Compose, GitHub Actions.

## ✨ Advanced Features
- **🔐 Security**: 
  - JWT Refresh Token Rotation with reuse detection.
  - Hashed tokens stored in DB.
  - Login throttling (brute-force protection).
  - Device tracking (IP & User-Agent).
- **🏢 Multi-Tenancy**: 
  - Strict isolation enforced at JWT, Middleware, and Repository levels.
- **📊 Performance**: 
  - Redis caching for dashboard aggregates.
  - Cursor-based pagination.
  - Optimized Prisma queries.
- **📁 File Export**: 
  - Queue-based background CSV export using BullMQ.
  - Streaming large datasets.
- **🧾 Audit System**: 
  - Full audit logging of all CUD operations.
- **📈 Monitoring**: 
  - `/metrics` endpoint for Prometheus.
  - Request ID tracing across all logs.
- **🎨 UI/UX**: 
  - Dark Mode support.
  - Role-based rendering.
  - Dynamic Transaction Tags & Budget Alerts.

## 🚀 Setup Guide

### Docker Setup (Recommended)
The project is optimized for Docker with multi-stage builds and Node 20+ compatibility for Prisma v7.

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d
```

### Troubleshooting
- **Node Version**: Prisma v7 requires Node 20+. The Docker containers are configured to use `node:20-alpine`. If running locally, ensure your Node version is 20 or higher.
- **Database Connection**: The backend waits for the database to be healthy before starting. If the database fails to start, check the logs: `docker-compose logs db`.
- **Prisma Migrations**: In Docker, migrations are automatically applied on startup using `prisma migrate deploy`.

## 🏗 Architecture
The system follows an **Enterprise Layered Architecture**:
- **API Layer**: Express controllers with Zod validation.
- **Service Layer**: Business logic, cache management, and background job triggering.
- **Repository Layer**: Data access using Prisma with multi-tenant isolation.
- **Async Workers**: BullMQ workers for background tasks (e.g., CSV exports).

## 📈 Performance & Scaling
- **Caching**: Redis is used to cache dashboard summaries and transaction lists with an intelligent invalidation strategy.
- **Indexing**: Database fields like `organizationId`, `date`, and `category` are indexed for O(1) or O(log N) lookup speeds.
- **Monitoring**: Real-time metrics available at `/metrics` for Prometheus integration.
- **Health Checks**: Every service has integrated health checks for high availability.

---
Built with ❤️ for Tectra Technology Assessment.
