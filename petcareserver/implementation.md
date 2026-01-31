# 🐾 PetCare Management System – API Documentation

A backend management system for pet care businesses, designed to support sales, services, and customer management for the PetCare store.

---

## 1. Authentication

- **POST** `/auth/login`: Login
- **POST** `/auth/logout`: Logout
- **POST** `/customers`: Register Customer

---

## 2. Customer & User Information

- **GET** `/customers/search?phone={number}`: Search Customer by Phone
- **GET** `/customers/{customer_id}/orders`: Customer Order History
- **GET** `/customers`: Get All Customers
- **GET** `/users`: Get Staff Users
- **PATCH** `/customers/{customer_id}`: Update Customer Info


---

## 3. Pets of Customers

- **POST** `/pets`: Create Pet
- **PATCH** `/pets/{pet_id}`: Update Pet  
- **GET** `/pets/{pet_id}`: Pet Detail  
- **GET** `/customers/{customer_id}/pets`: Customer Pets  
- **DELETE** `/pets/{pet_id}`: Delete Pet (Soft Delete)  
- **POST** `/pets/{pet_id}/weights`: Record Pet Weight  
- **GET** `/pets/{pet_id}/weights`: Pet Weight History  

---

## 4. Categories

### Update Category
- **PATCH** `/categories/{id}`: Update Category  
- **GET** `/categories`: Get Categories  
---

### 4.1 Products


- **POST** `/products`: Create Product  
- **PATCH** `/products/{product_id}`: Update Product Info (no update stock_quantity)
- **POST** `/products/{id}/import`: Import Stock  
- **GET** `/products/{id}/stock-history`: Stock History  
- **GET** `/products/search?name={name}`: Search Product  
- **GET** `/products/low-stock`: Low Stock Alert  
- **GET** `/products`: Get Products  
---

### 4.2 Services

- **POST** `/services`: Create Service  
- **PATCH** `/services/{service_id}`: Update Service Price  
- **GET** `/services`: Get Services  

---

### 4.3 Pets for Sale

- **POST** `/pet-sold`: Add Pet for Sale  
- **PATCH** `/pet-sold/{pet_sell_id}`: Update Pet Sale Info  
- **GET** `/pet-sold/available`: Available Pets  
- **GET** `/pet-sold/sold`: Sold Pets  

---

## 5. Orders & Returns

- **POST** `/orders`: Create Order  
- **GET** `/orders`: Order List (day/week/year)  
- **GET** `/orders/{order_id}`: Order Detail  
- **PATCH** `/orders/{order_id}/status`: Update Order Status  
- **PATCH** `/orders/{order_id}/payment-method`: Update Payment Method  
- **PUT** `/orders/{order_id}/cancel`: Cancel Order  
- **POST** `/orders/{order_id}/items`: Add Order Item  
- **PATCH** `/orders/{order_id}/items/{item_id}`: Update Order Item  
- **DELETE** `/orders/{order_id}/items/{item_id}`: Remove Order Item  
- **GET** `/orders/{order_id}/print`: Print Order

---

## 6. Dashboard & Reports

- **GET** `/dashboard/revenue-chart?period=week|month|year`: Revenue Chart  
- **GET** `/dashboard/profit-margin`: Profit Margin  
- **GET** `/dashboard/top-products`: Top 5 Products  
- **GET** `/dashboard/top-services`: Top Services  
- **GET** `/dashboard/pet-sales-ratio`: Pet Sales Ratio  
- **GET** `/dashboard/customer-growth`: Customer Growth  

---

## 7. Notifications

- **GET** `/notifications`: Get Notifications  
- **PATCH** `/notifications/{id}/read`: Mark Notification as Read  
- **GET** `/notifications/unread-count`: Unread Count  
- **GET** `/products/expired-soon?days|month`: Expired Products Alert  
- **PATCH** `/orders/{order_id}/status`: Payment Success Notification  (status `PAID`).

---

## 8. Others

### Upload File
- **POST** `/upload`: Upload File  

---

## 🔑 Authorization

> **Note:**  
> All APIs (except the login API) **require a valid JWT access token**.

### Request Header
```http
Authorization: Bearer <token>
