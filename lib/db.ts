// lib/db.ts
import mysql from 'mysql2/promise';

// Define a type for query parameters to avoid using 'any'
type QueryParam = string | number | boolean | null | Date | Buffer;

// Singleton pool instance
let pool: mysql.Pool | null = null;

// Get or create pool
function getPool() {
  if (!pool) {
    console.log('Creating new database connection pool');
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 5, // Lower value for serverless environment
      queueLimit: 0,
      enableKeepAlive: true
    });
  }
  return pool;
}

export async function executeQuery<T>({ query, values }: { query: string; values?: QueryParam[] }): Promise<T> {
  try {
    console.log(`Executing query: ${query}`, values);
    const connPool = getPool();
    const [results] = await connPool.execute(query, values);
    console.log('Query successful, results:', JSON.stringify(results).substring(0, 200));
    return results as T;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}
