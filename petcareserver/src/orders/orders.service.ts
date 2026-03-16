// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Order } from './entities/order.entity';
// import { OrderDetail, ItemType } from './entities/order-detail.entity';
// import { Product } from '../categories/entities/product.entity';
// import { NotificationsService } from '../notifications/notifications.service';

// export class CreateOrderDto {
//   store_id: number;
//   user_id: number;
//   customer_id?: number;
//   total_amount: number;
//   items: {
//     item_type: ItemType;
//     product_id?: number;
//     service_id?: number;
//     pet_id?: number;
//     quantity: number;
//     unit_price: number;
//   }[];
// }

// @Injectable()
// export class OrdersService {
//   constructor(
//     @InjectRepository(Order)
//     private readonly orderRepository: Repository<Order>,
//     @InjectRepository(OrderDetail)
//     private readonly orderDetailRepository: Repository<OrderDetail>,
//     @InjectRepository(Product)
//     private readonly productRepository: Repository<Product>,
//     private readonly notificationsService: NotificationsService,
//   ) {}

//   /**
//    * Create a new order
//    */
//   async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
//     // Start a transaction-like process to handle order creation and notifications
//     const order = this.orderRepository.create({
//       store_id: createOrderDto.store_id,
//       user_id: createOrderDto.user_id,
//       customer_id: createOrderDto.customer_id,
//       total_amount: createOrderDto.total_amount,
//     });

//     const savedOrder = await this.orderRepository.save(order);

//     // Process order items and update product stock
//     for (const item of createOrderDto.items) {
//       const orderDetail = this.orderDetailRepository.create({
//         order_id: savedOrder.order_id,
//         item_type: item.item_type,
//         product_id: item.product_id,
//         service_id: item.service_id,
//         pet_id: item.pet_id,
//         quantity: item.quantity,
//         unit_price: item.unit_price,
//         subtotal: item.unit_price * item.quantity,
//       });

//       await this.orderDetailRepository.save(orderDetail);

//       // If it's a product order, update stock and check for notifications
//       if (item.item_type === ItemType.PRODUCT && item.product_id) {
//         const product = await this.productRepository.findOne({
//           where: { product_id: item.product_id },
//         });

//         if (!product) {
//           throw new NotFoundException(`Product ${item.product_id} not found`);
//         }

//         if (product.stock_quantity < item.quantity) {
//           throw new BadRequestException(
//             `Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`,
//           );
//         }

//         // Update product stock
//         product.stock_quantity -= item.quantity;
//         await this.productRepository.save(product);

//         // Check and create notifications for updated stock
//         await this.checkAndCreateNotifications(
//           createOrderDto.store_id,
//           product,
//           createOrderDto.user_id,
//         );
//       }
//     }

//     return this.orderRepository.findOne({
//       where: { order_id: savedOrder.order_id },
//       relations: ['order_details', 'user', 'customer'],
//     });
//   }

//   /**
//    * Get order by ID
//    */
//   async getOrderById(orderId: number): Promise<Order> {
//     const order = await this.orderRepository.findOne({
//       where: { order_id: orderId },
//       relations: ['order_details', 'user', 'customer', 'store'],
//     });

//     if (!order) {
//       throw new NotFoundException(`Order ${orderId} not found`);
//     }

//     return order;
//   }

//   /**
//    * Get orders by store
//    */
//   async getStoreOrders(storeId: number): Promise<Order[]> {
//     return this.orderRepository.find({
//       where: { store_id: storeId },
//       relations: ['order_details', 'user', 'customer'],
//       order: { created_at: 'DESC' },
//     });
//   }

//   /**
//    * Check product stock and expiry date, create notifications if needed
//    */
//   private async checkAndCreateNotifications(
//     storeId: number,
//     product: Product,
//   ): Promise<void> {
//     try {
//       // Check if product is out of stock
//       if (product.stock_quantity === 0) {
//         await this.notificationsService.createOutOfStockNotification(
//           storeId,
//           product.product_id,
//           product.name,
//         );
//         return;
//       }

//       // Check if product stock is below minimum level
//       if (product.stock_quantity <= product.min_stock_level) {
//         await this.notificationsService.createLowStockNotification(
//           storeId,
//           product.product_id,
//           product.stock_quantity,
//           product.min_stock_level,
//           product.name,
//         );
//       }

//       // Check if product is about to expire (within 7 days)
//       if (product.expiry_date) {
//         const now = new Date();
//         const daysUntilExpiry = Math.floor(
//           (product.expiry_date.getTime() - now.getTime()) /
//             (1000 * 60 * 60 * 24),
//         );

//         if (daysUntilExpiry >= 0 && daysUntilExpiry <= 7) {
//           await this.notificationsService.createExpiryWarningNotification(
//             storeId,
//             product.product_id,
//             product.name,
//             product.expiry_date,
//           );
//         }
//       }
//     } catch (error) {
//       // Log error but don't throw to avoid disrupting the order
//       console.error('Error creating notification:', error);
//     }
//   }
// }
