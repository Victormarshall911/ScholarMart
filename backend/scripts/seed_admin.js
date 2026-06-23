require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seedAdmin() {
    try {
        console.log('Seeding Admin Account...');
        
        const adminEmail = 'admin@scholarmart.com';
        const check = await db.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
        
        if (check.rowCount === 0) {
            const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
            
            await db.query(
                `INSERT INTO users (
                    name, email, whatsapp_number, university, campus, password_hash, role, email_verified, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'active')`,
                ['Scholarmart Admin', adminEmail, '08000000000', 'COOU', 'Awka', passwordHash, 'admin']
            );
            
            console.log('Admin account created successfully!');
            console.log('Email: admin@scholarmart.com');
            console.log('Password: AdminPassword123!');
        } else {
            console.log('Admin account already exists.');
        }

        console.log('Finished.');
    } catch (err) {
        console.error('Error during admin seeding:', err);
    } finally {
        process.exit();
    }
}

setTimeout(seedAdmin, 1000);
