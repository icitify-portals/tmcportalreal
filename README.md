# Muslim Congress - Membership Portal

A full-stack enterprise membership and governance automation system for Islamic organizations with hierarchical structure (National → State → Local).

## Features

- **Hierarchical Organization Structure**: National, State, and Local levels
- **Role-Based Access Control**: Members, Officials, and Admins at different levels
- **Member Management**: Registration, profiles, status management
- **Payment Integration**: Paystack integration for membership fees and donations
- **Email Notifications**: Resend/Amazon SES integration
- **Document Management**: Cloud storage for documents
- **Audit Logging**: Complete audit trail for all actions
- **Modern UI**: Built with Next.js 15, TypeScript, Tailwind CSS, and ShadCN UI

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **Authentication**: NextAuth.js
- **Payments**: Paystack
- **Email**: Resend/Amazon SES
- **Storage**: AWS S3/Cloudinary (configurable)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Paystack account (for payments)
- Resend account (for emails)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tmcportal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your application URL
- `RESEND_API_KEY`: Your Resend API key
- `PAYSTACK_SECRET_KEY`: Your Paystack secret key
- `PAYSTACK_PUBLIC_KEY`: Your Paystack public key

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. (Optional) Seed initial data:
```bash
# Create a seed script if needed
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── layout/           # Layout components
│   └── ui/               # ShadCN UI components
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── rbac.ts           # Role-based access control
│   ├── audit.ts          # Audit logging
│   ├── email.ts          # Email service
│   ├── payments.ts       # Payment integration
│   └── storage.ts        # File storage
├── prisma/               # Prisma schema and migrations
└── types/                # TypeScript type definitions
```

## Database Schema

The system uses a hierarchical organization structure:

- **Organizations**: National, State, Local levels
- **Users**: Base user accounts
- **Members**: Member profiles linked to organizations
- **Officials**: Elected/appointed officials
- **Admins**: System administrators at different levels
- **Payments**: Payment records with Paystack integration
- **Documents**: Document storage and management
- **AuditLogs**: Complete audit trail
- **EmailLogs**: Email delivery tracking

## Authentication & Authorization

- **Authentication**: NextAuth.js with credentials provider
- **Authorization**: Role-based access control (RBAC)
- **Roles**: 
  - Super Admin: Full system access
  - National Admin: National level management
  - State Admin: State level management
  - Local Admin: Local level management
  - Officials: Organization officials
  - Members: Regular members

## API Routes

- `/api/auth/*`: NextAuth authentication
- `/api/members`: Member management
- `/api/payments/initialize`: Initialize payment
- `/api/payments/verify`: Verify payment
- More routes can be added as needed

## Development

### Running Migrations

```bash
npx prisma migrate dev
```

### Generating Prisma Client

```bash
npx prisma generate
```

### Viewing Database

```bash
npx prisma studio
```

## Production Deployment

1. Set up production database
2. Configure environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Build: `npm run build`
5. Start: `npm start`

## Security Considerations

- All passwords are hashed using bcrypt
- Role-based access control on all routes
- Audit logging for all actions
- Input validation and sanitization
- Secure session management

## License

[Your License Here]

## Support

For support, email support@muslimcongress.org or create an issue in the repository.
