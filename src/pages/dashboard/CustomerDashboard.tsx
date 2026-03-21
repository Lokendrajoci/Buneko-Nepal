import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Heart,
  User,
  LogOut,
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Save,
  Sparkles,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const sidebarLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Browse Products', href: '/dashboard/products', icon: ShoppingBag },
  { name: 'My Orders', href: '/dashboard/orders', icon: Package },
  { name: 'Wishlist', href: '/dashboard/wishlist', icon: Heart },
  { name: 'Customization', href: '/dashboard/customization', icon: Sparkles },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

// Dashboard Overview Component
const DashboardOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    wishlistItems: 0,
    recentOrders: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await api.getCustomerDashboardStats();
        if (response.success && response.data) {
          setStats({
            totalOrders: response.data.totalOrders || 0,
            activeOrders: response.data.activeOrders || 0,
            wishlistItems: response.data.wishlistItems || 0,
            recentOrders: response.data.recentOrders || [],
          });
        }
      } catch (error: any) {
        console.error('Error loading dashboard stats:', error);
        toast.error(error.message || 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Welcome Back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your orders and explore our handmade collection.
        </p>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-card rounded-2xl p-6 shadow-soft">
              <div className="animate-pulse space-y-3">
                <div className="h-12 w-12 rounded-xl bg-muted"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Orders', value: stats.totalOrders, icon: Package },
            { label: 'Wishlist Items', value: stats.wishlistItems, icon: Heart },
            { label: 'Active Orders', value: stats.activeOrders, icon: ShoppingBag },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-card rounded-2xl p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Recent Orders
          </h2>
          {stats.recentOrders.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/orders')}
              className="rounded-xl"
            >
              View All
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : stats.recentOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No orders yet. Start shopping!</p>
            <Link to="/products">
              <Button className="mt-4 rounded-xl">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => navigate('/dashboard/orders')}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      Order #{order.id}
                    </span>
                    {getStatusBadge(order.status)}
                    {order.payment_status === 'paid' && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {order.items}
                  </p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    NPR {order.total_amount.toFixed(2)}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Products Page (dynamic)
const ProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, wishlistRes] = await Promise.all([
        api.getProducts({ page: 1, limit: 12 }),
        api.getWishlist(),
      ]);
      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data.products || []);
      }
      if (wishlistRes.success && wishlistRes.data) {
        setWishlist((wishlistRes.data.items || []).map((i: any) => i.product_id));
      }
    } catch (error: any) {
      console.error('Error loading dashboard products:', error);
      toast.error(error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleWishlist = async (productId: number) => {
    try {
      if (wishlist.includes(productId)) {
        await api.removeFromWishlist(productId);
        setWishlist((prev) => prev.filter((id) => id !== productId));
        toast.success('Removed from wishlist');
      } else {
        await api.addToWishlist(productId);
        setWishlist((prev) => [...prev, productId]);
        toast.success('Added to wishlist');
      }
    } catch (error: any) {
      console.error('Wishlist update error:', error);
      toast.error(error.message || 'Failed to update wishlist');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-foreground">
        Browse Products
      </h1>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No products available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-card rounded-2xl p-4 shadow-soft flex flex-col"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-muted">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <h2 className="font-medium text-foreground line-clamp-2 mb-1">
                {product.name}
              </h2>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {product.description}
              </p>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-primary font-semibold text-sm">
                  {(() => {
                    const n = Number(product.price);
                    return Number.isFinite(n)
                      ? `NPR ${n.toFixed(2)}`
                      : `NPR ${product.price}`;
                  })()}
                </span>
                <Button
                  variant={wishlist.includes(product.id) ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => toggleWishlist(product.id)}
                >
                  <Heart className="h-3 w-3 mr-1" />
                  {wishlist.includes(product.id) ? 'Wishlisted' : 'Wishlist'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Orders Page (dynamic)
const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const res = await api.getUserOrders();
        if (res.success && res.data) {
          setOrders(res.data.orders || []);
        }
      } catch (error: any) {
        console.error('Error loading orders:', error);
        toast.error(error.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-foreground">
        My Orders
      </h1>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-card rounded-2xl p-4 shadow-soft"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Order #{order.id}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Total: NPR {Number(order.total_amount).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Wishlist Page (dynamic)
const WishlistPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const res = await api.getWishlist();
      if (res.success && res.data) {
        setItems(res.data.items || []);
      }
    } catch (error: any) {
      console.error('Error loading wishlist:', error);
      toast.error(error.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const remove = async (productId: number) => {
    try {
      await api.removeFromWishlist(productId);
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
      toast.success('Removed from wishlist');
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      toast.error(error.message || 'Failed to remove from wishlist');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-foreground">
        My Wishlist
      </h1>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading wishlist...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.product_id}
              className="bg-card rounded-2xl p-4 shadow-soft flex flex-col"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-muted">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <h2 className="font-medium text-foreground line-clamp-2 mb-1">
                {item.name}
              </h2>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {item.description}
              </p>
              <span className="text-primary font-semibold text-sm mb-3">
                {(() => {
                  const n = Number(item.price);
                  return Number.isFinite(n)
                    ? `NPR ${n.toFixed(2)}`
                    : `NPR ${item.price}`;
                })()}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="mt-auto rounded-full text-xs"
                onClick={() => remove(item.product_id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Profile Page
// Customization Page Component
const CustomizationPage = () => {
  const [customizations, setCustomizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'bouquet' as 'bouquet' | 'flower' | 'arrangement' | 'other',
    occasion: '',
    preferred_colors: '',
    budget: '',
    delivery_date: '',
    special_requirements: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedCustomization, setExpandedCustomization] = useState<number | null>(null);
  const [orderFormData, setOrderFormData] = useState({
    shipping_address: '',
    phone: '',
    latitude: null as number | null,
    longitude: null as number | null,
    notes: '',
  });
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);

  const loadCustomizations = async () => {
    try {
      setLoading(true);
      const response = await api.getUserCustomizations({ page, limit: 10 });
      if (response.success && response.data) {
        setCustomizations(response.data.customizations || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        }
      }
    } catch (error: any) {
      console.error('Error loading customizations:', error);
      toast.error(error.message || 'Failed to load customizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        delivery_date: formData.delivery_date || undefined,
      };

      const response = await api.createCustomization(payload);
      if (response.success) {
        toast.success('Customization request submitted successfully!');
        setShowForm(false);
        setFormData({
          title: '',
          description: '',
          type: 'bouquet',
          occasion: '',
          preferred_colors: '',
          budget: '',
          delivery_date: '',
          special_requirements: '',
        });
        loadCustomizations();
      }
    } catch (error: any) {
      console.error('Error creating customization:', error);
      toast.error(error.message || 'Failed to submit customization request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      quoted: 'bg-purple-100 text-purple-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status] || statusColors.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const markerIcon = new L.Icon({
    iconUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconRetinaUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
  });

  const LocationSelector = ({ onChange }: { onChange: (lat: number, lng: number) => void }) => {
    useMapEvents({
      click(e) {
        onChange(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const handleCompleteOrder = async (customizationId: number) => {
    if (!orderFormData.shipping_address.trim() || !orderFormData.phone.trim()) {
      toast.error('Please enter shipping address and phone number');
      return;
    }

    setIsCompletingOrder(true);
    try {
      await api.completeCustomizationOrder(customizationId, {
        shipping_address: orderFormData.shipping_address.trim(),
        phone: orderFormData.phone.trim(),
        latitude: orderFormData.latitude ?? undefined,
        longitude: orderFormData.longitude ?? undefined,
        notes: orderFormData.notes.trim() || undefined,
        payment_status: 'pending',
      });
      toast.success('Order created successfully!');
      setExpandedCustomization(null);
      setOrderFormData({
        shipping_address: '',
        phone: '',
        latitude: null,
        longitude: null,
        notes: '',
      });
      loadCustomizations();
    } catch (error: any) {
      console.error('Error completing order:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setIsCompletingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Customization Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Request custom flowers or bouquets tailored to your needs
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {showForm ? 'Cancel' : 'New Request'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>Create Customization Request</CardTitle>
            <CardDescription>
              Tell us about your custom flower or bouquet requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Custom Wedding Bouquet"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as any,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="bouquet">Bouquet</option>
                    <option value="flower">Flower Arrangement</option>
                    <option value="arrangement">Custom Arrangement</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe what you're looking for in detail..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="occasion">Occasion</Label>
                  <Input
                    id="occasion"
                    value={formData.occasion}
                    onChange={(e) =>
                      setFormData({ ...formData, occasion: e.target.value })
                    }
                    placeholder="e.g., Wedding, Birthday, Anniversary"
                  />
                </div>
                <div>
                  <Label htmlFor="preferred_colors">Preferred Colors</Label>
                  <Input
                    id="preferred_colors"
                    value={formData.preferred_colors}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferred_colors: e.target.value,
                      })
                    }
                    placeholder="e.g., Red, White, Pink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget (NPR)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    placeholder="e.g., 5000"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_date">Preferred Delivery Date</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) =>
                      setFormData({ ...formData, delivery_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="special_requirements">Special Requirements</Label>
                <Textarea
                  id="special_requirements"
                  value={formData.special_requirements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      special_requirements: e.target.value,
                    })
                  }
                  placeholder="Any additional requirements or notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Customizations List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="rounded-2xl shadow-soft">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : customizations.length === 0 ? (
        <Card className="rounded-2xl shadow-soft">
          <CardContent className="p-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-60" />
            <p className="text-muted-foreground">
              No customization requests yet. Create your first request!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {customizations.map((customization) => (
            <Card key={customization.id} className="rounded-2xl shadow-soft">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{customization.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {customization.type.charAt(0).toUpperCase() +
                        customization.type.slice(1)}
                      {customization.occasion && ` • ${customization.occasion}`}
                    </CardDescription>
                  </div>
                  {getStatusBadge(customization.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {customization.description}
                  </p>
                </div>

                {(customization.preferred_colors ||
                  customization.budget ||
                  customization.delivery_date ||
                  customization.special_requirements) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    {customization.preferred_colors && (
                      <div>
                        <p className="text-xs text-muted-foreground">Colors</p>
                        <p className="text-sm font-medium">
                          {customization.preferred_colors}
                        </p>
                      </div>
                    )}
                    {customization.budget && (
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="text-sm font-medium">
                          NPR {parseFloat(customization.budget).toFixed(2)}
                        </p>
                      </div>
                    )}
                    {customization.delivery_date && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Delivery Date
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(
                            customization.delivery_date
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {customization.quoted_price && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Quoted Price
                        </p>
                        <p className="text-sm font-medium text-primary">
                          NPR {parseFloat(customization.quoted_price).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {customization.special_requirements && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      Special Requirements
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {customization.special_requirements}
                    </p>
                  </div>
                )}

                {customization.admin_notes && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">
                      Admin Notes
                    </p>
                    <p className="text-sm text-foreground bg-secondary/50 p-3 rounded-lg whitespace-pre-wrap">
                      {customization.admin_notes}
                    </p>
                  </div>
                )}

                {/* Payment and Delivery Form for Accepted Customizations */}
                {customization.status === 'accepted' && customization.quoted_price && (
                  <div className="pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (expandedCustomization === customization.id) {
                          setExpandedCustomization(null);
                        } else {
                          setExpandedCustomization(customization.id);
                          setOrderFormData({
                            shipping_address: '',
                            phone: '',
                            latitude: null,
                            longitude: null,
                            notes: '',
                          });
                        }
                      }}
                      className="w-full rounded-xl"
                    >
                      {expandedCustomization === customization.id
                        ? 'Cancel'
                        : 'Complete Order & Payment'}
                    </Button>

                    {expandedCustomization === customization.id && (
                      <div className="mt-4 space-y-4 p-4 bg-secondary/30 rounded-lg">
                        <div>
                          <p className="text-sm font-semibold mb-2">Total Amount</p>
                          <p className="text-lg font-bold text-primary">
                            NPR {parseFloat(customization.quoted_price).toFixed(2)}
                          </p>
                        </div>

                        {/* Shipping Address */}
                        <div>
                          <Label htmlFor={`address-${customization.id}`}>
                            Shipping Address *
                          </Label>
                          <Textarea
                            id={`address-${customization.id}`}
                            value={orderFormData.shipping_address}
                            onChange={(e) =>
                              setOrderFormData({
                                ...orderFormData,
                                shipping_address: e.target.value,
                              })
                            }
                            placeholder="Enter complete shipping address..."
                            rows={3}
                            required
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <Label htmlFor={`phone-${customization.id}`}>Phone Number *</Label>
                          <Input
                            id={`phone-${customization.id}`}
                            value={orderFormData.phone}
                            onChange={(e) =>
                              setOrderFormData({ ...orderFormData, phone: e.target.value })
                            }
                            placeholder="e.g., +9779843062389"
                            required
                          />
                        </div>

                        {/* Map */}
                        <div>
                          <Label className="mb-2 block">Delivery Location (Optional)</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Tap on the map to set your delivery location
                          </p>
                          <div className="w-full h-64 rounded-xl overflow-hidden border border-border">
                            <MapContainer
                              center={[27.7172, 85.3240]}
                              zoom={13}
                              style={{ height: '100%', width: '100%' }}
                              scrollWheelZoom={false}
                            >
                              <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <LocationSelector
                                onChange={(lat, lng) => {
                                  setOrderFormData({
                                    ...orderFormData,
                                    latitude: lat,
                                    longitude: lng,
                                  });
                                }}
                              />
                              {orderFormData.latitude !== null &&
                                orderFormData.longitude !== null && (
                                  <Marker
                                    position={[orderFormData.latitude, orderFormData.longitude]}
                                    icon={markerIcon}
                                  />
                                )}
                            </MapContainer>
                          </div>
                          {orderFormData.latitude !== null &&
                            orderFormData.longitude !== null && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Selected: {orderFormData.latitude.toFixed(5)},{' '}
                                {orderFormData.longitude.toFixed(5)}
                              </p>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                          <Label htmlFor={`notes-${customization.id}`}>Additional Notes</Label>
                          <Textarea
                            id={`notes-${customization.id}`}
                            value={orderFormData.notes}
                            onChange={(e) =>
                              setOrderFormData({ ...orderFormData, notes: e.target.value })
                            }
                            placeholder="Any additional notes..."
                            rows={2}
                          />
                        </div>

                        {/* Submit Button */}
                        <Button
                          className="w-full rounded-xl"
                          disabled={isCompletingOrder}
                          onClick={() => handleCompleteOrder(customization.id)}
                        >
                          {isCompletingOrder
                            ? 'Processing...'
                            : 'Place Order (Cash on Delivery)'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Submitted on{' '}
                    {new Date(customization.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
      setImagePreview(user.profile_image_url || null);
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...profileData,
        ...(imageFile && { profile_image: imageFile }),
        ...(!imageFile && imagePreview && { profile_image_url: imagePreview }),
      };

      const response = await api.updateProfile(payload);
      if (response.success) {
        toast.success('Profile updated successfully');
        await refreshUser();
        setImageFile(null);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await api.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      if (response.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">
          My Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Update your personal information and password
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Manage your profile details and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Profile Image */}
              <div>
                <Label>Profile Picture</Label>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                      <label
                        htmlFor="profile-image-customer"
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                      >
                        <Camera className="h-4 w-4 text-primary-foreground" />
                        <input
                          id="profile-image-customer"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={isSubmitting}
                        />
                      </label>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Click the camera icon to upload a new profile picture
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG or GIF. Max size 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name-customer">Full Name</Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name-customer"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="pl-10 rounded-xl"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email-customer">Email Address</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-customer"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    placeholder="Enter your email"
                    className="pl-10 rounded-xl"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone-customer">Phone Number</Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone-customer"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    placeholder="Enter your phone number"
                    className="pl-10 rounded-xl"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address-customer">Address</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="address-customer"
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData({ ...profileData, address: e.target.value })
                    }
                    placeholder="Enter your address"
                    className="pl-10 rounded-xl min-h-[100px]"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* Current Password */}
              <div>
                <Label htmlFor="currentPassword-customer">Current Password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="currentPassword-customer"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Enter current password"
                    className="pl-10 pr-10 rounded-xl"
                    required
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <Label htmlFor="newPassword-customer">New Password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword-customer"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Enter new password"
                    className="pl-10 pr-10 rounded-xl"
                    required
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Must be at least 6 characters long
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword-customer">
                  Confirm New Password
                </Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword-customer"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                    className="pl-10 pr-10 rounded-xl"
                    required
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CustomerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.jpg" alt="Buneko Nepal" className="h-8 w-8 object-contain" />
              <span className="font-serif text-xl font-semibold text-foreground">
                Buneko Nepal
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive =
                location.pathname === link.href ||
                (link.href === '/dashboard' && location.pathname === '/dashboard/');
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-foreground"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-4 ml-auto">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.name || 'Customer'}
              </span>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {user?.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
              <Route index element={<DashboardOverview />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="customization" element={<CustomizationPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;
