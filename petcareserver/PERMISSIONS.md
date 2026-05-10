# Permissions Reference

## System Scope

| Permission Slug | Users | Stores | Analytics | Subscriptions |
|---|:---:|:---:|:---:|:---:|
| `system.users.manage` | manage | | | |
| `system.stores.manage` | | manage | | |
| `system.view_analytics` | | | read | |
| `system.manage_subscriptions` | | | | manage |

## Store Scope

| Permission Slug | Store | Customer | Pet | Product | Inventory | Service | Order | Category | Staff | Role | Analytics | Reports |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `store.view` | read | | | | | | | | | | | |
| `store.settings.manage` | manage | | | | | | | | | | | |
| `customer.view` | | read | | | | | | | | | | |
| `customer.create` | | create | | | | | | | | | | |
| `customer.edit` | | edit | | | | | | | | | | |
| `customer.delete` | | delete | | | | | | | | | | |
| `customer.manage` | | manage | | | | | | | | | | |
| `pet.view` | | | read | | | | | | | | | |
| `pet.create` | | | create | | | | | | | | | |
| `pet.edit` | | | edit | | | | | | | | | |
| `pet.delete` | | | delete | | | | | | | | | |
| `product.view` | | | | read | | | | | | | | |
| `product.create` | | | | create | | | | | | | | |
| `product.edit` | | | | edit | | | | | | | | |
| `product.delete` | | | | delete | | | | | | | | |
| `product.manage` | | | | manage | | | | | | | | |
| `inventory.view` | | | | | read | | | | | | | |
| `inventory.manage` | | | | | manage | | | | | | | |
| `inventory.adjust` | | | | | adjust | | | | | | | |
| `service.view` | | | | | | read | | | | | | |
| `service.create` | | | | | | create | | | | | | |
| `service.edit` | | | | | | edit | | | | | | |
| `service.delete` | | | | | | delete | | | | | | |
| `service.manage` | | | | | | manage | | | | | | |
| `order.view` | | | | | | | read | | | | | |
| `order.view_all` | | | | | | | read_all | | | | | |
| `order.create` | | | | | | | create | | | | | |
| `order.edit` | | | | | | | edit | | | | | |
| `order.cancel` | | | | | | | cancel | | | | | |
| `order.refund` | | | | | | | refund | | | | | |
| `category.create` | | | | | | | | create | | | | |
| `category.edit` | | | | | | | | edit | | | | |
| `category.delete` | | | | | | | | delete | | | | |
| `category.manage` | | | | | | | | manage | | | | |
| `staff.view` | | | | | | | | | read | | | |
| `staff.create` | | | | | | | | | create | | | |
| `staff.edit` | | | | | | | | | edit | | | |
| `staff.delete` | | | | | | | | | delete | | | |
| `staff.invite` | | | | | | | | | invite | | | |
| `role.view` | | | | | | | | | | read | | |
| `role.create` | | | | | | | | | | create | | |
| `role.edit` | | | | | | | | | | edit | | |
| `role.delete` | | | | | | | | | | delete | | |
| `role.assign` | | | | | | | | | | assign | | |
| `analytics.view` | | | | | | | | | | | read | |
| `reports.view` | | | | | | | | | | | | read |
| `reports.export` | | | | | | | | | | | | export |

## Resource ↔ Action Matrix

### System Scope

| Resource | Read | Manage |
|---|:---:|:---:|
| Users | | `system.users.manage` |
| Stores | | `system.stores.manage` |
| Analytics | `system.view_analytics` | |
| Subscriptions | | `system.manage_subscriptions` |

### Store Scope

| Resource | Read | Create | Edit | Delete | Manage | Other |
|---|:---:|:---:|:---:|:---:|:---:|---|
| Store | `store.view` | — | `store.settings.manage` | `store.settings.manage` | `store.settings.manage` | — |
| Customer | `customer.view` | `customer.create` | `customer.edit` | `customer.delete` | `customer.manage` | — |
| Pet | `pet.view` | `pet.create` | `pet.edit` | `pet.delete` | — | — |
| Product | `product.view` | `product.create` | `product.edit` | `product.delete` | `product.manage` | — |
| Inventory | `inventory.view` | — | — | — | `inventory.manage` | `inventory.adjust` |
| Service | `service.view` | `service.create` | `service.edit` | `service.delete` | `service.manage` | — |
| Order | `order.view` | `order.create` | `order.edit` | — | — | `order.view_all`, `order.cancel`, `order.refund` |
| Category | — | `category.create` | `category.edit` | `category.delete` | `category.manage` | — |
| Staff | `staff.view` | `staff.create` | `staff.edit` | `staff.delete` | — | `staff.invite` |
| Role | `role.view` | `role.create` | `role.edit` | `role.delete` | — | `role.assign` |
| Analytics | `analytics.view` | — | — | — | — | — |
| Reports | `reports.view` | — | — | — | — | `reports.export` |
