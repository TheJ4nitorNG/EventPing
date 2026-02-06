# EventPing

## Overview

EventPing is a minimal event RSVP web application. Users create an event with a title and date/time, then share a public link where anyone can vote Yes/No/Maybe without needing an account. The organizer receives a secret link to view response results. Events automatically lock when their start time passes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state and data fetching
- **Styling**: TailwindCSS with shadcn/ui component library (New York style)
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Framework**: Express.js 5 running on Node.js with TypeScript
- **API Pattern**: RESTful JSON API with routes prefixed by `/api`
- **Build System**: esbuild for server bundling, Vite for client bundling
- **Development**: tsx for TypeScript execution, Vite dev server with HMR

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all table definitions and Zod validation schemas
- **Database Tables**:
  - `events`: Stores event details (title, start time, location, note, organizer email) with organizer token for admin access, plus reminder flags and sent status
  - `responses`: Stores RSVP votes linked to events with choice (yes/no/maybe), optional name, and comment
- **Storage Abstraction**: `server/storage.ts` defines an `IStorage` interface with `DatabaseStorage` implementation using PostgreSQL for persistence
- **Email Reminders**: `server/email.ts` and `server/reminders.ts` handle sending reminder emails via Resend integration
- **SMS Reminders**: `server/sms.ts` handles sending SMS text message reminders via Twilio integration

### Key Design Decisions

1. **No Authentication Required**: Events use a secret organizer token URL pattern (`/o/:id?token=...`) instead of user accounts, keeping the app simple
2. **Shared Schema**: Database schema and validation types live in `shared/` directory, allowing both client and server to use the same TypeScript types
3. **Automatic Voting Lock**: Events check `startsAt` timestamp to prevent votes after the event has started
4. **Path Aliases**: Uses `@/` for client source, `@shared/` for shared code, simplifying imports

### Project Structure
```
client/           # React frontend
  src/
    components/ui/  # shadcn/ui components
    pages/          # Route pages (home, create-event, event-page, organizer-page)
    hooks/          # Custom React hooks
    lib/            # Utilities and query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  storage.ts      # Data storage interface and implementation
shared/           # Shared between client and server
  schema.ts       # Drizzle schema and Zod validation
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, configured via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations stored in `./migrations` directory
- **connect-pg-simple**: PostgreSQL session store (available but sessions not currently used)

### UI Components
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-styled component collection built on Radix
- **Lucide React**: Icon library

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment
- **Google Fonts**: DM Sans, Fira Code, Geist Mono, Architects Daughter fonts loaded via CDN