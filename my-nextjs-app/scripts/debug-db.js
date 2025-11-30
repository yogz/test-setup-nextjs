require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const sql = postgres(process.env.DATABASE_URL);

async function main() {
    console.log('Inserting coach...');
    const email = 'coach@example.com';
    const password = 'password';
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();

    try {
        // Check if exists
        const existing = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (existing.length > 0) {
            console.log('User already exists, updating role...');
            await sql`UPDATE users SET role = 'coach', email_verified = true WHERE email = ${email}`;
        } else {
            await sql`
          INSERT INTO users (id, email, email_verified, role, name, created_at, updated_at)
          VALUES (${userId}, ${email}, true, 'coach', 'Coach User', NOW(), NOW())
        `;

            await sql`
          INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
          VALUES (${accountId}, ${userId}, ${email}, 'credential', ${hashedPassword}, NOW(), NOW())
        `;
            console.log('User created.');
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

main();
