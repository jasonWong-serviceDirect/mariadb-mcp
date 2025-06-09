# MariaDB / MySQL Database Access MCP Server

This MCP server provides access to MariaDB / MySQL databases.

**Optimized for MariaDB 10.0.38 Compatibility**

It allows you to:
- List available databases
- List tables in a database
- Describe table schemas
- Execute SQL queries

## MariaDB 10.0.38 Compatibility Features
- **Optimized connection settings**: Uses charset and SQL mode compatible with 10.0.38
- **Feature validation**: Warns about features not available in MariaDB 10.0.38
- **Compatible query execution**: Uses safer parameter binding for older versions
- **Version detection**: Automatically detects and logs server version compatibility

## Security Features
- **Read-only access Default**: SELECT, SHOW, DESCRIBE, and EXPLAIN
- **Query validation**: Prevents SQL injection and blocks any data modification attempts
- **Query timeout**: Prevents long-running queries from consuming resources
- **Row limit**: Prevents excessive data return

## Installation
### Option 1: Install from NPM (Recommended)
```bash
# Install globally
npm install -g mariadb-mcp-server

# Or install locally in your project
npm install mariadb-mcp-server
```

### Option 2: Build from Source
```bash
# Clone the repository
git clone https://github.com/rjsalgado/mariadb-mcp-server.git
cd mariadb-mcp-server

# Install dependencies and build
npm install
npm run build
```

### 2. Configure environment variables
The server requires the following environment variables:

- MARIADB_HOST: Database server hostname
- MARIADB_PORT: Database server port (default: 3306)
- MARIADB_USER: Database username
- MARIADB_PASSWORD: Database password
- MARIADB_DATABASE: Default database name (optional)
- MARIADB_ALLOW_INSERT: false
- MARIADB_ALLOW_UPDATE: false
- MARIADB_ALLOW_DELETE: false
- MARIADB_TIMEOUT_MS: 10000
- MARIADB_ROW_LIMIT: 1000


### 3. Add to MCP settings
Add the following configuration to your MCP settings file:

