import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function MemberBookLoading() {
    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div>
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-96 mt-2" />
            </div>

            {/* Coach Selection */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full max-w-xs" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </CardContent>
            </Card>

            {/* Week Navigation */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-9 w-40" />
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <Card key={i}>
                        <CardHeader className="p-3 pb-2">
                            <div className="text-center">
                                <Skeleton className="h-4 w-16 mx-auto" />
                                <Skeleton className="h-6 w-8 mx-auto mt-1" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-1">
                            {[1, 2, 3, 4].map((j) => (
                                <Skeleton key={j} className="h-8 w-full" />
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
            </div>
        </div>
    );
}
