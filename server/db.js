require('dotenv').config();
const mysql = require('mysql2/promise');

// Create connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_student_assistant',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function verifyDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✓ Database connected successfully');
        connection.release();
        return true;
    } catch (err) {
        console.error('✗ Database connection failed.');
        console.error(err);

        if (err && err.code === 'ECONNREFUSED') {
            console.error('Hint: MySQL server is not reachable at the configured host/port.');
            console.error('Check if MySQL is running and verify DB_HOST/DB_PORT in your .env file.');
        } else if (err && err.code === 'ER_BAD_DB_ERROR') {
            console.error('Hint: Database does not exist. Create it using server/sql/schema.sql.');
        } else if (err && err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Hint: Invalid DB_USER/DB_PASSWORD credentials in .env.');
        }

        throw err;
    }
}

module.exports = { pool, verifyDatabaseConnection };
