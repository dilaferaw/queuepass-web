import { Suspense } from "react";
import { CatalogClient } from "@/components/catalog-client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * Route shell — deliberately does NOT await `searchParams`.
 * Preserves Next 16 Cache Components prerendering while streaming request-time
 * pagination parameters inside `<Suspense>`.
 */
export default function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<EventListSkeleton />}>
      <CatalogResolver searchParams={searchParams} />
    </Suspense>
  );
}

async function CatalogResolver({ searchParams }: { searchParams: SearchParams }) {
  const { page: pageParam } = await searchParams;
  const initialPage = Math.max(1, Number(pageParam) || 1);
  return <CatalogClient initialPage={initialPage} />;
}

function EventListSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-white/10">
            <CardHeader>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-28" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
