import 'dotenv/config';
import { db } from '../lib/db/index';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('Listing all users...');
    try {
        const allUsers = await db.query.users.findMany();
        console.log('Users found:', allUsers.length);
        allUsers.forEach(u => console.log(`- ${u.email} (${u.role}, verified: ${u.emailVerified})`));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
