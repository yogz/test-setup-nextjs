import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function CoachSessionsLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
                {/* Header */}
                <div className="space-y-1.5">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-5 w-80" />
                </div>

                {/* Tabs */}
                <Skeleton className="h-10 w-full max-w-md" />

                {/* Calendar content */}
                <div className="space-y-6">
                    {[1, 2, 3].map((dayIndex) => (
                        <div key={dayIndex} className="space-y-3">
                            {/* Day header */}
                            <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-slate-200" />
                                <Skeleton className="h-6 w-40" />
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>

                            {/* Slots grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {[1, 2, 3, 4, 5, 6].map((slotIndex) => (
                                    <Card key={slotIndex} className="overflow-hidden">
                                        <Skeleton className="h-8 w-full" />
                                        <div className="p-2 space-y-2">
                                            <Skeleton className="h-4 w-20 mx-auto" />
                                            <Skeleton className="h-4 w-16 mx-auto" />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
