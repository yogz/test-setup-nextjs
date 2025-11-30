import { WeeklyAvailability, BlockedSlot, TrainingSession } from '@/lib/db/schema';

export interface AvailableSlot {
    coachId: string;
    coachName: string | null;
    startTime: Date;
    endTime: Date;
    type: 'ONE_TO_ONE' | 'GROUP';
    isAvailable: boolean; // false if already booked/blocked
    existingSessionId?: string; // if a session already exists
}

interface GenerateAvailableSlotsParams {
    coaches: Array<{
        id: string;
        name: string | null;
        weeklyAvailability: Array<{
            dayOfWeek: number;
            startTime: string; // "HH:MM"
            endTime: string; // "HH:MM"
            isIndividual: boolean;
            isGroup: boolean;
        }>;
        blockedSlots: Array<{
            startTime: Date;
            endTime: Date;
        }>;
    }>;
    existingSessions: Array<{
        id: string;
        coachId: string;
        startTime: Date;
        endTime: Date;
        type: 'ONE_TO_ONE' | 'GROUP';
    }>;
    startDate: Date;
    endDate: Date;
}

/**
 * Génère les créneaux disponibles pour réservation basés sur la semaine type des coaches
 * Ne retourne que les créneaux ONE_TO_ONE qui n'ont pas encore de session créée
 */
export function generateAvailableSlots({
    coaches,
    existingSessions,
    startDate,
    endDate,
}: GenerateAvailableSlotsParams): AvailableSlot[] {
    const slots: AvailableSlot[] = [];

    // Pour chaque coach
    for (const coach of coaches) {
        // Pour chaque jour de la période
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();

            // Trouver les disponibilités de ce coach pour ce jour
            const dayAvailabilities = coach.weeklyAvailability.filter(
                a => a.dayOfWeek === dayOfWeek && a.isIndividual
            );

            // Pour chaque créneau de disponibilité
            for (const availability of dayAvailabilities) {
                const [startHour, startMinute] = availability.startTime.split(':').map(Number);
                const [endHour, endMinute] = availability.endTime.split(':').map(Number);

                const slotStart = new Date(currentDate);
                slotStart.setHours(startHour, startMinute, 0, 0);

                const slotEnd = new Date(currentDate);
                slotEnd.setHours(endHour, endMinute, 0, 0);

                // Générer des créneaux d'1h (ou de la durée du slot si < 1h)
                const duration = 60; // 60 minutes par défaut
                let currentSlotStart = new Date(slotStart);

                while (currentSlotStart < slotEnd) {
                    const currentSlotEnd = new Date(currentSlotStart);
                    currentSlotEnd.setMinutes(currentSlotEnd.getMinutes() + duration);

                    // Ne pas dépasser la fin de la disponibilité
                    if (currentSlotEnd > slotEnd) {
                        currentSlotEnd.setTime(slotEnd.getTime());
                    }

                    // Vérifier si ce créneau est bloqué
                    const isBlocked = coach.blockedSlots.some(block =>
                        block.startTime <= currentSlotStart && block.endTime > currentSlotStart
                    );

                    // Vérifier si une session existe déjà pour ce créneau
                    const existingSession = existingSessions.find(
                        session =>
                            session.coachId === coach.id &&
                            session.startTime.getTime() === currentSlotStart.getTime()
                    );

                    // Ajouter le créneau seulement s'il n'est pas dans le passé
                    if (currentSlotStart > new Date() && !isBlocked && !existingSession) {
                        slots.push({
                            coachId: coach.id,
                            coachName: coach.name,
                            startTime: new Date(currentSlotStart),
                            endTime: new Date(currentSlotEnd),
                            type: 'ONE_TO_ONE',
                            isAvailable: true,
                        });
                    }

                    // Passer au créneau suivant
                    currentSlotStart = new Date(currentSlotEnd);
                }
            }

            // Jour suivant
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    return slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}
