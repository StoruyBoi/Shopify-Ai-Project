// lib/db.ts
import serverlessMysql from 'serverless-mysql';

// Define a type for query parameters
type QueryParam = string | number | boolean | null | Date | Buffer;

// Create a singleton connection
let mysql: ReturnType<typeof serverlessMysql> | null = null;

// Get or create the serverless MySQL connection
function getConnection() {
  if (!mysql) {
    console.log('Creating new serverless MySQL connection');
    
    mysql = serverlessMysql({
      config: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        connectTimeout: 10000, // 10 second timeout
      },
      // Serverless connection management settings
      backoff: 'decorrelated',
      base: 5,
      cap: 200
    });
    
    // Initialize database on first connection
    initializeDatabase().catch(err => {
      console.error('Failed to initialize database:', err);
    });
  }
  
  return mysql;
}

// Initialize database tables
async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    const conn = getConnection();
    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        email VARCHAR(255),
        image VARCHAR(2000),
        credits_remaining INT DEFAULT 5,
        max_credits INT DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database initialized successfully');
    
    // End the connection back to the pool
    await conn.end();
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Execute query with proper connection handling for serverless
export async function executeQuery<T>({ query, values }: { query: string; values?: QueryParam[] }): Promise<T> {
  const conn = getConnection();
  
  try {
    console.log(`Executing query: ${query}`);
    
    // Run the query
    const results = await conn.query<T>(query, values);
    
    // Close the connection back to the pool
    await conn.end();
    
    return results;
  } catch (error) {
    console.error('Database error:', error);
    
    // Always ensure connection is released back to the pool
    await conn.end();
    
    // Enhanced error
    const enhancedError = new Error(
      `Database query failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw enhancedError;
  }
}
