// lib/db.ts
import mysql from 'mysql2/promise';

// Define a type for query parameters to avoid using 'any'
type QueryParam = string | number | boolean | null | Date | Buffer;

// Database connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a connection pool for better performance
const pool = mysql.createPool(dbConfig);

export async function executeQuery<T>({ query, values }: { query: string; values?: QueryParam[] }): Promise<T> {
  try {
    // Get connection from pool
    const [results] = await pool.execute(query, values);
    return results as T;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}
