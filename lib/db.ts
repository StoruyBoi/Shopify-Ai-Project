// lib/db.ts
import mysql from 'mysql2/promise';

// Define a type for query parameters
type QueryParam = string | number | boolean | null | Date | Buffer;

// Singleton connection pool
let pool: mysql.Pool | null = null;

// Get or create connection pool
function getPool() {
  if (!pool) {
    console.log('Creating new database connection pool');
    
    // More robust pool configuration
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      enableKeepAlive: true,
      // Add timeout settings
      connectTimeout: 60000,
      // Don't use SSL for local development
      ssl: process.env.NODE_ENV === 'production' ? {} : undefined
    });
    
    // Initialize database on first connection
    initializeDatabase().catch(err => {
      console.error('Failed to initialize database:', err);
    });
  }
  return pool;
}

// Initialize database tables
async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    
    // Create users table if it doesn't exist
    await connection.execute(`
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
    await connection.end();
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Execute query with detailed error tracking
export async function executeQuery<T>({ query, values }: { query: string; values?: QueryParam[] }): Promise<T> {
  try {
    console.log(`Executing query: ${query}`);
    const connPool = getPool();
    
    // Add timeout for query execution
    const [results] = await Promise.race([
      connPool.execute(query, values),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 15000)
      )
    ]) as [any, any];
    
    return results as T;
  } catch (error) {
    console.error('Database error:', error);
    // Add more context to the error
    const enhancedError = new Error(
      `Database query failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw enhancedError;
  }
}
