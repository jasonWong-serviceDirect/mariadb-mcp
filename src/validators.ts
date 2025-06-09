/**
 * SQL query validators for MariaDB MCP server
 * Ensures that only read-only queries are allowed
 * Optimized for MariaDB 10.0.38 compatibility
 */

// Base list of SQL commands that could be allowed
const BASE_ALLOWED_COMMANDS = [
  "SELECT",
  "SHOW",
  "DESCRIBE",
  "DESC",
  "EXPLAIN",
];

// Write operations that can be conditionally allowed
const CONDITIONAL_COMMANDS = {
  INSERT: "INSERT",
  UPDATE: "UPDATE", 
  DELETE: "DELETE",
};

// List of disallowed SQL commands (write operations)
const DISALLOWED_COMMANDS = [
  "DROP",
  "CREATE",
  "ALTER",
  "TRUNCATE",
  "RENAME",
  "REPLACE",
  "GRANT",
  "REVOKE",
  "LOCK",
  "UNLOCK",
  "CALL",
  "EXEC",
  "EXECUTE",
  "START",
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
];

// Features introduced after MariaDB 10.0.38 that should be avoided
const MARIADB_10_0_UNSUPPORTED_FEATURES = [
  "JSON_EXTRACT",
  "JSON_UNQUOTE", 
  "JSON_OBJECT",
  "JSON_ARRAY",
  "JSON_VALID",
  "JSON_TYPE",
  "JSON_COMPACT",
  "JSON_LOOSE",
  "JSON_DETAILED",
  "MATCH.*AGAINST.*IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION",
  "WINDOW FUNCTION",
  "OVER\\s*\\(",
  "ROW_NUMBER\\s*\\(",
  "RANK\\s*\\(",
  "DENSE_RANK\\s*\\(",
  "PARTITION BY",
];

/**
 * Check if query uses features not available in MariaDB 10.0.38
 * @param query SQL query to check
 * @returns warning message if unsupported features detected, null otherwise
 */
function checkMariaDB10_0_Compatibility(query: string): string | null {
  const normalizedQuery = query.toUpperCase();
  
  for (const feature of MARIADB_10_0_UNSUPPORTED_FEATURES) {
    const regex = new RegExp(feature, 'i');
    if (regex.test(normalizedQuery)) {
      return `Warning: The query contains '${feature}' which may not be supported in MariaDB 10.0.38. Consider using alternative syntax.`;
    }
  }
  
  return null;
}

/**
 * Validates if a SQL query is read-only
 * @param query SQL query to validate
 * @returns true if the query is read-only, false otherwise
 */
export function isAlloowedQuery(query: string): boolean {
  // Normalize query by removing comments and extra whitespace
  const normalizedQuery = query
    .replace(/--.*$/gm, "") // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .toUpperCase();
    
  const ALLOW_INSERT = process.env.MARIADB_ALLOW_INSERT === "true";
  const ALLOW_UPDATE = process.env.MARIADB_ALLOW_UPDATE === "true";
  const ALLOW_DELETE = process.env.MARIADB_ALLOW_DELETE === "true";

  // Build dynamic allowed commands list based on environment variables
  const allowedCommands = [...BASE_ALLOWED_COMMANDS];
  if (ALLOW_INSERT) {
    allowedCommands.push(CONDITIONAL_COMMANDS.INSERT);
  }
  if (ALLOW_UPDATE) {
    allowedCommands.push(CONDITIONAL_COMMANDS.UPDATE);
  }
  if (ALLOW_DELETE) {
    allowedCommands.push(CONDITIONAL_COMMANDS.DELETE);
  }

  // Check for MariaDB 10.0.38 compatibility
  const compatibilityWarning = checkMariaDB10_0_Compatibility(query);
  if (compatibilityWarning) {
    console.error(`[Validator] ${compatibilityWarning}`);
  }

  // Check if query starts with an allowed command
  const startsWithAllowed = allowedCommands.some(
    (cmd) => normalizedQuery.startsWith(cmd + " ") || normalizedQuery === cmd
  );

  // Check if query contains any disallowed commands
  const containsDisallowed = DISALLOWED_COMMANDS.some((cmd) => {
    const regex = new RegExp(`(^|\\s)${cmd}(\\s|$)`);
    return regex.test(normalizedQuery);
  });

  // Check for multiple statements (;)
  const hasMultipleStatements =
    normalizedQuery.includes(";") && !normalizedQuery.endsWith(";");

  // Debug output for UPDATE queries
  if (normalizedQuery.startsWith("UPDATE")) {
    console.error(`[DEBUG] UPDATE Query Analysis:`);
    console.error(`[DEBUG] Normalized query: "${normalizedQuery}"`);
    console.error(`[DEBUG] Allowed commands: ${JSON.stringify(allowedCommands)}`);
    console.error(`[DEBUG] Starts with allowed: ${startsWithAllowed}`);
    console.error(`[DEBUG] Contains disallowed: ${containsDisallowed}`);
    console.error(`[DEBUG] Has multiple statements: ${hasMultipleStatements}`);
    
    // Check each disallowed command individually
    for (const cmd of DISALLOWED_COMMANDS) {
      const regex = new RegExp(`(^|\\s)${cmd}(\\s|$)`);
      if (regex.test(normalizedQuery)) {
        console.error(`[DEBUG] Found disallowed command: ${cmd}`);
      }
    }
  }

  const result = startsWithAllowed && !containsDisallowed && !hasMultipleStatements;

  // Query is allowed if it starts with an allowed command,
  // doesn't contain any disallowed commands, and doesn't have multiple statements
  return result;
}

/**
 * Validates if a SQL query is safe to execute on MariaDB 10.0.38
 * @param query SQL query to validate
 * @throws Error if the query is not safe
 */
export function validateQuery(query: string): void {
  console.error("[Validator] Validating query for MariaDB 10.0.38:", query);

  if (!query || typeof query !== "string") {
    throw new Error("Query must be a non-empty string");
  }

  if (!isAlloowedQuery(query)) {
    console.error("[Validator] Query rejected: not allowed");
    throw new Error(
      "Query contains disallowed commands or is not permitted by current configuration"
    );
  }

  console.error("[Validator] Query validated for MariaDB 10.0.38");
}
