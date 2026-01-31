# 🐾 PetCare Management System – API Documentation

A backend management system for pet care businesses, designed to support sales, services, and customer management for the PetCare store.

---

## 1. Authentication

- **POST** `/petcare/auth/login`: Login
- **POST** `/petcare/auth/logout`: Logout
- **POST** `/petcare/customers`: Register Customer

---

## 2. Customer & User Information

- **GET** `/petcare/customers/search?phone={number}`: Search Customer by Phone
- **GET** `/petcare/customers/{customer_id}/orders`: Customer Order History
- **GET** `/petcare/customers`: Get All Customers
- **GET** `/petcare/users`: Get Staff Users
- **PATCH** `/petcare/customers/{customer_id}`: Update Customer Info


---

## 3. Pets of Customers

- **POST** `/petcare/pets`: Create Pet
- **PATCH** `/petcare/pets/{pet_id}`: Update Pet  
- **GET** `/petcare/pets/{pet_id}`: Pet Detail  
- **GET** `/petcare/customers/{customer_id}/pets`: Customer Pets  
- **DELETE** `/petcare/pets/{pet_id}`: Delete Pet (Soft Delete)  
- **POST** `/petcare/pets/{pet_id}/weights`: Record Pet Weight  
- **GET** `/petcare/pets/{pet_id}/weights`: Pet Weight History  

---

## 4. Categories

### Update Category
- **PATCH** `/petcare/categories/{id}`: Update Category  
- **GET** `/petcare/categories`: Get Categories  
---

### 4.1 Products


- **POST** `/petcare/products`: Create Product  
- **PATCH** `/petcare/products/{product_id}`: Update Product Info (no update stock_quantity)
- **POST** `/petcare/products/{id}/import`: Import Stock  
- **GET** `/petcare/products/{id}/stock-history`: Stock History  
- **GET** `/petcare/products/search?name={name}`: Search Product  
- **GET** `/petcare/products/low-stock`: Low Stock Alert  
- **GET** `/petcare/products`: Get Products  
---

### 4.2 Services

- **POST** `/petcare/services`: Create Service  
- **PATCH** `/petcare/services/{service_id}`: Update Service Price  
- **GET** `/petcare/services`: Get Services  

---

### 4.3 Pets for Sale

- **POST** `/petcare/pet-sold`: Add Pet for Sale  
- **PATCH** `/petcare/pet-sold/{pet_sell_id}`: Update Pet Sale Info  
- **GET** `/petcare/pet-sold/available`: Available Pets  
- **GET** `/petcare/pet-sold/sold`: Sold Pets  

---

## 5. Orders & Returns

- **POST** `/petcare/orders`: Create Order  
- **GET** `/petcare/orders`: Order List (day/week/year)  
- **GET** `/petcare/orders/{order_id}`: Order Detail  
- **PATCH** `/petcare/orders/{order_id}/status`: Update Order Status  
- **PATCH** `/petcare/orders/{order_id}/payment-method`: Update Payment Method  
- **PUT** `/petcare/orders/{order_id}/cancel`: Cancel Order  
- **POST** `/petcare/orders/{order_id}/items`: Add Order Item  
- **PATCH** `/petcare/orders/{order_id}/items/{item_id}`: Update Order Item  
- **DELETE** `/petcare/orders/{order_id}/items/{item_id}`: Remove Order Item  
- **GET** `/petcare/orders/{order_id}/print`: Print Order

---

## 6. Dashboard & Reports

- **GET** `/petcare/dashboard/revenue-chart?period=week|month|year`: Revenue Chart  
- **GET** `/petcare/dashboard/profit-margin`: Profit Margin  
- **GET** `/petcare/dashboard/top-products`: Top 5 Products  
- **GET** `/petcare/dashboard/top-services`: Top Services  
- **GET** `/petcare/dashboard/pet-sales-ratio`: Pet Sales Ratio  
- **GET** `/petcare/dashboard/customer-growth`: Customer Growth  

---

## 7. Notifications

- **GET** `/petcare/notifications`: Get Notifications  
- **PATCH** `/petcare/notifications/{id}/read`: Mark Notification as Read  
- **GET** `/petcare/notifications/unread-count`: Unread Count  
- **GET** `/petcare/products/expired-soon?days|month`: Expired Products Alert  
- **PATCH** `/petcare/orders/{order_id}/status`: Payment Success Notification  (status `PAID`).

---

## 8. Others

### Upload File
- **POST** `/petcare/upload`: Upload File  

---

## 🔑 Authorization

> **Note:**  
> All APIs (except the login API) **require a valid JWT access token**.

### Request Header
```http
Authorization: Bearer <token>
