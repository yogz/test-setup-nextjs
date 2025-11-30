import { db } from '@/lib/db';
import { bookings, trainingSessions } from '@/lib/db/schema';

async function clearSessions() {
    console.log('🗑️  Suppression de toutes les réservations...');
    await db.delete(bookings);
    console.log('✅ Réservations supprimées');

    console.log('🗑️  Suppression de toutes les sessions...');
    await db.delete(trainingSessions);
    console.log('✅ Sessions supprimées');

    console.log('✨ Base de données nettoyée !');
    process.exit(0);
}

clearSessions().catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
});
