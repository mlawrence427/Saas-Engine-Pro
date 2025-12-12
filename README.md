# SaaSify Backend

A production-ready, scalable backend API for the SaaSify SaaS boilerplate. Built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## 🚀 Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **Authorization**: Role-based access control (User/Admin)
- **Billing**: Full Stripe integration with subscriptions and webhooks
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod schemas matching frontend exactly
- **Security**: Helmet, CORS, rate limiting
- **Type Safety**: Full TypeScript support
- **Error Handling**: Consistent JSON error responses

## 📁 Project Structure

```
backend/
├── src/
│   ├── api/              # Route definitions
│   │   ├── auth.routes.ts
│   │   ├── billing.routes.ts
│   │   ├── admin.routes.ts
│   │   └── index.ts
│   ├── controllers/      # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── billing.controller.ts
│   │   └── admin.controller.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # requireAuth, requireAdmin
│   │   ├── errorHandler.ts
│   │   ├── validate.ts
│   │   └── requestLogger.ts
│   ├── services/         # Business logic
│   │   ├── auth.service.ts
│   │   ├── billing.service.ts
│   │   └── admin.service.ts
│   ├── schemas/          # Zod validation schemas
│   │   └── index.ts
│   ├── utils/            # Utilities
│   │   ├── auth.ts       # JWT & password helpers
│   │   ├── errors.ts     # Custom error classes
│   │   ├── logger.ts
│   │   ├── prisma.ts
│   │   └── types.ts
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data
├── .env.example         # Environment template
├── package.json
└── tsconfig.json
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Stripe account (for billing)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Setup database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database (development)
   npm run db:push
   
   # OR run migrations (production)
   npm run db:migrate
   
   # Seed initial data
   npm run db:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/register` | Create account | No |
| POST | `/api/login` | Login | No |
| GET | `/api/user` | Get current user | Yes |
| POST | `/api/logout` | Logout | Yes |
| PUT | `/api/profile` | Update profile | Yes |
| PUT | `/api/password` | Change password | Yes |

### Settings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/settings` | Get user settings | Yes |
| PUT | `/api/settings` | Update settings | Yes |

### Billing

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/billing` | Get billing info | Yes |
| POST | `/api/checkout` | Create checkout session | Yes |
| POST | `/api/webhook` | Stripe webhook | No* |

*Webhook uses Stripe signature verification

### Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/users` | List all users | Admin |
| GET | `/api/admin/user/:id` | Get user by ID | Admin |
| PUT | `/api/admin/user/:id` | Update user | Admin |
| DELETE | `/api/admin/user/:id` | Delete user | Admin |
| GET | `/api/admin/stats` | Dashboard stats | Admin |
| GET | `/api/admin/logs` | Activity logs | Admin |

## 🔐 Authentication

### JWT Payload
```typescript
{
  id: string;
  email: string;
  role: "user" | "admin";
}
```

### Using the Token
```bash
# Include in Authorization header
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/user
```

## 📋 Request/Response Examples

### Register
```bash
POST /api/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password123!"
}

# Response
{
  "error": false,
  "data": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=john%40example.com",
      "plan": "free"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Account created successfully"
}
```

### Login
```bash
POST /api/login
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

### Update Profile
```bash
PUT /api/profile
Authorization: Bearer <token>
{
  "fullName": "John Smith",
  "email": "john.smith@example.com"
}
```

### Get Billing
```bash
GET /api/billing
Authorization: Bearer <token>

# Response
{
  "error": false,
  "data": {
    "invoices": [
      {
        "id": "clx...",
        "date": "Dec 1, 2023",
        "amount": 29,
        "status": "paid"
      }
    ],
    "currentPlan": {
      "id": "pro",
      "name": "Pro",
      "price": 29,
      "interval": "month"
    }
  }
}
```

## ⚠️ Error Responses

All errors follow this format:
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {} // Optional validation details
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | Invalid request |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `VALIDATION_ERROR` | 422 | Schema validation failed |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Server error |

## 💳 Stripe Configuration

1. **Create products and prices in Stripe Dashboard**

2. **Update `.env` with price IDs**
   ```env
   STRIPE_PRICE_PRO=price_xxx
   STRIPE_PRICE_ENTERPRISE=price_xxx
   ```

3. **Setup webhook endpoint**
   ```
   https://your-domain.com/api/webhook
   ```

4. **Enable webhook events**
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## 🗄️ Database Schema

### User
- `id`, `email`, `passwordHash`
- `firstName`, `lastName`, `fullName`
- `avatar`, `role`, `plan`
- `stripeCustomerId`
- `emailVerified`, `twoFactorEnabled`
- `createdAt`, `updatedAt`, `lastLoginAt`

### Invoice
- `id`, `userId`, `stripeInvoiceId`
- `date`, `amount`, `currency`, `status`
- `description`, `pdfUrl`

### ActivityLog
- `id`, `userId`, `action`
- `entity`, `entityId`, `metadata`
- `ipAddress`, `userAgent`

## 🚀 Deployment

### Build for production
```bash
npm run build
```

### Run production server
```bash
NODE_ENV=production npm start
```

### Environment Variables
Make sure to set all required environment variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL`

## 📚 Frontend Mapping

| Frontend | Backend |
|----------|---------|
| `loginSchema` | `POST /api/login` |
| `registerSchema` | `POST /api/register` |
| `profileSchema` | `PUT /api/profile` |
| `useAuth().login()` | `POST /api/login` |
| `useAuth().register()` | `POST /api/register` |
| `useAuth().updateProfile()` | `PUT /api/profile` |
| `apiGetBilling()` | `GET /api/billing` |
| `UserProfile` type | Response from `/api/user` |
| `Invoice` type | Response from `/api/billing` |

## 📝 License

MIT
