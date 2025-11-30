'use client';

import '@/components/ui/shadcn-big-calendar.css';

import { Calendar, dateFnsLocalizer, type CalendarProps } from 'react-big-calendar';
import { getDay, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import format from 'date-fns/format';
import startOfWeek from 'date-fns/startOfWeek';

const locales = { fr };

export const shadcnCalendarLocalizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
    getDay,
    locales,
});

export function ShadcnBigCalendar<TEvent extends object, TResource extends object | undefined = object>(
    props: CalendarProps<TEvent, TResource>
) {
    return (
        <Calendar
            culture="fr"
            localizer={shadcnCalendarLocalizer}
            {...props}
        />
    );
}
