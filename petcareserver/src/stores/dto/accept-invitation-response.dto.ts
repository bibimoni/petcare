import { ApiProperty } from '@nestjs/swagger';

export class UserInfo {
  @ApiProperty({ 
    example: 123,
    description: 'User ID' 
  })
  user_id: number;

  @ApiProperty({ 
    example: 'john.doe@example.com',
    description: 'User email' 
  })
  email: string;

  @ApiProperty({ 
    example: 'John Doe',
    description: 'User full name' 
  })
  full_name: string;

  @ApiProperty({ 
    example: 'ACTIVE',
    description: 'User status' 
  })
  status: string;
}

export class RoleInfo {
  @ApiProperty({ 
    example: 2,
    description: 'Role ID' 
  })
  id: number;

  @ApiProperty({ 
    example: 'STAFF',
    description: 'Role name' 
  })
  name: string;

  @ApiProperty({ 
    example: 'Store Staff with basic access',
    description: 'Role description' 
  })
  description: string;
}

export class StoreInfo {
  @ApiProperty({ 
    example: 1,
    description: 'Store ID' 
  })
  id: number;

  @ApiProperty({ 
    example: 'Pet Haven',
    description: 'Store name' 
  })
  name: string;

  @ApiProperty({ 
    example: 'ACTIVE',
    description: 'Store status' 
  })
  status: string;
}

export class AcceptInvitationResponseDto {
  @ApiProperty({ 
    example: 'Invitation accepted successfully',
    description: 'Status message' 
  })
  message: string;

  @ApiProperty({ 
    type: UserInfo,
    description: 'User information' 
  })
  user: UserInfo;

  @ApiProperty({ 
    type: StoreInfo,
    description: 'Store information' 
  })
  store: StoreInfo;

  @ApiProperty({ 
    type: RoleInfo,
    description: 'Role information' 
  })
  role: RoleInfo;

  @ApiProperty({ 
    example: 'You have been successfully added to the store. Please log in to continue.',
    description: 'Additional instructions' 
  })
  note: string;
}
