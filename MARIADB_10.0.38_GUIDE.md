# MariaDB 10.0.38 Compatibility Guide

This MCP server has been specifically optimized for MariaDB 10.0.38, the final release of the MariaDB 10.0 series (released January 31, 2019).

## Key Compatibility Features

### 1. Connection Optimizations
- Uses `utf8mb4` charset for proper Unicode support
- Disables bulk operations not available in 10.0.38
- Sets compatible SQL mode (`TRADITIONAL`)
- Disables newer authentication features for compatibility
- Uses local timezone handling

### 2. Query Validation
The server now validates queries against features not available in MariaDB 10.0.38:

**Unsupported Features Detected:**
- JSON functions (JSON_EXTRACT, JSON_OBJECT, etc.)
- Window functions (ROW_NUMBER, RANK, PARTITION BY, etc.)
- Advanced full-text search features

When these features are detected, the server will log warnings but attempt to execute the query.

### 3. Version Detection
The server automatically detects your MariaDB version and provides compatibility feedback:
- ✓ MariaDB 10.0.x: Fully compatible
- ⚠ Other MariaDB versions: Should work but optimized for 10.0.38
- ⚠ MySQL: Should work but optimized for MariaDB

## Installation for MariaDB 10.0.38

### 1. Prerequisites
- MariaDB 10.0.38 server running
- Node.js 10+ (the mariadb connector supports Node 10+)
- Appropriate database user with required permissions

### 2. Recommended Database User Setup
```sql
-- Create a dedicated user for the MCP server
CREATE USER 'mcp_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant read-only permissions (recommended)
GRANT SELECT, SHOW DATABASES ON *.* TO 'mcp_user'@'localhost';

-- Or grant specific database access
GRANT SELECT ON your_database.* TO 'mcp_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;
```

### 3. Environment Configuration
Use the provided `mariadb-10.0.38-example.env` as a template:

```bash
cp mariadb-10.0.38-example.env .env
# Edit .env with your database credentials
```

### 4. MCP Configuration
Use the optimized MCP settings from `mcp-settings-example.json`:

```json
{
  "mcpServers": {
    "mariadb-10.0.38": {
      "command": "node",
      "args": ["/path/to/mariadb-mcp-server/dist/index.js"],
      "env": {
        "MARIADB_HOST": "localhost",
        "MARIADB_PORT": "3306",
        "MARIADB_USER": "mcp_user",
        "MARIADB_PASSWORD": "secure_password",
        "MARIADB_DATABASE": "your_database",
        "MARIADB_ALLOW_INSERT": "false",
        "MARIADB_ALLOW_UPDATE": "false",
        "MARIADB_ALLOW_DELETE": "false",
        "MARIADB_TIMEOUT_MS": "10000",
        "MARIADB_ROW_LIMIT": "1000"
      }
    }
  }
}
```

## Testing Compatibility

### 1. Basic Connection Test
```bash
# Set environment variables
export MARIADB_HOST=localhost
export MARIADB_PORT=3306
export MARIADB_USER=mcp_user
export MARIADB_PASSWORD=secure_password

# Run the test
npm run test:setup
npm run test:tools
```

### 2. Manual Version Check
Connect to your MariaDB server and verify the version:
```sql
SELECT VERSION();
```
Should return something like: `10.0.38-MariaDB`

### 3. Feature Compatibility Test
Try these queries through the MCP server:

**✅ Supported:**
```sql
SELECT * FROM information_schema.tables LIMIT 10;
SHOW DATABASES;
DESCRIBE your_table;
SELECT COUNT(*) FROM your_table;
```

**⚠️ Will warn but may work:**
```sql
-- These will generate compatibility warnings
SELECT JSON_EXTRACT('{"key":"value"}', '$.key');  -- JSON not in 10.0.38
SELECT ROW_NUMBER() OVER (ORDER BY id) FROM your_table;  -- Window functions not in 10.0.38
```

## Known Limitations with MariaDB 10.0.38

1. **JSON Support**: No native JSON data type or functions
2. **Window Functions**: Not available until MariaDB 10.2
3. **Common Table Expressions (CTEs)**: Not available until MariaDB 10.2
4. **SEQUENCES**: Not available until MariaDB 10.3
5. **Query Timeouts**: Per-query timeout parameter not supported (added in 10.1.2)
6. **Advanced Authentication**: Limited plugin support compared to newer versions

## Alternative Syntax for Compatibility

### Instead of JSON functions:
```sql
-- Instead of JSON_EXTRACT
-- Use string functions for simple JSON parsing
SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(json_col, '"value":"', -1), '"', 1) as extracted_value;
```

### Instead of Window Functions:
```sql
-- Instead of ROW_NUMBER() OVER (ORDER BY id)
-- Use variables (careful with this approach):
SELECT @row_number := @row_number + 1 as row_num, id, name 
FROM your_table, (SELECT @row_number := 0) r 
ORDER BY id;
```

## Troubleshooting

### Connection Issues
1. Verify MariaDB 10.0.38 is running: `systemctl status mariadb`
2. Check user permissions: `SHOW GRANTS FOR 'mcp_user'@'localhost';`
3. Test direct connection: `mysql -h localhost -u mcp_user -p`

### Query Compatibility Issues
1. Check server logs for compatibility warnings
2. Use simpler SQL syntax when possible
3. Refer to MariaDB 10.0 documentation for supported features

### Performance Considerations
- MariaDB 10.0.38 has different optimizer behavior than newer versions
- Conservative timeout and row limits are recommended
- Consider using indexes appropriate for this version's optimizer

## Migration Path

If you need newer features, consider upgrading your MariaDB server:
- 10.0.38 → 10.1.x (adds JSON, basic CTEs)
- 10.1.x → 10.2.x (adds Window Functions, advanced CTEs)
- 10.2.x → 10.3.x (adds System Versioned Tables, SEQUENCES)

Each upgrade should maintain backward compatibility while adding new features. 