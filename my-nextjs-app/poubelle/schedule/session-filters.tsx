'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SessionFiltersProps {
    coaches: { id: string; name: string | null }[];
    onFiltersChange: (filters: {
        coachId?: string;
        type?: string;
        date?: string;
    }) => void;
}

export function SessionFilters({ coaches, onFiltersChange }: SessionFiltersProps) {
    const [coachId, setCoachId] = useState<string>('all');
    const [type, setType] = useState<string>('all');
    const [date, setDate] = useState<string>('');

    const handleApplyFilters = () => {
        onFiltersChange({
            coachId: coachId !== 'all' ? coachId : undefined,
            type: type !== 'all' ? type : undefined,
            date: date || undefined,
        });
    };

    const handleClearFilters = () => {
        setCoachId('all');
        setType('all');
        setDate('');
        onFiltersChange({});
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Filtres</CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Effacer
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Coach</Label>
                        <Select value={coachId} onValueChange={setCoachId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les coachs" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les coachs</SelectItem>
                                {coaches.map(coach => (
                                    <SelectItem key={coach.id} value={coach.id}>
                                        {coach.name || 'Coach'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Type de session</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les types</SelectItem>
                                <SelectItem value="ONE_TO_ONE">Individuel</SelectItem>
                                <SelectItem value="GROUP">Collectif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>

                <Button onClick={handleApplyFilters} className="w-full">
                    Appliquer les filtres
                </Button>
            </CardContent>
        </Card>
    );
}
