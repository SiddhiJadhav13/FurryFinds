# Verifies - Full-Stack Pet Marketplace

Verifies is a modern, responsive pet marketplace with separate client and admin dashboards. It supports secure authentication, pet listing management, adoption/purchase requests, wishlist, profile management, and a pet-care knowledge hub.

## Tech Stack

- Frontend: Next.js (App Router), React, Framer Motion
- Backend: Node.js, Express, JWT auth, Nodemailer
- Database: MongoDB (Mongoose)
- File Uploads: Multer
- Deployment Targets: Vercel (frontend), Render (backend)

## Project Structure

- `client/` - Next.js frontend
- `server/` - Express API backend

## Setup

### 1. Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Set values in `server/.env`:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- `ADMIN_SIGNUP_KEY`

### 2. Frontend

```bash
cd client
cp .env.local.example .env.local
npm install
npm run dev
```

Set values in `client/.env.local`:

- `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
- `NEXT_PUBLIC_SERVER_URL=http://localhost:5000`

## Feature Coverage

### Authentication

- Separate client/admin signup and login
- Email verification at registration
- Forgot password reset link by email
- Secure password hashing (bcrypt)
- JWT + httpOnly cookie support
- Logout

### Client Dashboard

- Browse pet listings
- Search and filter by category, breed, age, and price
- Pet profile details (name, breed, age, gender, price, vaccination, medical details, description, images)
- Buy/adopt request actions
- Wishlist save/remove
- Profile management
- Request history
- Contact admin
- Read knowledge posts

### Admin Dashboard

- Secure admin login
- Add/edit/delete pet listings
- Upload multiple pet images
- Manage users
- Manage adoption/purchase requests
- Dashboard analytics (users, pets, requests, revenue)
- Knowledge section CRUD posts:
  - Pet diseases
  - Vaccination guides
  - Medicines and antibiotics
  - Grooming tips
  - Pet food guidance
  - Emergency care
  - Training tips
  - General pet care blogs

## Deployment Notes

- Deploy `client` to Vercel with env vars from `.env.local.example`
- Deploy `server` to Render with env vars from `.env.example`
- Configure CORS by setting `CLIENT_URL` in backend to deployed frontend URL
- Ensure MongoDB network access allows backend deployment environment
