# Deployment Guide - Enterprise SaaS

This guide explains how to deploy the full-stack application to production.

## Prerequisites
- GitHub repository with the project code.
- Accounts on:
  - [Vercel](https://vercel.com) (Frontend)
  - [Railway](https://railway.app) (Backend & Database)

---

## 1. Database Deployment (Railway)
1. Log in to Railway and create a new project.
2. Select **Provision PostgreSQL**.
3. Once provisioned, go to the **Variables** tab and copy the `DATABASE_URL`.
4. (Optional) Provision **Redis** in the same project for caching. Copy `REDIS_URL`.

---

## 2. Backend Deployment (Railway)
1. In the same Railway project, click **New** -> **GitHub Repo**.
2. Select your repository and choose the `server` directory.
3. Set the following **Environment Variables**:
   - `DATABASE_URL`: (From PostgreSQL step)
   - `REDIS_URL`: (From Redis step)
   - `ACCESS_TOKEN_SECRET`: A long random string.
   - `REFRESH_TOKEN_SECRET`: Another long random string.
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: Your Vercel frontend URL (you'll update this later).
4. Set the **Build Command**: `npm install && npx prisma generate && npm run build`
5. Set the **Start Command**: `npx prisma migrate deploy && npm start`

---

## 3. Frontend Deployment (Vercel)
1. Log in to Vercel and click **Add New** -> **Project**.
2. Select your GitHub repository.
3. In the project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
4. Set the following **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your Railway backend URL (e.g., `https://backend-production.up.railway.app/api`)
5. Click **Deploy**.

---

## 4. Final Configuration
1. Once Vercel is deployed, copy the production URL (e.g., `https://my-saas-frontend.vercel.app`).
2. Go back to Railway backend settings and update the `CLIENT_URL` variable with this Vercel URL.
3. Redeploy the backend to apply the CORS change.

---

## Common Errors & Fixes

### 1. Prisma Migration Fails
**Error**: `PrismaClientInitializationError: Can't reach database server`
**Fix**: Ensure your Railway PostgreSQL is up and the `DATABASE_URL` is correct. Check if you need to enable "Public Networking" in Railway settings.

### 2. CORS Errors
**Error**: `Access to fetch at ... has been blocked by CORS policy`
**Fix**: Double-check that `CLIENT_URL` in your backend exactly matches your frontend URL (including `https://` and NO trailing slash).

### 3. JWT Refresh Fails
**Error**: Refresh token not sent in cookies.
**Fix**: Ensure `withCredentials: true` is set in your Axios instance (already done in `api.ts`) and `sameSite: 'none'`, `secure: true` are set for cookies in production (update `authController.ts` if needed).

---

## Architecture Overview
- **Controller**: Handles HTTP requests and input validation (Zod).
- **Service**: Contains business logic and interacts with repositories.
- **Repository**: Directly interacts with the database using Prisma.
- **Prisma**: Type-safe ORM for PostgreSQL.
- **Redis**: High-speed caching for dashboard and transaction lists.
- **Next.js Middleware**: Edge-level route protection.
