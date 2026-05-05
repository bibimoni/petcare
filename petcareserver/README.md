<!-- # Petcare backend Setup Guide

This guide will help you set up the Petcare backend for development.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/get-npm) (comes with Node.js)
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/get-started)

## Clone the Repository

First, clone the Petcare backend repository from GitHub:

```bash
git clone https://github.com/bibimoni/petcare.git

cd petcare/petcareserver
```

## Setup Environment Variables

Create a `.env` file in the `petcareserver` directory and add the necessary environment variables. You can use the `.env.example` file as a template:

## Run Docker Containers

Make sure Docker is running on your machine. Then, navigate to the `petcareserver` directory and run the following command to start the necessary Docker containers:

```bash
./scripts/build_docker_local.sh # if you haven't built the image yet
./scripts/start_docker_local.sh
```

This will start the database and any other services defined in the `docker-compose.dev.yml` file.

## Validate Database Connection

Ensure that the backend can connect to the database.You can try making request to `http://localhost:8080/test-db`

## Seed admin user

To create an initial admin user, run the following command on the host (not docker):

```bash
npm run seed
```

The credentials for the admin user will be displayed in the terminal. -->

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

## 2. Configure Environment Variables

The application requires a set of environment variables to run correctly. A template file is provided for reference.

1. Copy the example file to create your local configuration:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your editor and fill in the required values. At minimum, ensure the database connection settings and any third-party API keys are configured correctly.

> **Note:** Never commit your `.env` file to version control. It is already listed in `.gitignore`, but always double-check before pushing.

---

## 3. Start Docker Containers

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

## 4. Validate the Database Connection

Once the containers are running, confirm that the backend can reach the database by sending a request to the health-check endpoint:

```bash
curl http://localhost:8080/test-db
```

A successful response indicates that the database connection is properly established. If the request fails, review your `.env` configuration and ensure the database container is running (`docker ps`).

---

## 5. Seed the Admin User & Initial Data

To bootstrap the application with an initial administrator account and required seed data, run the following scripts **on your host machine** (not inside a Docker container), in order:

```bash
npm run seed              # Creates the initial admin user
npm run seed:deploy       # Seeds deployment configuration data
npm run seed:analytics    # Seeds base analytics data
```

Each script must complete successfully before running the next. The generated admin credentials (username and temporary password) will be printed to the terminal after `npm run seed` completes — store these securely, as you will need them to access the admin panel for the first time.

> **Note:** If any script fails mid-run, resolve the error before proceeding to the next step to avoid inconsistent data states.

---

## Next Steps

Once setup is complete, refer to the project's API documentation to begin exploring available endpoints and integrating with the frontend.
