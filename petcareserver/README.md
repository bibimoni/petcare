# Petcare backend Setup Guide

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
``````

The credentials for the admin user will be displayed in the terminal.
