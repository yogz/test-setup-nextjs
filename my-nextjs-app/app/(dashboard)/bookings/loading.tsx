import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function BookingsLoading() {
    return (
        <div className="container mx-auto py-8 space-y-8">
            <div>
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-96 mt-2" />
            </div>

            {/* Tabs skeleton */}
            <Skeleton className="h-10 w-full max-w-md" />

            {/* Booking cards skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-24 mt-1" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-9 w-full mt-4" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
