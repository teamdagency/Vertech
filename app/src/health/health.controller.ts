import { Controller, Get } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DbService } from '../drizzle/db.service';

@Controller('health')
export class HealthController {
  constructor(private readonly dbService: DbService) {}

  @Get()
  async check() {
    await this.dbService.db.execute(sql`SELECT 1`);
    return {
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
