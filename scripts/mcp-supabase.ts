#!/usr/bin/env tsx

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server(
  {
    name: "supabase",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "execute_query",
        description: "Execute a SQL query on Supabase database",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "SQL query to execute",
            },
            params: {
              type: "array",
              description: "Parameters for prepared statements",
              items: { type: "any" },
            },
          },
          required: ["query"],
        },
      },
      {
        name: "list_tables",
        description: "List all tables in the database",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_table_schema",
        description: "Get schema information for a specific table",
        inputSchema: {
          type: "object",
          properties: {
            table_name: {
              type: "string",
              description: "Name of the table",
            },
          },
          required: ["table_name"],
        },
      },
      {
        name: "insert_row",
        description: "Insert a row into a table",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "Table name",
            },
            data: {
              type: "object",
              description: "Data to insert",
            },
          },
          required: ["table", "data"],
        },
      },
      {
        name: "update_rows",
        description: "Update rows in a table",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "Table name",
            },
            data: {
              type: "object",
              description: "Data to update",
            },
            filter: {
              type: "object",
              description: "Filter conditions",
            },
          },
          required: ["table", "data"],
        },
      },
      {
        name: "delete_rows",
        description: "Delete rows from a table",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "Table name",
            },
            filter: {
              type: "object",
              description: "Filter conditions",
            },
          },
          required: ["table"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "execute_query": {
        const { query, params = [] } = args as {
          query: string;
          params?: JsonValue[];
        };

        // Use Supabase RPC for raw SQL execution
        const { data, error } = await supabase.rpc("exec_sql", {
          sql_query: query,
          parameters: params,
        });

        if (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Query failed: ${error.message}`,
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ data, success: true }, null, 2),
            },
          ],
        };
      }

      case "list_tables": {
        const { data, error } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public");

        if (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Failed to list tables: ${error.message}`,
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { tables: data?.map((t) => t.table_name) || [], success: true },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "get_table_schema": {
        const { table_name } = args as { table_name: string };

        const { data, error } = await supabase
          .from("information_schema.columns")
          .select("column_name, data_type, is_nullable, column_default")
          .eq("table_schema", "public")
          .eq("table_name", table_name);

        if (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Failed to get table schema: ${error.message}`,
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { schema: data || [], success: true },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "insert_row": {
        const { table, data } = args as {
          table: string;
          data: Record<string, JsonValue>;
        };

        const { data: result, error } = await supabase
          .from(table)
          .insert(data)
          .select();

        if (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Insert failed: ${error.message}`,
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ data: result, success: true }, null, 2),
            },
          ],
        };
      }

      case "update_rows": {
        const {
          table,
          data,
          filter = {},
        } = args as {
          table: string;
          data: Record<string, JsonValue>;
          filter?: Record<string, JsonValue>;
        };

        let query = supabase.from(table).update(data);

        // Apply filter conditions
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        const { data: result, error } = await query.select();

        if (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Update failed: ${error.message}`,
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ data: result, success: true }, null, 2),
            },
          ],
        };
      }

      case "delete_rows": {
        const { table, filter = {} } = args as {
          table: string;
          filter?: Record<string, JsonValue>;
        };

        let query = supabase.from(table).delete();

        // Apply filter conditions
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        const { data: result, error } = await query.select();

        if (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Delete failed: ${error.message}`,
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ data: result, success: true }, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Supabase MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
