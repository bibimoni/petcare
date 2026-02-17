/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: (configService: ConfigService) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return cloudinary.config({
      cloud_name: configService.get<string>('CLD_CLOUD_NAME'),
      api_key: configService.get<string>('CLD_API_KEY'),
      api_secret: configService.get<string>('CLD_API_SECRET'),
    });
  },
  inject: [ConfigService],
};
