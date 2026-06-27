import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

/**
 * Source de vérité unique : PostgreSQL (ADR-002).
 * ORM : Drizzle (choisi au bootstrap, alternative à Prisma — cf.
 * docs/architecture/README.md). Le schéma est introspecté depuis
 * database/schema.sql, qui reste la référence métier (MERISE).
 */
@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  public db: NodePgDatabase<typeof schema>;

  async onModuleInit() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(this.pool, { schema });
    // Vérifie la connexion dès le démarrage du module.
    await this.pool.query('SELECT 1');
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
