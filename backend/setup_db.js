const mysql = require('mysql2/promise');

async function setupDatabase() {
    console.log("Connecting to XAMPP MySQL...");
    try {
        // Connect without a specific database to create it first
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '' // Default XAMPP password is empty
        });

        console.log("Connected successfully! Creating database and tables...");

        await connection.query('CREATE DATABASE IF NOT EXISTS tcs_nqt');
        await connection.query('USE tcs_nqt');

        // Create Users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                username VARCHAR(100),
                current_rank VARCHAR(20) DEFAULT 'Ninja',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Sessions table (stores the generated questions for history)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                session_id VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(50),
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                test_data JSON,
                is_completed BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Create Results table (stores AI grading critiques)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50),
                session_id VARCHAR(100),
                score INT,
                logic_efficiency VARCHAR(10),
                bugs_squashed INT,
                ai_push_alert TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);

        // Insert a dummy user so we can test the UI requests
        await connection.query(`
            INSERT IGNORE INTO users (id, username, current_rank) 
            VALUES ('user123', 'Test Candidate', 'Ninja')
        `);

        console.log("Database 'tcs_nqt' and tables successfully created!");
        process.exit(0);

    } catch (err) {
        console.error("Database Setup Failed:", err);
        process.exit(1);
    }
}

setupDatabase();
