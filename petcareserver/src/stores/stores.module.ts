import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { Store } from './entities/store.entity';
import { Invitation } from './entities/invitation.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store,
      Invitation,
      User,
      Role,
      RolePermission,
      Permission,
    ]),
    MailModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService, TypeOrmModule],
})
export class StoresModule {}
