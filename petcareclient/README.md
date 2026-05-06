# Petcare frontend Setup Guide

This guide will help you set up the Petcare frontend for development.

## System Features

Petcare is a comprehensive management application for pet care facilities, including the following main features:

### Authentication & Access Control

- Login / Logout
- Forgot Password & Reset Password
- Role-based Access Control (Admin, Staff, Customer)
- User Invitations

### Dashboard

- Overview of Key Metrics
- Activity Statistics
- System Monitoring

### Customer Management

- Detailed Customer Profiles
- Service History
- Contact Information

### Pet Management

- Pet List
- Health Records
- Medical History

### Inventory Management

- Stock Tracking
- Expiring Soon Alerts
- Low Stock Management
- Expiration Date Notifications

### Point of Sale (POS) System

- Create Orders
- Order Status Management (Pending, Completed, Cancelled, Refunded)
- Sales History
- Invoice Calculation

### Employee Management

- Employee List
- Task Assignment
- Role Management

### Service Management

- Service List
- Service Pricing
- Service Assignment

### Settings & Profile

- User Profile
- System Settings
- Store Management

### Information Pages

- Landing Page
- About Us
- FAQ
- Privacy Policy
- Terms of Service

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/get-npm) (comes with Node.js)
- [Git](https://git-scm.com/)

## Clone the Repository

First, clone the Petcare frontend repository from GitHub:

```bash
git clone https://github.com/bibimoni/petcare.git

cd petcare/petcareclient
```

## Setup Environment Variables

Create a `.env` file in the `petcareclient` directory and add the necessary environment variables. You can use the `.env.example` file as a template:

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
