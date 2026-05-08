# 🏗️ SaaS Expense Manager Architecture

## 🚀 Overview
This is a production-grade, multi-tenant financial management system built with the MERN stack (PostgreSQL instead of MongoDB for better relational consistency), Prisma ORM, and Next.js.

## 🏗️ Backend Architecture
The backend follows a strict **Layered Architecture** (Controller → Service → Repository):

1.  **Controllers**: Handle HTTP requests, parse inputs using Zod, and call services. They never touch the database directly.
2.  **Services**: Contain business logic (e.g., budget alerts, caching logic, transaction processing).
3.  **Repositories**: Encapsulate database access logic using Prisma. This ensures that data isolation (orgId filtering) is consistently applied.
4.  **Middlewares**: 
    - `authMiddleware`: JWT verification and RBAC.
    - `auditMiddleware`: Automatically logs every CREATE/UPDATE/DELETE operation.
    - `rateLimiter`: Prevents brute force and DDoS attacks.
    - `errorHandler`: Centralized error catching and standardized responses.

## 🔒 Security Measures
- **Multi-Tenancy**: Strict data isolation at the query level using `organizationId`.
- **JWT Rotation**: Access tokens are short-lived (15m). Refresh tokens are rotated on every use to prevent replay attacks.
- **RBAC**: Roles (ADMIN, ACCOUNTANT, USER) restrict access to sensitive routes like user management.
- **Helmet**: Adds security headers (XSS protection, CSP, etc.).
- **Rate Limiting**: Applied globally and more strictly on auth routes.

## ⚡ Performance Optimization
- **Redis Caching**: Expensive dashboard queries and transaction lists are cached. Cache is invalidated automatically on writes.
- **Database Indexing**: Indexes on `orgId`, `createdAt`, `category`, and `date` ensure O(1) or O(log N) retrieval.
- **N+1 Prevention**: Prisma `include` and `select` are used judiciously to fetch related data in single queries.
- **Streaming Exports**: Large CSV exports use `fast-csv` and database cursors to stream data without loading the entire dataset into RAM.

## 📊 Monitoring & Logging
- **Prometheus**: Metrics like HTTP request duration, login success/failure counts, and transaction volume are exposed via `/metrics`.
- **Structured Logging**: Using `pino` for high-performance, JSON-formatted logs suitable for ELK/Datadog.

## 🚀 Deployment & CI/CD
- **Docker**: Multi-stage production builds with non-root users.
- **CI/CD**: GitHub Actions pipeline automates linting, testing, and building on every push.

---

## 🎤 Interview Questions & Answers

### 1. Why use PostgreSQL over MongoDB for a financial app?
**Answer**: Financial systems require ACID compliance and strict relational consistency. PostgreSQL provides robust foreign keys, check constraints, and complex JOIN capabilities that are essential for maintaining financial integrity (e.g., ensuring a transaction always belongs to an existing organization).

### 2. How do you ensure data isolation in a multi-tenant system?
**Answer**: I implemented isolation at the **Repository Layer**. Every query includes a mandatory `organizationId` filter derived from the user's JWT. By centralizing this in the repository, we minimize the risk of a developer forgetting the filter in a service or controller.

### 3. What is Refresh Token Rotation and why use it?
**Answer**: It's a security strategy where a new refresh token is issued every time an old one is used to get a new access token. If an attacker steals a refresh token, they can only use it once. If the system detects a used token being reused, it revokes all active tokens for that user, assuming a breach.

### 4. How do you handle high concurrency with 10k users?
**Answer**: 
- **Horizontal Scaling**: The app is stateless and can be scaled across multiple containers.
- **Redis Caching**: Offloads 80% of read traffic from the DB.
- **Connection Pooling**: Uses Prisma's built-in pooling to manage DB connections efficiently.
- **Rate Limiting**: Protects the system from being overwhelmed by spikes in traffic.

### 5. Why use a Layered Architecture?
**Answer**: It promotes **Separation of Concerns**. Services can be tested independently of Express (controllers) and Prisma (repositories). It makes the codebase easier to navigate and maintain as the team grows.
