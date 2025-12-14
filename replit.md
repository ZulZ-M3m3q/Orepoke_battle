# PokémonQR - QR Code Pokemon Battle Game

## Overview

This is a Pokemon-themed web game that allows players to scan QR codes to encounter and battle wild Pokemon. Players can catch Pokemon, build a collection, and engage in turn-based battles. The application features a React frontend with a Pokemon-style UI, QR code scanning capabilities, and persistent collection storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for GLSL shader support and asset handling
- **State Management**: Zustand with persistence middleware for game state and Pokemon collection
- **Styling**: Tailwind CSS with shadcn/ui component library (Radix UI primitives)
- **Animation**: Framer Motion for smooth transitions and battle animations
- **3D Graphics**: React Three Fiber with drei and postprocessing (configured but may be for future visual effects)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Development**: tsx for TypeScript execution
- **Build**: esbuild for server bundling, Vite for client bundling
- **API Structure**: Express routes prefixed with `/api`, currently minimal backend with storage interface prepared

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - currently contains a basic users table
- **Client-side Persistence**: Zustand persist middleware for Pokemon collection (localStorage)
- **Storage Pattern**: Abstract storage interface (`IStorage`) with in-memory implementation, ready for database integration

### Key Game Components
1. **MainMenu** - Entry point with options for scanning, random encounters, and collection viewing
2. **QRScanner** - Uses html5-qrcode library for camera-based QR scanning
3. **BattleScene** - Turn-based battle system with HP tracking, moves, and catch mechanics
4. **Collection** - Grid display of caught Pokemon
5. **PokemonCard** - Detailed view with QR code generation for sharing

### External API Integration
- **PokeAPI** (`https://pokeapi.co/api/v2`) - Fetches Pokemon data, stats, moves, and sprites
- Pokemon data is fetched on-demand during encounters

### Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

## External Dependencies

### Third-Party Services
- **PokeAPI**: External REST API for all Pokemon data (sprites, stats, types, moves, catch rates)

### Key NPM Packages
- **QR Code**: `html5-qrcode` for scanning, `qrcode` for generation
- **Image Export**: `html2canvas` for Pokemon card downloads
- **Data Fetching**: `@tanstack/react-query` for API state management
- **UI Components**: Full shadcn/ui component set with Radix primitives
- **Database**: `drizzle-orm`, `pg`, `drizzle-kit` for PostgreSQL operations
- **Validation**: `zod` with `drizzle-zod` for schema validation

### Environment Requirements
- `DATABASE_URL` - PostgreSQL connection string (required for database operations)
- Database migrations output to `./migrations` directory