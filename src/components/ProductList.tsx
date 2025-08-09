import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getProductsPaginated,
  type PaginatedProducts,
  type Product,
} from "@/lib/products";

const PAGE_SIZE = 12;

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<PaginatedProducts["lastDoc"]>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getProductsPaginated(PAGE_SIZE, null);
    setProducts(res.items);
    setCursor(res.lastDoc);
    setHasMore(res.hasMore);
    setLoading(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const res = await getProductsPaginated(PAGE_SIZE, cursor);
    setProducts((prev) => [...prev, ...res.items]);
    setCursor(res.lastDoc);
    setHasMore(res.hasMore);
    setLoadingMore(false);
  }, [cursor, hasMore, loadingMore]);

  // Auto-load more when sentinel enters viewport (infinite scroll)
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadMore();
          }
        });
      },
      { rootMargin: "600px 0px 600px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold">Shop Products</h1>
            <p className="text-muted-foreground mt-1">Products will appear here as they are added.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted">
                    <img
                      src={p.images?.[0] || "/placeholder.svg"}
                      alt={`${p.name || "Product"} image`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  <CardContent className="p-4 space-y-1">
                    <h3 className="font-medium line-clamp-2">{p.name || "Unnamed product"}</h3>
                    {p.price != null && (
                      <p className="text-sm text-muted-foreground">${p.price}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Manual load more fallback */}
            {hasMore && (
              <div className="text-center mt-10">
                <Button onClick={loadMore} variant="outline" size="lg" disabled={loadingMore}>
                  {loadingMore ? "Loading..." : "Load More Products"}
                </Button>
              </div>
            )}

            {/* Sentinel for auto-loading */}
            <div ref={sentinelRef} className="h-1" aria-hidden="true" />
          </>
        )}
      </div>
    </section>
  );
};

export default ProductList;
