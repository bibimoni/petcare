import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { StoresModule } from './stores/stores.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('POSTGRES_URI'),
        autoLoadEntities: true,
        synchronize: true,
        // for local db connection, comment ssl block
        // ssl: {
        //   rejectUnauthorized: false,
        // },
      }),
    }),
    AuthModule,
    UsersModule,
    OrdersModule,
    CustomersModule,
    ProductsModule,
    StoresModule,
    PermissionsModule,
    RolesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
