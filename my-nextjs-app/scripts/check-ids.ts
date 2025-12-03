import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

async function checkUserIds() {
    const allUsers = await db.select().from(users);
    console.log('Users:', JSON.stringify(allUsers, null, 2));
}

checkUserIds()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
