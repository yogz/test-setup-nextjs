import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 60 * 30, // 30 minutes - recyclage des connexions
  connection: {
    application_name: 'nextjs-app',
  },
  // Prévenir les timeouts négatifs lors de la reconnexion
  transform: {
    undefined: null,
  },
  onnotice: () => {}, // Supprime les avertissements PostgreSQL
});

export const db = drizzle(client, { schema });
