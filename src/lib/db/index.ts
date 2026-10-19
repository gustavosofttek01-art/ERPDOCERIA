import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import { INITIAL_SCHEMA_SQL } from './schema-ddl';
import { SEED_DEMO_DATA } from './seed-data';

declare global {
  var __pglite_db__: PGlite | undefined;
  var __pglite_initialized__: boolean | undefined;
}

export async function getDb(): Promise<PGlite> {
  if (!globalThis.__pglite_db__) {
    if (process.env.NODE_ENV === 'test') {
      // In tests, use fast in-memory PostgreSQL to avoid worker file lock contention
      const db = new PGlite();
      globalThis.__pglite_db__ = db;
    } else {
      const dataDir = process.env.PG_DATA_DIR 
        ? path.resolve(process.cwd(), process.env.PG_DATA_DIR)
        : path.resolve(process.cwd(), './data/pgdata');

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const db = new PGlite(dataDir);
      globalThis.__pglite_db__ = db;
    }
  }

  const db = globalThis.__pglite_db__;

  if (!globalThis.__pglite_initialized__) {
    try {
      await db.exec(INITIAL_SCHEMA_SQL);
      await SEED_DEMO_DATA(db);
      globalThis.__pglite_initialized__ = true;
    } catch (err) {
      console.error('Error initializing database schema/seed:', err);
      throw err;
    }
  }

  return db;
}

export interface QueryResult<T = any> {
  rows: T[];
  affectedRows?: number;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  const db = await getDb();
  const res = await db.query(sql, params);
  return {
    rows: res.rows as T[],
    affectedRows: res.affectedRows,
  };
}

export async function transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
  const db = await getDb();
  return await db.transaction(callback);
}
