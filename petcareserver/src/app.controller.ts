import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private datasource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('db-test')
  async testDBConnection(): Promise<string> {
    try {
      await this.datasource.query('SELECT 1');
      return 'Database connection successful!';
    } catch (error) {
      return `Database connection failed: ${error.message}`;
    }
  }
}
