# Petcare Backend — Developer Setup Guide

This guide walks you through setting up the Petcare backend service for local development. Follow each section in order to get a fully functional environment running on your machine.

---

## Prerequisites

Ensure the following tools are installed and available in your system `PATH` before proceeding:

| Tool           | Version                        |
| -------------- | ------------------------------ |
| Node.js        | v22.x LTS                      |
| npm            | v10.x _(bundled with Node.js)_ |
| Git            | v2.x                           |
| Docker Desktop | v4.x (Engine v27.x)            |

> **Tip:** Run `node -v`, `npm -v`, `git --version`, and `docker --version` to verify your installed versions before continuing.

---

## 1. Clone the Repository

Clone the Petcare backend repository and navigate into the server directory:

```bash
git clone https://github.com/bibimoni/petcare.git
cd petcare/petcareserver
```

All subsequent commands in this guide should be run from the `petcareserver` directory unless otherwise stated.

---

## 2. Project Structure-Backend

The backend is organized into feature-based modules following NestJS conventions. Each module contains related controllers, services, DTOs, and entities:

```
src/
├── analytics/              # Analytics and reporting service
│   ├── analytics.controller.ts
│   ├── analytics.service.ts
│   ├── analytics.module.ts
│   └── dto/
├── auth/                   # Authentication and authorization
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   └── strategies/         # JWT strategy implementation
├── categories/             # Categories, products, and services
│   ├── categories.controller.ts
│   ├── categories.service.ts
│   ├── categories.module.ts
│   ├── products/           # Product management sub-module
│   ├── services/           # Service management sub-module
│   ├── dto/
│   └── entities/
├── cloudinary/             # Image storage integration
│   ├── cloudinary.service.ts
│   ├── cloudinary.module.ts
│   └── cloudinary.provider.ts
├── common/                 # Shared utilities and guards
│   ├── constants/          # Application constants
│   ├── decorators/         # Custom decorators (roles, permissions)
│   ├── guards/             # JWT and permission guards
│   ├── permissions/        # Permission definitions
│   ├── utils/              # Helper functions
│   └── validators/         # Custom validators
├── config/                 # Environment configuration
├── customers/              # Customer management
│   ├── customers.controller.ts
│   ├── customers.service.ts
│   ├── customers.module.ts
│   ├── dto/
│   └── entities/
├── mail/                   # Email sending service
│   ├── mail.service.ts
│   └── mail.module.ts
├── notifications/          # Notification system
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   ├── notifications.module.ts
│   ├── notification.scheduler.ts  # Cron job scheduler
│   ├── notification.util.ts
│   ├── dto/
│   └── entities/
├── orders/                 # Order and payment management
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   ├── orders.module.ts
│   ├── stripe-webhook.controller.ts  # Stripe webhook handler
│   ├── stripe.service.ts             # Stripe payment service
│   ├── dto/
│   └── entities/
├── permissions/            # Role-based permissions
│   ├── permissions.module.ts
│   └── entities/
├── pets/                   # Pet management
│   ├── pets.controller.ts
│   ├── pets.service.ts
│   ├── pets.module.ts
│   ├── dto/
│   └── entities/
├── roles/                  # Role management with audit trail
│   ├── roles.controller.ts
│   ├── roles.service.ts
│   ├── roles.module.ts
│   ├── dto/
│   └── entities/
├── stores/                 # Store management and staff invitation
│   ├── stores.controller.ts
│   ├── stores.service.ts
│   ├── stores.module.ts
│   ├── dto/
│   └── entities/
├── users/                  # User management
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── entities/
├── app.module.ts           # Root application module
├── app.controller.ts       # Health check endpoints
└── main.ts                 # Application entry point
```

### Core Concepts

- **Modules**: Self-contained feature domains with encapsulated business logic
- **Controllers**: Handle HTTP requests and route them to services
- **Services**: Contain business logic and database operations
- **DTOs**: Data Transfer Objects for request/response validation
- **Entities**: Database models representing data structures
- **Guards**: Middleware for authorization and role-based access control
- **Decorators**: Custom annotations for permissions and user context injection

---

## 3. Configure Environment Variables

The application requires a set of environment variables to run correctly. A template file is provided for reference.

1. Copy the example file to create your local configuration:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your editor and fill in the required values. At minimum, ensure the database connection settings and any third-party API keys are configured correctly.

> **Note:** Never commit your `.env` file to version control. It is already listed in `.gitignore`, but always double-check before pushing.

---

## 4. Start Docker Containers

Make sure **Docker Desktop is running** before executing the commands below. The project uses Docker Compose to spin up the database and any auxiliary services required for local development.

**First-time setup** — build the Docker image before starting:

```bash
./scripts/build_docker_local.sh
```

**Start the services:**

```bash
./scripts/start_docker_local.sh
```

This will bring up all services defined in `docker-compose.dev.yml`, including the database. To verify that all containers started successfully, run:

```bash
docker ps
```

All relevant containers should appear with a status of `Up`.

---

## 5. Validate the Database Connection

Once the containers are running, confirm that the backend can reach the database by sending a request to the health-check endpoint:

```bash
curl http://localhost:8080/test-db
```

A successful response indicates that the database connection is properly established. If the request fails, review your `.env` configuration and ensure the database container is running (`docker ps`).

---

## 6. Seed the Admin User & Initial Data

To bootstrap the application with an initial administrator account and required seed data, run the following scripts **on your host machine** (not inside a Docker container), in order:

