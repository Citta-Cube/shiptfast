# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Development: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`
- Lint: `npm run lint`

## Code Style Guidelines
- **JavaScript**: ES6+, no TypeScript, functional components with named exports
- **Naming**: Boolean prefixes (`isLoading`), dash-case for directories
- **React**: Server Components preferred, minimize `'use client'`, wrap client components in Suspense
- **Error Handling**: Always include loading/error states for data fetching
- **UI**: Shadcn UI + Tailwind CSS, mobile-first approach, toasts for alerts

## Project Structure
- `/src/app`: Pages (dashboard, forwarders, orders) and API routes
- `/src/components`: UI components by feature
- `/src/data-access`: Data fetching layer for all entities
- `/src/lib`: Utilities and DB clients (Supabase/Prisma)
- `/src/hooks`: Custom React hooks
- `/scripts/sql`: Database schemas