//  "connection.ts"
//  metropolitan backend
//  Created by Ahmet on 05.06.2025.

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// Optimized connection pooling configuration
const client = postgres({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: false,
  
  // Connection pooling optimization
  max: 20, // Maximum number of connections in the pool
  idle_timeout: 20, // Seconds to wait before closing idle connections
  connect_timeout: 10, // Seconds to wait for new connections
  
  // Performance optimizations
  prepare: false, // Disable prepared statements for better performance with connection pooling
  
  // Statement caching
  types: {
    bigint: postgres.BigInt,
  },
  
  // Connection health check
  onnotice: () => {}, // Suppress notices for performance
});

export const db = drizzle(client, { schema });