```bash
npm run seed              # Creates the initial admin user
npm run seed:deploy       # Seeds deployment configuration data
npm run seed:analytics    # Seeds base analytics data
```

Each script must complete successfully before running the next. The generated admin credentials (username and temporary password) will be printed to the terminal after `npm run seed` completes — store these securely, as you will need them to access the admin panel for the first time.

> **Note:** If any script fails mid-run, resolve the error before proceeding to the next step to avoid inconsistent data states.

---

## 7. Stripe Webhook (Local Development)

The backend integrates with Stripe for payment processing. To test Stripe webhooks locally during development, follow these steps:

### Prerequisites

1. **Stripe Account**: Create or access your [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Stripe API Keys**: Obtain your publishable and secret keys from the Dashboard
3. **Stripe CLI**: Download and install the [Stripe CLI](https://stripe.com/docs/stripe-cli) for your operating system

### Setup Steps

#### 1. Configure Stripe Environment Variables

In your `.env` file, add the following Stripe configuration:

```bash
STRIPE_SECRET_KEY=sk_test_...        # Your Stripe test secret key
STRIPE_PUBLISHABLE_KEY=pk_test_...   # Your Stripe test publishable key
STRIPE_WEBHOOK_SECRET=whsec_...      # Generated after signing in to Stripe CLI
```

#### 2. Install Stripe CLI

**Windows (using Chocolatey):**

```bash
choco install stripe-cli
```

**Windows (manual download):**
Download from [https://github.com/stripe/stripe-cli/releases](https://github.com/stripe/stripe-cli/releases) and add to your PATH.

**macOS (using Homebrew):**

```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**

```bash
# Download the latest version appropriate for your system
```

Verify installation:

```bash
stripe --version
```

#### 3. Login to Stripe CLI

```bash
stripe login
```

This will prompt you to authorize access to your Stripe account. Follow the on-screen instructions.

#### 4. Forward Webhook Events to Local Development Server

Start the webhook forwarding in a new terminal window:

```bash
stripe listen --forward-to localhost:8080/stripe/webhook
```

Replace `localhost:8080` with your actual backend server address if running on a different port.

This command will output your webhook signing secret. **Copy this value** and update your `.env` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...  # Copy from the command output
```

The backend should now receive real Stripe webhook events in your local development environment.

#### 5. Testing Webhooks

With the Stripe CLI listening and your backend running, you can trigger test events:

**Example: Simulate a payment success event**

```bash
stripe trigger payment_intent.succeeded
```

**Example: Simulate a payment failure event**

```bash
stripe trigger payment_intent.payment_failed
```

**View all available test events:**

```bash
stripe trigger --help
```

### Webhook Handler

The webhook handler is implemented in [orders/stripe-webhook.controller.ts](src/orders/stripe-webhook.controller.ts). It processes the following event types:

- `payment_intent.succeeded` — Order payment confirmed
- `payment_intent.payment_failed` — Order payment failed
- `charge.refunded` — Payment refunded

The handler validates the webhook signature using the `STRIPE_WEBHOOK_SECRET` to ensure the event comes from Stripe.

### Troubleshooting

| Issue                       | Solution                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------ |
| Webhook events not received | Ensure `stripe listen` is running and forward URL matches your backend address       |
| Invalid signature error     | Verify that `STRIPE_WEBHOOK_SECRET` in `.env` matches the value from `stripe listen` |
| Connection refused          | Confirm the backend is running on the specified port (default: 8080)                 |
| Stripe CLI not found        | Install Stripe CLI and add it to your system `PATH`                                  |

---

## 8. Testing

The project includes comprehensive unit and end-to-end tests to ensure code quality and API reliability.

### Unit Testing

Unit tests are located alongside their respective source files using the `.spec.ts` extension. These tests validate individual functions and services in isolation.

**Running unit tests:**

```bash
# Run all unit tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

```

### End-to-End (E2E) Testing

End-to-end tests validate entire workflows and API flows using real database connections. These tests are located in the `test/` directory.

**Running E2E tests:**

```bash
npm run test:e2e
```

**Key E2E test files:**

| Test File                                 | Purpose                                             |
| ----------------------------------------- | --------------------------------------------------- |
| `test/app.e2e-spec.ts`                    | Basic application and database connection tests     |
| `test/test-orders.e2e-spec.ts`            | Order creation, payment, and fulfillment workflows  |
| `test/test_orders_e2e.e2e-spec.ts`        | Additional order-related scenarios                  |
| `test/test_invitation_flow.e2e-spec.ts`   | Store staff invitation and acceptance flow          |
| `test/test_stores_invitation.spec.ts`     | Store invitation management                         |
| `test-permissions.e2e-spec.ts`            | Role-based access control and permission validation |
| `test/test-audit-activity.spec.ts`        | Audit trail for user activities                     |
| `test/test-audit-order.spec.ts`           | Audit trail for order operations                    |
| `test/test-audit-role.spec.ts`            | Audit trail for role modifications                  |
| `test/test_staff_removal.spec.ts`         | Staff removal and access revocation                 |
| `test/test_notifications.service.spec.ts` | Notification scheduling and delivery                |

### Test Database Configuration

E2E tests use a separate test database configuration defined in `test/jest-e2e.json`. This isolates test data from development data.

The test setup is configured in `test/setup-env.ts` and uses helper functions from `test/test-database.helper.ts`.

---

## Next Steps

Once setup is complete, refer to the project's API documentation to begin exploring available endpoints and integrating with the frontend.
