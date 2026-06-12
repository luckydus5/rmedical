# Sanovia

Sanovia is a secure medical records management platform for healthcare facilities. It gives patients ownership of their medical history while letting doctors, nurses, and facility administrators access and update records across hospitals and clinics — including in low-connectivity environments.

## Features

- **Patient-owned records** — patients control their data and can share it with any provider via QR code
- **Role-based access** — separate workflows for patients, doctors, nurses, and facility administrators
- **Multi-factor authentication** and an append-only audit log of record access
- **Emergency access card** — a QR code exposing critical information (blood type, allergies, current medications) for first responders
- **Drug interaction checks** — flags dangerous drug combinations, allergy cross-reactivity, and condition contraindications, covering WHO Essential Medicines and drugs common in East Africa
- **Offline-first** — IndexedDB-backed local storage with background sync for rural facilities with intermittent connectivity
- **Multi-language** — English, Kinyarwanda, Swahili, and French
- **Vaccination tracking** — WHO/Rwanda immunization schedule (BCG, OPV, Pentavalent, PCV, Rotavirus, Measles-Rubella, Yellow Fever)
- **Facility analytics** — patient demographics, common conditions, vaccination coverage, and medication trends
- **PDF export** of medical records

## Tech stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/), built with [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/) for authentication, database, and row-level security
- [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components
- [TanStack Query](https://tanstack.com/query) for server state, [react-i18next](https://react.i18next.com/) for localization
- [Vitest](https://vitest.dev/) + Testing Library for tests

## Getting started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project

### Setup

```sh
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# then fill in your Supabase project values

# Start the dev server (http://localhost:8080)
npm run dev
```

### Environment variables

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Project structure

```
src/
├── components/     # Feature components (auth, admin, doctor, nurse, medical, ...)
│   └── ui/         # shadcn/ui primitives
├── pages/          # Route-level pages
├── lib/            # Domain logic (drug interactions, offline sync, PDF export, ...)
├── locales/        # i18n resources (en, rw, sw, fr)
└── assets/         # Static assets
```

## Security

Access control is enforced through Supabase row-level security policies, with MFA available on all accounts. Every access to a patient record is written to an append-only audit log. Report security issues privately to the maintainer rather than opening a public issue.