If you installed via npm (Option 1):
```json
{
  "mcpServers": {
    "mariadb": {
      "command": "npx",
      "args": ["mariadb-mcp-server"],
      "env": {
        "MARIADB_HOST": "your-host",
        "MARIADB_PORT": "3306",
        "MARIADB_USER": "your-user",
        "MARIADB_PASSWORD": "your-password",
        "MARIADB_DATABASE": "your-database",
        "MARIADB_ALLOW_INSERT": "false",
        "MARIADB_ALLOW_UPDATE": "false",
        "MARIADB_ALLOW_DELETE": "false",
        "MARIADB_TIMEOUT_MS": "10000",
        "MARIADB_ROW_LIMIT": "1000",
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

If you built from source (Option 2):
```json
{
  "mcpServers": {
    "mariadb": {
      "command": "node",
      "args": ["/path/to/mariadb-mcp-server/dist/index.js"],
      "env": {
        "MARIADB_HOST": "your-host",
        "MARIADB_PORT": "3306",
        "MARIADB_USER": "your-user",
        "MARIADB_PASSWORD": "your-password",
        "MARIADB_DATABASE": "your-default-database",
        "MARIADB_ALLOW_INSERT": "false",
        "MARIADB_ALLOW_UPDATE": "false",
        "MARIADB_ALLOW_DELETE": "false",
        "MARIADB_TIMEOUT_MS": "10000",
        "MARIADB_ROW_LIMIT": "1000",
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available Tools
**"server_name": "mariadb"** or **"server_name": "mysql"** 


### list_databases
Lists all accessible databases on the MariaDB / MySQL server.
**Parameters**: None

**Example**:
```json
{
  "server_name": "mariadb",
  "tool_name": "list_databases",
  "arguments": {}
}
```

### list_tables
Lists all tables in a specified database.

**Parameters**:
- `database` (optional): Database name (uses default if not specified)

**Example**:
```json
{
  "server_name": "mariadb",
  "tool_name": "list_tables",
  "arguments": {
    "database": "my_database"
  }
}
```

### describe_table
Shows the schema for a specific table.

**Parameters**:
- `database` (optional): Database name (uses default if not specified)
- `table` (required): Table name

**Example**:
```json
{
  "server_name": "mariadb",
  "tool_name": "describe_table",
  "arguments": {
    "database": "my_database",
    "table": "my_table"
  }
}
```

### execute_query
Executes a SQL query.

**Parameters**:
- `query` (required): SQL query
- `database` (optional): Database name (uses default if not specified)

**Example**:
```json
{
  "server_name": "mariadb",
  "tool_name": "execute_query",
  "arguments": {
    "database": "my_database",
    "query": "SELECT * FROM my_table LIMIT 10"
  }
}
```

## MariaDB 10.0.38 Specific Changes

This version has been specifically modified to work optimally with MariaDB 10.0.38:

### Connection Optimizations
- Uses `utf8mb4` charset and `TRADITIONAL` SQL mode
- Disables features not available in 10.0.38 (bulk operations, advanced auth)
- Removes query-level timeouts (not supported until 10.1.2)
- Safer parameter binding for older versions

### Query Validation  
- Detects and warns about unsupported features:
  - JSON functions (not available in 10.0.38)
  - Window functions (added in 10.2+)
  - Advanced full-text search features
- Provides alternative syntax suggestions

### Version Detection
- Automatically detects MariaDB version on connection
- Provides compatibility feedback in logs
- Optimized configuration examples for 10.0.38

### Additional Files
- `mariadb-10.0.38-example.env`: Environment template for 10.0.38
- `MARIADB_10.0.38_GUIDE.md`: Comprehensive setup and compatibility guide

## Testing
The server includes test scripts to verify functionality with your MariaDB / MySQL setup:

### 1. Setup Test Database
This script creates a test database, table, and sample data:

```bash
# Set your MariaDB / MySQL credentials as environment variables
export MARIADB_HOST=localhost
export MARIADB_PORT=3306
export MARIADB_USER=your_username
export MARIADB_PASSWORD=your_password
export MARIADB_ALLOW_INSERT: false
export MARIADB_ALLOW_UPDATE: false
export MARIADB_ALLOW_DELETE: false
export MARIADB_TIMEOUT_MS=10000
export MARIADB_ROW_LIMIT=1000


# Run the setup script
npm run test:setup
```

### 2. Test MCP Tools
This script tests each of the MCP tools against the test database:

```bash
####
# Set your MariaDB / MySQL credentials as environment variables
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_USER=your_username
MARIADB_PASSWORD=your_password
MARIADB_DATABASE=mcp_test_db
MARIADB_ALLOW_INSERT=false
MARIADB_ALLOW_UPDATE=false
MARIADB_ALLOW_DELETE=false
MARIADB_TIMEOUT_MS=10000
MARIADB_ROW_LIMIT=1000
MARIADB_DEBUG_SQL=true
####
export MARIADB_HOST=localhost
export MARIADB_PORT=3306
export MARIADB_USER=your_username
export MARIADB_PASSWORD=your_password
export MARIADB_DATABASE=mcp_test_db
export MARIADB_ALLOW_INSERT: false
export MARIADB_ALLOW_UPDATE: false
export MARIADB_ALLOW_DELETE: false
export MARIADB_TIMEOUT_MS=10000
export MARIADB_ROW_LIMIT=1000


# Run the tools test script
npm run test:tools
```

### 3. Run All Tests
To run both setup and tool tests:

```bash
# Set your MariaDB / MySQL credentials as environment variables
export MARIADB_HOST=localhost
export MARIADB_PORT=3306
export MARIADB_USER=your_username
export MARIADB_PASSWORD=your_password
export MARIADB_ALLOW_INSERT: false
export MARIADB_ALLOW_UPDATE: false
export MARIADB_ALLOW_DELETE: false
export MARIADB_TIMEOUT_MS=10000
export MARIADB_ROW_LIMIT=1000

# Run all tests
npm test
```

## Troubleshooting
If you encounter issues:

1. Check the server logs for error messages
2. Verify your MariaDB/MySQL credentials and connection details
3. Ensure your MariaDB/MySQL user has appropriate permissions
4. Check that your query is read-only and properly formatted


**Inspiration**
**https://github.com/dpflucas/mysql-mcp-server**

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
