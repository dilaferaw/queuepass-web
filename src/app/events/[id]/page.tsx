import type { Metadata } from "next";
import { Suspense } from "react";
import { EventDetailClient } from "@/components/event-detail-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getEvent } from "@/lib/events";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  return { title: event ? event.name : "Event View" };
}

/**
 * Route shell — does NOT await `params` at the top level so Next 16 Cache
 * Components prerenders the static shell and streams the dynamic segment
 * inside `<Suspense>`.
 */
export default function EventDetailPage({ params }: Params) {
  return (
    <Suspense fallback={<EventDetailSkeleton />}>
      <EventDetailResolver params={params} />
    </Suspense>
  );
}

async function EventDetailResolver({ params }: Params) {
  const { id } = await params;
  const initialEvent = await getEvent(id);
  return <EventDetailClient eventId={id} initialEvent={initialEvent} />;
}

function EventDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-52 w-full rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}
