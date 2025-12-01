'use client';

import '@/components/ui/shadcn-big-calendar.css';

import { Calendar, dateFnsLocalizer, type CalendarProps } from 'react-big-calendar';
import { getDay, parse, format, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

const locales = { fr };

export const shadcnCalendarLocalizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
    getDay,
    locales,
});

export function ShadcnBigCalendar<TEvent extends object>(
    props: Omit<CalendarProps<TEvent, object>, 'localizer' | 'culture'>
) {
    return (
        <Calendar
            culture="fr"
            localizer={shadcnCalendarLocalizer}
            {...props}
        />
    );
}
