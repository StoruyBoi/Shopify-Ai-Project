// app/api/init-db/route.ts
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  let connection;
  try {
    // Create direct connection without accessing information_schema
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    console.log('Connected to MySQL database');
    
    // Attempt to create users table directly
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
    
    console.log('Users table created or verified');
    
    // Test data insertion
    await connection.execute(
      'INSERT INTO users (google_id, name, email, credits_remaining, max_credits) VALUES (?, ?, ?, ?, ?)',
      ['test-google-id', 'Test User', 'test@example.com', 5, 5]
    );
    
    console.log('Test user inserted successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
