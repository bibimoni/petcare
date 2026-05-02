import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '../../common/enum';

class InvitationDetails {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the invitation',
  })
  id: number;

  @ApiProperty({
    example: 'staff@pethaven.com',
    description: 'Email address of the invited staff member',
  })
  email: string;

  @ApiProperty({
    example: InvitationStatus.PENDING,
    description: 'Status of the invitation',
  })
  status: InvitationStatus;

  @ApiProperty({
    example: 'abc123def456',
    description: 'Unique token for accepting the invitation',
  })
  token: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Expiration date and time of the invitation',
  })
  expires_at: Date;

  @ApiProperty({
    example: 'Welcome to our team! Please complete your registration.',
    description: 'Custom invitation message',
    required: false,
  })
  message?: string;
}

export class RoleInfo {
  @ApiProperty({
    example: 2,
    description: 'Role ID',
  })
  id: number;

  @ApiProperty({
    example: 'STAFF',
    description: 'Role name',
  })
  name: string;

  @ApiProperty({
    example: 'Store Staff with basic access',
    description: 'Role description',
  })
  description: string;
}

export class StoreInfo {
  @ApiProperty({
    example: 1,
    description: 'Store ID',
  })
  id: number;

  @ApiProperty({
    example: 'Pet Haven',
    description: 'Store name',
  })
  name: string;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Store status',
  })
  status: string;
}

export class InviteStaffResponseDto {
  @ApiProperty({
    example: 'Invitation sent successfully',
    description: 'Status message',
  })
  message: string;

  @ApiProperty({
    type: InvitationDetails,
    description: 'Invitation details',
  })
  invitation: InvitationDetails;

  @ApiProperty({
    type: RoleInfo,
    description: 'Role information',
  })
  role: RoleInfo;

  @ApiProperty({
    type: StoreInfo,
    description: 'Store information',
  })
  store: StoreInfo;

  @ApiProperty({
    example: 'An invitation link has been generated.',
    description: 'Note with invitation information',
  })
  note: string;
}
