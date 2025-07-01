/**
 * MariaDB connection management for MCP server
 * Optimized for MariaDB 10.0.38 compatibility
 */

import mariadb from "mariadb";
import { MariaDBConfig } from "./types.js";
import { isAlloowedQuery } from "./validators.js";

// Default connection timeout in milliseconds
const DEFAULT_TIMEOUT = 10000;

// Default row limit for query results
const DEFAULT_ROW_LIMIT = 1000;

let pool: mariadb.Pool | null = null;
let connection: mariadb.PoolConnection | null = null;

/**
 * Convert BigInt values to strings for JSON serialization
 * @param obj Object that may contain BigInt values
 * @returns Object with BigInt values converted to strings
 */
function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }
  
  return obj;
}

/**
 * Create a MariaDB connection pool with 10.0.38 compatibility settings
 */
export function createConnectionPool(): mariadb.Pool {
  console.error("[Setup] Creating MariaDB connection pool (optimized for 10.0.38)");
  const config = getConfigFromEnv();
  if (pool) {
    console.error("[Setup] Connection pool already exists");
    return pool;
  }
  try {
    pool = mariadb.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: 2,
      connectTimeout: DEFAULT_TIMEOUT, // Connection timeout only (supported in 10.0.38)
      acquireTimeout: DEFAULT_TIMEOUT, // Pool acquisition timeout
      // MariaDB 10.0.38 compatibility settings
      charset: 'utf8mb4',
      // Disable features not available in 10.0.38
      bulk: false,
      // Use compatible SQL mode for older versions
      sessionVariables: {
        sql_mode: 'TRADITIONAL'
      },
      // Ensure compatibility with older auth plugins
      permitSetMultiParamEntries: false,
      // Disable compression for better compatibility
      compress: false,
      // Set explicit timezone handling
      timezone: 'local',
      // Note: queryTimeout not used for 10.0.38 compatibility
    });
  } catch (error) {
    console.error("[Error] Failed to create connection pool:", error);
    throw error;
  }
  return pool;
}

/**
 * Execute a query with error handling and logging
 * Optimized for MariaDB 10.0.38 compatibility
 */
export async function executeQuery(
  sql: string,
  params: any[] = [],
  database?: string
): Promise<{ rows: any; fields: mariadb.FieldInfo[] }> {
  console.error(`[Query] Executing: ${sql}`);
  // Create connection pool if not already created
  if (!pool) {
    console.error("[Setup] Connection pool not found, creating a new one");
    pool = createConnectionPool();
  }
  try {
    // Get connection from pool
    if (connection) {
      console.error("[Query] Reusing existing connection");
    } else {
      console.error("[Query] Creating new connection");
      connection = await pool.getConnection();
    }

    // Use specific database if provided
    if (database) {
      console.error(`[Query] Using database: ${database}`);
      await connection.query(`USE \`${database}\``);
    }
    if (!isAlloowedQuery(sql)) {
      throw new Error("Query not allowed");
    }
    
    // Execute query with 10.0.38 compatible options (no timeout parameter)
    const [rows, fields] = await connection.query({
      metaAsArray: true,
      namedPlaceholders: false, // Safer for 10.0.38
      sql,
      ...params,
      // Note: timeout removed for MariaDB 10.0.38 compatibility
    });

    // Apply row limit if result is an array
    const limitedRows =
      Array.isArray(rows) && rows.length > DEFAULT_ROW_LIMIT
        ? rows.slice(0, DEFAULT_ROW_LIMIT)
        : rows;

    // Convert BigInt values to strings for JSON serialization
    const serializedRows = convertBigIntToString(limitedRows);

    // Log result summary
    console.error(
      `[Query] Success: ${
        Array.isArray(rows) ? rows.length : 1
      } rows returned with ${JSON.stringify(params)}`
    );

    return { rows: serializedRows, fields };
  } catch (error) {
    if (connection) {
      connection.release();
      connection = null;
      console.error("[Query] Connection released with error");
    }
    console.error("[Error] Query execution failed:", error);
    throw error;
  } finally {
    // Release connection back to pool
    if (connection) {
      connection.release();
      connection = null;
      console.error("[Query] Connection released");
    }
  }
}

/**
 * Get MariaDB connection configuration from environment variables
 */
export function getConfigFromEnv(): MariaDBConfig {
  const host = process.env.MARIADB_HOST;
  const portStr = process.env.MARIADB_PORT;
  const user = process.env.MARIADB_USER;
  const password = process.env.MARIADB_PASSWORD;
  const database = process.env.MARIADB_DATABASE;
  const allow_insert = process.env.MARIADB_ALLOW_INSERT === "true";
  const allow_update = process.env.MARIADB_ALLOW_UPDATE === "true";
  const allow_delete = process.env.MARIADB_ALLOW_DELETE === "true";

  if (!host) throw new Error("MARIADB_HOST environment variable is required");
  if (!user) throw new Error("MARIADB_USER environment variable is required");
  if (!password)
    throw new Error("MARIADB_PASSWORD environment variable is required");

  const port = portStr ? parseInt(portStr, 10) : 3306;

  console.error("[Setup] MariaDB configuration:", {
    host: host,
    port: port,
    user: user,
    database: database || "(default not set)",
  });

  return {
    host,
    port,
    user,
    password,
    database,
    allow_insert,
    allow_update,
    allow_delete,
  };
}

export function endConnection() {
  if (pool) {
    return pool.end();
  }
}

// Export the BigInt conversion utility for use in other files
export { convertBigIntToString };
