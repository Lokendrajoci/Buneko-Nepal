import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Filter } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string;
  image_url?: string | null;
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const navigate = useNavigate();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.getProducts({
        page,
        limit: 12,
        search: search || undefined,
      });

      if (response.success && response.data) {
        setProducts(response.data.products || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        }
      }
    } catch (error: any) {
      console.error('Error loading products:', error);
      toast.error(error.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = () => {
    setIsFiltering(true);
    setPage(1);
    loadProducts();
  };

  return (
    <Layout>
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <span className="text-primary font-medium text-sm uppercase tracking-wider">
                Our Collection
              </span>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2 mb-3">
                All Products
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Browse our full selection of handcrafted flowers, bouquets, and
                decor from Buneko Nepal.
              </p>
            </div>

            {/* Search / Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                type="button"
                className="rounded-xl"
                onClick={handleSearch}
                disabled={loading}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Products grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="bg-card rounded-3xl p-4 shadow-card">
                  <Skeleton className="w-full aspect-square rounded-2xl mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-60" />
              <p className="text-muted-foreground mb-2">
                {isFiltering
                  ? 'No products match your search.'
                  : 'No products available yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-card rounded-3xl overflow-hidden shadow-card card-hover flex flex-col cursor-pointer"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <div className="relative aspect-square overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h2 className="font-serif text-lg font-semibold text-foreground mb-1 line-clamp-2">
                      {product.name}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-primary font-semibold">
                        {(() => {
                          const numericPrice = Number(product.price);
                          return Number.isFinite(numericPrice)
                            ? `NPR ${numericPrice.toFixed(2)}`
                            : `NPR ${product.price}`;
                        })()}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/products/${product.id}`);
                        }}
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-10">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ProductsPage;


