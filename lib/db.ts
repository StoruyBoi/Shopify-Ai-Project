// lib/db.ts
import mysql, { PoolOptions } from 'mysql2/promise';

// Define a type for query parameters
type QueryParam = string | number | boolean | null | Date | Buffer;

// Singleton connection pool
let pool: mysql.Pool | null = null;

// Get or create connection pool
function getPool() {
  if (!pool) {
    console.log('Creating new database connection pool');
    
    const poolConfig: PoolOptions = {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      enableKeepAlive: true,
      connectTimeout: 60000
    };
    
    // Only add SSL in production
    if (process.env.NODE_ENV === 'production') {
      poolConfig.ssl = {};
    }
    
    pool = mysql.createPool(poolConfig);
    
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

// Execute query with detailed error tracking - fixed Promise.race typing issues
export async function executeQuery<T>({ query, values }: { query: string; values?: QueryParam[] }): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  
  try {
    console.log(`Executing query: ${query}`);
    const connPool = getPool();
    
    // Create a promise that handles both query execution and timeout
    const queryPromiseWithTimeout = new Promise<T>((resolve, reject) => {
      // Set timeout to reject if query takes too long
      timeoutId = setTimeout(() => {
        reject(new Error('Database query timeout'));
      }, 15000);
      
      // Execute the query
      connPool.execute(query, values)
        .then(([rows]) => {
          clearTimeout(timeoutId);
          resolve(rows as unknown as T);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });
    
    return await queryPromiseWithTimeout;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error('Database error:', error);
    
    // Add more context to the error
    const enhancedError = new Error(
      `Database query failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw enhancedError;
  }
}
