# Anchor - Advanced Port Container System

A modern, AI-powered port logistics booking system for managing truck time slot reservations at Algerian port terminals. Built with the Better-T-Stack - a cutting-edge TypeScript stack combining React, TanStack Start, and Convex.

## Overview

Anchor streamlines port terminal operations by providing:

- **Real-time slot booking** for carriers to reserve time slots at port terminals
- **AI-powered assistant** (Google Gemini) for natural language booking interactions
- **Terminal operator dashboards** for managing bookings and capacity
- **Admin console** for system-wide configuration and analytics
- **Full audit trail** and notification system

## Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| **Frontend** | React 19, TanStack Start (SSR), TanStack Router     |
| **Styling**  | Tailwind CSS 4.x, shadcn/ui (Radix UI)              |
| **Backend**  | Convex (reactive BaaS)                              |
| **AI**       | Google Gemini (`gemini-3-flash-preview`) via AI SDK |
| **Auth**     | Better Auth with Convex integration                 |
| **Build**    | Vite 7.x, Turborepo, Bun                            |
| **Language** | TypeScript 5.x                                      |

## Project Structure

```
microhack/
├── apps/
│   └── web/                    # TanStack Start web application
│       ├── src/
│       │   ├── components/     # UI components (shadcn/ui)
│       │   ├── features/       # Feature modules
│       │   │   ├── analytics/  # Charts and dashboards
│       │   │   ├── carrier/    # Carrier booking views
│       │   │   ├── chat/       # AI chat interface
│       │   │   ├── operator/   # Operator management
│       │   │   └── tools/      # AI tool renderers
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Utilities
│       │   └── routes/         # File-based routing
│       └── public/
│
├── packages/
│   ├── backend/                # Convex backend
│   │   └── convex/
│   │       ├── ai/             # AI agent & tools
│   │       ├── bookings/       # Booking functions
│   │       ├── terminals/      # Terminal management
│   │       ├── seed/           # Demo data seeding
│   │       └── schema.ts       # Database schema
│   │
│   ├── config/                 # Shared TypeScript config
│   └── env/                    # Environment validation (t3-env)
│
└── turbo.json                  # Turborepo configuration
```

## Features

### User Roles

| Role                  | Description                                                             |
| --------------------- | ----------------------------------------------------------------------- |
| **Port Admin**        | Full system access - manage terminals, gates, users, view analytics     |
| **Terminal Operator** | Manage assigned terminals, approve/reject bookings, capacity management |
| **Carrier**           | Book time slots, manage trucks/containers, view booking history         |

### Core Functionality

#### AI-Powered Chat Assistant

- Natural language booking flow in French
- Context-aware tool selection based on user role
- Interactive results with selectable slots and items
- Follow-up suggestions for guided conversations

#### Booking Management

- Terminal-level capacity with gate assignment at approval
- Auto-validation based on configurable thresholds
- QR code generation for booking verification
- Full lifecycle tracking: `pending → confirmed/rejected → consumed/cancelled/expired`

#### Capacity Management (Operators)

- Visual 7×24 weekly capacity grid
- Bulk slot activation/deactivation
- Template-based recurring schedules (168 slots/terminal)
- Real-time capacity alerts

#### Analytics Dashboard

- Booking status distribution
- Hourly/daily/weekly trends
- Terminal comparison charts
- Container and truck fleet analytics
- Operator processing metrics

### Database Schema

15+ tables covering:

- **Infrastructure**: terminals, gates, timeSlots, slotTemplates
- **Operations**: bookings, containers, trucks
- **Users**: Better Auth integration with role extension
- **System**: notifications, auditLogs, systemConfig, bookingAggregates

### Seed Data

Includes realistic demo data for 7 Algerian ports:

- Algiers, Oran, Annaba, Bejaia, Skikda, Mostaganem, Ghazaouet
- ~25 gates, ~100 trucks, ~350 containers, ~400 bookings

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.3.5+
- [Node.js](https://nodejs.org/) 18+
- Convex account (free tier available)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd microhack

# Install dependencies
bun install
```

### Convex Setup

```bash
# Initialize Convex project
bun run dev:setup

# Follow prompts to create/connect Convex project
```

Copy environment variables:

```bash
cp packages/backend/.env.local apps/web/.env
```

### Development

```bash
# Start all services (web + Convex backend)
bun run dev

# Or start individually:
bun run dev:web      # Web app only
bun run dev:server   # Convex backend only
```

Open [http://localhost:3001](http://localhost:3001)

### Seeding Demo Data

```bash
npx convex run seed/seed:default '{"key":"demo"}'
```

## Available Scripts

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `bun run dev`         | Start all apps in development mode |
| `bun run build`       | Build all applications             |
| `bun run dev:web`     | Start web application only         |
| `bun run dev:server`  | Start Convex backend only          |
| `bun run dev:setup`   | Initialize Convex project          |
| `bun run check-types` | TypeScript type checking           |

## Web Routes

### Public

- `/login` - Authentication

### Protected (role-based)

**Admin Routes** (`/admin/*`)

- Dashboard, analytics, terminals, gates, carriers, trucks, users, operators, audit logs, config

**Operator Routes** (`/operator/*`)

- Dashboard, bookings, pending queue, capacity management, analytics

**Carrier Routes** (`/carrier/*`)

- Booking calendar, trucks, containers

**Shared**

- `/` - AI chat interface
- `/$threadId` - Chat thread
- `/settings` - User preferences

## Environment Variables

```env
# Convex
CONVEX_DEPLOYMENT=<your-deployment>
NEXT_PUBLIC_CONVEX_URL=<convex-url>

# Better Auth
BETTER_AUTH_SECRET=<secret>
BETTER_AUTH_URL=<auth-url>

# Google AI (for Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=<api-key>
```

## Architecture Highlights

### Real-time Data

All data subscriptions use Convex's reactive queries, providing instant updates across all connected clients.

### Type Safety

End-to-end TypeScript with:

- Convex validators for runtime validation
- TanStack Router for type-safe routing
- Better Auth for typed authentication

### AI Tool System

16+ tools organized by domain (bookings, terminals, containers, trucks) with:

- Role-based access control inside each tool
- Structured output for UI rendering
- Interactive selection callbacks

### Modular Feature Architecture

Each feature is self-contained:

```
features/
├── chat/
│   ├── components/
│   ├── hooks/
│   └── index.ts
```

## License

Private project - All rights reserved
