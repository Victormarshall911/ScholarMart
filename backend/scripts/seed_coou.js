require('dotenv').config();
const db = require('../config/db');

async function seedData() {
    try {
        console.log('Seeding COOU and Campuses...');
        
        // Ensure tables exist just in case they were empty
        await db.query(`
            CREATE TABLE IF NOT EXISTS universities (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(150) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS campuses (
                id SERIAL PRIMARY KEY,
                university_code VARCHAR(50) NOT NULL,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert University
        await db.query(`
            INSERT INTO universities (code, name) 
            VALUES ('COOU', 'Chukwuemeka Odumegwu Ojukwu University')
            ON CONFLICT (code) DO NOTHING;
        `);
        
        console.log('University COOU seeded successfully.');

        // Insert Campuses
        const campuses = ['Uli', 'Igbariam', 'Awka'];
        for (const campus of campuses) {
            // Check if exists first to avoid duplicates if no unique constraint
            const check = await db.query('SELECT id FROM campuses WHERE name = $1 AND university_code = $2', [campus, 'COOU']);
            if (check.rowCount === 0) {
                await db.query(
                    'INSERT INTO campuses (university_code, name) VALUES ($1, $2)',
                    ['COOU', campus]
                );
                console.log(`Campus ${campus} seeded successfully.`);
            } else {
                console.log(`Campus ${campus} already exists.`);
            }
        }

        console.log('Seeding completed successfully!');
    } catch (err) {
        console.error('Error during seeding:', err);
    } finally {
        process.exit();
    }
}

// Wait a tiny bit for DB pool to initialize
setTimeout(seedData, 1000);
