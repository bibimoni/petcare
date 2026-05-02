import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { PetsModule } from './pets/pets.module';
import { ProductsModule } from './categories/products/products.module';
import { ServicesModule } from './categories/services/services.module';
import { CategoriesModule } from './categories/categories.module';
import { StoresModule } from './stores/stores.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = (configService.get<string>('DB_TYPE') || 'postgres') as 'postgres' | 'sqlite';
        
        const baseConfig = {
          type: dbType,
          autoLoadEntities: true,
          synchronize: true,
          ssl:
            process.env.NODE_ENV === 'production'
              ? { rejectUnauthorized: false }
              : false,
        };

        if (dbType === 'sqlite') {
          return {
            ...baseConfig,
            database: ':memory:',
          } as TypeOrmModuleOptions;
        }

        return {
          ...baseConfig,
          url: configService.get<string>('POSTGRES_URI'),
        } as TypeOrmModuleOptions;
      },
    }),
    AuthModule,
    UsersModule,
    OrdersModule,
    CustomersModule,
    PetsModule,
    ProductsModule,
    ServicesModule,
    CategoriesModule,
    StoresModule,
    PermissionsModule,
    RolesModule,
    MailModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}