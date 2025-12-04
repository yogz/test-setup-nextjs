'use client';

import { useEffect, useState } from 'react';
import { getAvailabilityConflictsAction, resolveConflictKeepSessionAction, cancelSessionAction } from '@/app/actions/coach-availability-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ConflictsPage() {
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchConflicts = async () => {
        setLoading(true);
        try {
            const data = await getAvailabilityConflictsAction();
            setConflicts(data);
        } catch (error) {
            toast.error('Erreur lors du chargement des conflits');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConflicts();
    }, []);

    const handleKeepSession = async (sessionId: string) => {
        try {
            await resolveConflictKeepSessionAction(sessionId);
            toast.success('Session maintenue (ajoutée aux exceptions)');
            fetchConflicts(); // Refresh list
        } catch (error) {
            toast.error('Erreur lors de la validation');
        }
    };

    const handleCancelSession = async (sessionId: string) => {
        try {
            await cancelSessionAction(sessionId);
            toast.success('Session annulée');
            fetchConflicts(); // Refresh list
        } catch (error) {
            toast.error("Erreur lors de l'annulation");
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Chargement des conflits...</div>;
    }

    return (
        <div className="container max-w-4xl py-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Conflits d'agenda</h1>
                <p className="text-muted-foreground">
                    Ces sessions sont programmées mais ne correspondent plus à vos disponibilités actuelles.
                </p>
            </div>

            {conflicts.length === 0 ? (
                <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Tout est en ordre</AlertTitle>
                    <AlertDescription className="text-green-700">
                        Aucun conflit détecté entre vos sessions et vos disponibilités.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid gap-4">
                    {conflicts.map((session) => (
                        <Card key={session.id} className="border-l-4 border-l-amber-500">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">
                                            {format(new Date(session.startTime), 'EEEE d MMMM yyyy', { locale: fr })}
                                        </CardTitle>
                                        <CardDescription>
                                            {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                                        </CardDescription>
                                    </div>
                                    <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Hors disponibilité
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm space-y-1">
                                    <p><span className="font-medium">Client:</span> {session.bookings?.[0]?.member?.name || 'Inconnu'}</p>
                                    <p><span className="font-medium">Type:</span> {session.type === 'ONE_TO_ONE' ? 'Individuel' : 'Groupe'}</p>
                                    {session.isRecurring && (
                                        <p className="text-blue-600 text-xs mt-2">
                                            ⚠️ Cette session fait partie d'une réservation récurrente.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-3 pt-2">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCancelSession(session.id)}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Annuler la session
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleKeepSession(session.id)}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Maintenir (Exception)
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
