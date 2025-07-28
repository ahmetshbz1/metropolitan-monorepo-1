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
  
  // Enhanced connection pooling for production
  max: 30, // Increased for production load
  idle_timeout: 30, // Increased for better connection reuse
  connect_timeout: 5, // Reduced for faster failure detection
  
  // Query optimizations
  prepare: true, // Enable prepared statements for repeated queries
  statement_timeout: 10000, // 10 second query timeout
  query_timeout: 10000, // Overall query timeout
  
  // Statement caching and type handling
  types: {
    bigint: postgres.BigInt,
  },
  
  // Transform undefined to null for consistency
  transform: {
    undefined: null,
  },
  
  // Connection health check
  onnotice: () => {}, // Suppress notices for performance
});

export const db = drizzle(client, { schema });
