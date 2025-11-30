'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Users, ArrowLeft } from 'lucide-react';
import { EditLocationModal } from '@/components/owner/edit-location-modal';
import { EditRoomModal } from '@/components/owner/edit-room-modal';
import { getLocationsAction, getRoomsAction } from '@/app/actions/owner-actions';

export default function OwnerAdminPage() {
    const [locations, setLocations] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [locs, rms] = await Promise.all([
            getLocationsAction(),
            getRoomsAction(),
        ]);
        setLocations(locs);
        setRooms(rms);
    };

    const handleLocationClick = (location: any) => {
        setSelectedLocation(location);
        setIsLocationModalOpen(true);
    };

    const handleRoomClick = (room: any) => {
        setSelectedRoom(room);
        setIsRoomModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsLocationModalOpen(false);
        setIsRoomModalOpen(false);
        loadData(); // Refresh data after edit
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Gérez vos localisations et salles
                    </p>
                </div>
            </div>

            {/* Locations Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Localisations
                            </CardTitle>
                            <CardDescription>
                                {locations.length} localisation{locations.length > 1 ? 's' : ''} enregistrée{locations.length > 1 ? 's' : ''}. Cliquez pour modifier.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {locations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Aucune localisation. Créez-en une depuis le dashboard.
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {locations.map((location) => (
                                <Card
                                    key={location.id}
                                    className="border-2 cursor-pointer hover:border-blue-400 transition-colors"
                                    onClick={() => handleLocationClick(location)}
                                >
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">{location.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1 text-sm">
                                        {location.address && (
                                            <p className="text-muted-foreground">{location.address}</p>
                                        )}
                                        {location.city && (
                                            <p className="text-muted-foreground">
                                                {location.city}{location.country ? `, ${location.country}` : ''}
                                            </p>
                                        )}
                                        <div className="pt-2">
                                            <Badge variant="secondary">
                                                {rooms.filter(r => r.locationId === location.id).length} salle{rooms.filter(r => r.locationId === location.id).length > 1 ? 's' : ''}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rooms Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Salles
                            </CardTitle>
                            <CardDescription>
                                {rooms.length} salle{rooms.length > 1 ? 's' : ''} enregistrée{rooms.length > 1 ? 's' : ''}. Cliquez pour modifier.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {rooms.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Aucune salle. Créez-en une depuis le dashboard.
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {rooms.map((room) => (
                                <Card
                                    key={room.id}
                                    className="border-2 cursor-pointer hover:border-blue-400 transition-colors"
                                    onClick={() => handleRoomClick(room)}
                                >
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">{room.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {locations.find(l => l.id === room.locationId)?.name || 'Localisation inconnue'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span>Capacité: {room.capacity} personnes</span>
                                        </div>
                                        <div className="pt-2">
                                            <Badge variant={room.isActive ? 'default' : 'secondary'}>
                                                {room.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modals */}
            <EditLocationModal
                isOpen={isLocationModalOpen}
                onClose={handleCloseModals}
                location={selectedLocation}
            />
            <EditRoomModal
                isOpen={isRoomModalOpen}
                onClose={handleCloseModals}
                room={selectedRoom}
                locations={locations}
            />
        </div>
    );
}
