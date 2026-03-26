import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Matches } from 'class-validator';

export class UpdateNotificationScheduleDto {
  @ApiProperty({
    description:
      'Cron expression cho lịch thông báo. Truyền null để reset về mặc định (8:00 sáng mỗi ngày)',
    example: '0 0 9 * * *',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\S+\s){5}\S+$/, {
    message:
      'cron_expression không hợp lệ. Ví dụ hợp lệ: "0 0 8 * * *" (8:00 sáng mỗi ngày)',
  })
  cron_expression: string | null;
}
