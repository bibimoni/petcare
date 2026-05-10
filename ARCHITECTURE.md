# PetCare System Architecture

## Overview

PetCare is a full-stack web application designed for pet care management, enabling pet stores to manage customers, pets, products, services, and orders with role-based access control.

---

## System Architecture

```
+---------------------------+
|       Client Layer        |
+---------------------------+
            |
            v
+---------------------------+
|      API Gateway          |
|    (NestJS Server)        |
+---------------------------+
            |
    +-------+-------+
    |               |
    v               v
+--------+    +-------------------+
| Auth   |    | Business Modules  |
| Module |    +-------------------+
+--------+    | - Users           |
    |         | - Stores          |
    v         | - Customers       |
+--------+    | - Pets            |
|  JWT   |    | - Orders          |
| Tokens |    | - Products        |
+--------+    | - Services        |
              | - Categories      |
              | - Roles           |
              | - Permissions     |
              | - Notifications   |
              +-------------------+
                    |
        +-----------+-----------+
        |                       |
        v                       v
+---------------+     +-------------------+
|   PostgreSQL  |     | External Services |
|   Database    |     +-------------------+
+---------------+     | - Cloudinary      |
                      | - Email (SMTP)    |
                      +-------------------+
```

---

## Technology Stack

### Backend (petcareserver)

| Component        | Technology                        |
|------------------|-----------------------------------|
| Framework        | NestJS 11.x                       |
| Language         | TypeScript 5.x                    |
| ORM              | TypeORM 0.3.x                     |
| Database         | PostgreSQL / SQLite (dev/test)    |
| Authentication   | Passport.js + JWT                 |
| API Documentation| Swagger / OpenAPI                 |
| Validation       | class-validator + class-transformer |
| File Storage     | Cloudinary                        |
| Email Service    | Nodemailer                        |
| Task Scheduling  | @nestjs/schedule                  |
| Containerization | Docker                            |

### Frontend (petcareclient)

| Component        | Technology                        |
|------------------|-----------------------------------|
| Framework        | React 19.x                        |
| Language         | TypeScript 5.x                    |
| Build Tool       | Vite 7.x                          |
| Styling          | Tailwind CSS 4.x                  |

---

## Core Modules

### Authentication & Authorization

- **JWT-based authentication** with passport-jwt strategy
- **Role-based access control (RBAC)** with granular permissions
- **Guards**: JwtAuthGuard, RolesGuard, PermissionsGuard
- **Decorators**: @Roles(), @Permissions(), @CurrentUser()

### Business Domain Modules

| Module        | Description                              |
|---------------|------------------------------------------|
| Users         | User management and profiles             |
| Stores        | Multi-store support with staff invitation|
| Customers     | Customer information management          |
| Pets          | Pet records with weight tracking         |
| Orders        | Order processing and details             |
| Products      | Product inventory management             |
| Services      | Pet care service offerings               |
| Categories    | Product and service categorization       |
| Roles         | Role definition and assignment           |
| Permissions   | Permission management                    |
| Notifications | User notification system                 |
| Mail          | Email notifications                      |

---

## Data Model

```
+------------+       +------------+       +----------------+
|   User     |------>|   Role     |------>|  Permission    |
+------------+       +------------+       +----------------+
      |                    |
      v                    v
+------------+       +------------+
|   Store    |<------| Invitation |
+------------+       +------------+
      |
      +-------------------+
      |         |         |
      v         v         v
+----------+ +-----+ +----------+
| Customer | | Pet | | Product  |
+----------+ +-----+ +----------+
      |         |           |
      v         v           v
+------------+ +-----------------+ +------------+
|    Order   | | PetWeightHistory| |  Service   |
+------------+ +-----------------+ +------------+
      |
      v
+----------------+
|  OrderDetail   |
+----------------+
      |
      v
+------------+
| Category   |
+------------+
```

---

## API Structure

### Versioning

The API uses URI versioning (e.g., `/v1/resource`)

### Authentication Endpoints

| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| POST   | /auth/register    | User registration        |
| POST   | /auth/login       | User login               |
| POST   | /auth/forgot-password | Password reset       |

### Core Resources

| Resource      | Endpoints                              |
|---------------|----------------------------------------|
| Users         | CRUD operations, profile management    |
| Stores        | CRUD, staff invitation, settings       |
| Customers     | CRUD, pet association                  |
| Pets          | CRUD, weight history tracking          |
| Orders        | CRUD, order details management         |
| Products      | CRUD, category association             |
| Services      | CRUD, category association             |
| Categories    | CRUD for products and services         |
| Roles         | CRUD, permission assignment            |
| Notifications | Read, mark as read                     |

### API Documentation

Available at `/api` endpoint via Swagger UI.

---

## Security Architecture

### Authentication Flow

```
Client                Server                Database
  |                     |                     |
  |-- Login Request -->|                     |
  |                     |-- Verify User ----->|
  |                     |<-- User Data -------|
  |                     |                     |
  |<-- JWT Token ------|                     |
  |                     |                     |
  |-- Protected Request + Authorization -->  |
  |                     |-- Validate Token -->|
  |                     |-- Check Perms ----->|
  |                     |<-- Result ---------|
  |<-- Response -------|                     |
```

### Security Layers

1. **JWT Validation**: All protected routes require valid JWT
2. **Role Check**: Users must have appropriate role
3. **Permission Check**: Fine-grained permission validation
4. **Input Validation**: DTO validation with class-validator
5. **CORS Configuration**: Configurable origin restrictions

---

## Deployment Architecture

### Development Environment

```
+-------------------+     +-------------------+
|  Docker Container |     |  Local PostgreSQL |
|  (NestJS App)     |     |  (or SQLite)      |
+-------------------+     +-------------------+
         :8080
```

### Production Environment

```
+----------------+     +---------------+     +------------------+
|   React App    |     |  NestJS API   |     |   PostgreSQL     |
|   (Static)     |---->|  (Container)  |---->|   (Managed)      |
+----------------+     +---------------+     +------------------+
                              |
                              v
                       +---------------+
                       |  Cloudinary   |
                       |  (CDN/Storage)|
                       +---------------+
```

---

## External Service Integration

### Cloudinary

- Image upload and storage
- Automatic image optimization
- CDN delivery

### Email Service (Nodemailer)

- Password reset emails
- Staff invitation emails
- Notification emails

---

## Configuration Management

Environment-based configuration with validation:

| Variable          | Description                    |
|-------------------|--------------------------------|
| NODE_ENV          | Environment (development/production) |
| PORT              | Server port (default: 8080)    |
| POSTGRES_URI      | PostgreSQL connection string   |
| DB_TYPE           | Database type (postgres/sqlite)|
| JWT_SECRET        | JWT signing secret             |
| JWT_EXPIRATION    | Token expiration time          |
| CLOUDINARY_*      | Cloudinary credentials         |
| SMTP_*            | Email service configuration    |

---

## Quality Assurance

### Testing Strategy

- **Unit Tests**: Jest for service and controller testing
- **E2E Tests**: API integration testing
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier

### CI/CD

- GitHub Actions workflow for backend CI
- Automated testing on pull requests

---

## Scalability Considerations

1. **Horizontal Scaling**: Stateless API design enables load balancing
2. **Database Connection Pooling**: TypeORM connection management
3. **Caching**: Can be added for frequently accessed data
4. **File Storage**: Offloaded to Cloudinary CDN

---

## Future Enhancements

- WebSocket support for real-time notifications
- Redis caching layer
- Message queue for async operations
- Multi-tenant architecture improvements
- GraphQL API layer
