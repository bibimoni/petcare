# Petcare Frontend Setup Guide

This guide walks you through setting up the Petcare frontend application for local development. Follow each section in order to get a fully functional environment running on your machine.

---

## Prerequisites

Ensure the following tools are installed and available in your system `PATH` before proceeding:

| Tool           | Version                        |
| -------------- | ------------------------------ |
| Node.js        | v22.x LTS                      |
| pnpm           | v10.x                          |
| Git            | v2.x                           |

> **Tip:** Run `node -v`, `pnpm -v`, and `git --version` to verify your installed versions before continuing.

---

## 1. Clone the Repository

Clone the Petcare repository and navigate into the client directory:

```bash
git clone https://github.com/bibimoni/petcare.git
cd petcare/petcareclient
```

All subsequent commands in this guide should be run from the `petcareclient` directory unless otherwise stated.

---

## 2. Project Structure-Frontend

The frontend is organized into feature-based modules. Each feature directory contains related components, hooks, API services, and types:

```
src/
├── components/             # Shared UI components (Radix UI, Shadcn)
│   ├── ui/                 # Atomic UI components
│   └── shared/             # Common layouts and patterns
├── features/               # Feature-based modules
│   ├── auth-page/          # Login and registration flows
│   ├── dashboard/          # Admin/Staff dashboard
│   ├── pos/                # Point of Sale system
│   ├── inventory/          # Product and stock management
│   ├── pets/               # Pet records and profiles
│   ├── customers/          # Customer management
│   ├── finance/            # Revenue and reports
│   └── ...                 # Other domain-specific features
├── helpers/                # Shared utility functions
├── lib/                    # Library configurations (axios, react-query)
├── main.tsx                # Application entry point
├── App.tsx                 # Root component and routing
└── index.css               # Global styles and Tailwind directives
```

### Core Concepts

- **Feature-based Architecture**: Logic is grouped by business domain rather than technical type.
- **TanStack Query**: Used for efficient data fetching, caching, and server state management.
- **React Router**: Handles client-side navigation and protected routes.
- **Tailwind CSS**: Utility-first styling with a custom design system.
- **Zod**: Schema validation for forms and API responses.

---

## 3. Configure Environment Variables

The application requires a set of environment variables to connect to the backend API.

1. Copy the example file to create your local configuration:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your editor and fill in the required values:

   ```env
   VITE_API_URL=http://localhost:8080/v1
   ```

> **Note:** Ensure the backend service is running if you want to perform real API requests.

---

## 4. Install Dependencies

Use `pnpm` to install the project dependencies:

```bash
pnpm i
```

---

## 5. Start Development Server

Launch the development server with Hot Module Replacement (HMR):

```bash
pnpm dev
```

The application will be available at [http://localhost:5173](http://localhost:5173) by default.

---

## 6. Code Quality & Linting

To maintain code consistency, run the linter and formatter:

```bash
# Check for linting errors
pnpm lint

# Automatically fix linting issues and log warning/ error
pnpm lint:fix
```

---

## 7. Production Build

To create an optimized production build:

```bash
pnpm build
```

---

## Troubleshooting

| Issue                       | Solution                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------ |
| API Connection Refused      | Ensure the backend is running and `VITE_API_URL` is correct in `.env`                |
| Dependency Conflicts        | Delete `node_modules` and `pnpm-lock.yaml`, then run `pnpm i`                   |
| Styles not loading          | Ensure `pnpm dev` is running and `index.css` is correctly imported in `main.tsx` |

---

