'use client';

import { useState, useEffect } from 'react';
import { updateDefaultCoachAction, getMemberSettingsAction } from '@/app/actions/member-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Save } from 'lucide-react';

interface Coach {
    id: string;
    name: string | null;
}

export default function SettingsPage() {
    return (
        <div className="container max-w-4xl py-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">
                    Gérez vos préférences de compte.
                </p>
            </div>

            <DefaultCoachSection />
        </div>
    );
}

function DefaultCoachSection() {
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [defaultCoachId, setDefaultCoachId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await getMemberSettingsAction();
                if (result.success && result.coaches) {
                    setCoaches(result.coaches);
                    if (result.defaultCoachId) {
                        setDefaultCoachId(result.defaultCoachId);
                    }
                } else {
                    toast.error('Erreur lors du chargement des préférences');
                }
            } catch (error) {
                console.error(error);
                toast.error('Erreur de connexion');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleSave = async () => {
        if (!defaultCoachId) return;

        setSaving(true);
        try {
            const result = await updateDefaultCoachAction({ coachId: defaultCoachId });
            if (result.success) {
                toast.success('Préférence enregistrée');
            } else {
                toast.error(result.error || 'Erreur lors de la sauvegarde');
            }
        } catch (error) {
            toast.error('Erreur inattendue');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Chargement des paramètres...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Coach par défaut
                </CardTitle>
                <CardDescription>
                    Sélectionnez votre coach préféré. Il sera présélectionné lors de vos réservations.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <Select value={defaultCoachId} onValueChange={setDefaultCoachId}>
                        <SelectTrigger className="w-full sm:w-[300px]">
                            <SelectValue placeholder="Choisir un coach" />
                        </SelectTrigger>
                        <SelectContent>
                            {coaches.map((coach) => (
                                <SelectItem key={coach.id} value={coach.id}>
                                    {coach.name || 'Coach sans nom'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={handleSave} disabled={saving || !defaultCoachId}>
                        {saving ? (
                            <span className="animate-spin mr-2">⏳</span>
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Enregistrer
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
