import { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileEdit,
  User,
  LogOut,
  Menu,
  Plus,
  TrendingUp,
  Folder,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import ProductsManagement from './ProductsManagement';
import CategoriesManagement from './CategoriesManagement';
import AdminProfile from './AdminProfile';
import CustomersManagement from './CustomersManagement';
import ContentManagement from './ContentManagement';
import CustomizationsManagement from './CustomizationsManagement';

const sidebarLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Categories', href: '/admin/categories', icon: Folder },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Customizations', href: '/admin/customizations', icon: Sparkles },
  { name: 'Content', href: '/admin/content', icon: FileEdit },
  { name: 'Profile', href: '/admin/profile', icon: User },
];

// Dashboard Overview
const AdminOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const res = await api.getDashboardStats();
        if (res.success && res.data) {
          setStats(res.data);
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

  const formatRevenue = (amount: number) => {
    if (amount >= 1000000) {
      return `NPR ${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `NPR ${(amount / 1000).toFixed(2)}K`;
    }
    return `NPR ${amount.toFixed(2)}`;
  };

  const formatAmount = (value: any) => {
    const n = Number(value);
    return Number.isFinite(n) ? `NPR ${n.toFixed(2)}` : `NPR ${value}`;
  };

  const formatDate = (value: string) =>
    value ? new Date(value).toLocaleDateString() : '';

  const statsCards = [
    {
      label: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: Package,
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers.toString(),
      icon: Users,
    },
    {
      label: 'Revenue',
      value: formatRevenue(stats.totalRevenue),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your store, products, and orders.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-6 shadow-soft">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl p-6 shadow-soft">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
            Recent Orders
          </h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : stats.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No orders yet.
            </p>
          ) : (
            <div className="space-y-4">
              {stats.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 rounded-lg px-2 transition-colors"
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  <div>
                    <p className="font-medium text-foreground">
                      Order #{order.id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.user_name} • {formatAmount(order.total_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      order.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-700'
                        : order.status === 'cancelled'
                        ? 'bg-destructive/10 text-destructive'
                        : order.status === 'processing'
                        ? 'bg-sky-100 text-sky-700'
                        : order.status === 'shipped'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/admin/products')}
            >
              <Plus className="h-5 w-5" />
              Add Product
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/admin/orders')}
            >
              <ShoppingCart className="h-5 w-5" />
              View Orders
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/admin/customers')}
            >
              <Users className="h-5 w-5" />
              Customers
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/admin/content')}
            >
              <FileEdit className="h-5 w-5" />
              Edit Content
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


// Orders Management (dynamic)
const OrdersManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({
        page: 1,
        limit: 50,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast.error(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleStatusChange = async (
    orderId: number,
    newStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  ) => {
    try {
      setUpdatingId(orderId);
      const res = await api.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        toast.success('Order status updated');
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatAmount = (value: any) => {
    const n = Number(value);
    return Number.isFinite(n) ? `NPR ${n.toFixed(2)}` : `NPR ${value}`;
  };

  const formatDate = (value: string) =>
    value ? new Date(value).toLocaleString() : '';

  const handleExport = () => {
    if (!orders || orders.length === 0) {
      toast.error('No orders to export');
      return;
    }
    try {
      setExporting(true);
      const header = [
        'Order ID',
        'Customer Name',
        'Customer Email',
        'Phone',
        'Total Amount',
        'Payment Status',
        'Order Status',
        'Created At',
        'Items',
      ];
      const rows = orders.map((order) => {
        const itemsSummary =
          order.items && order.items.length > 0
            ? order.items
                .map(
                  (item: any) =>
                    `${(item.product_name || `Product #${item.product_id}`)
                      .toString()
                      .replace(/"/g, '""')} x ${item.quantity}`
                )
                .join(' | ')
            : '';
        const values = [
          order.id,
          (order.user_name || '').toString().replace(/"/g, '""'),
          (order.user_email || '').toString().replace(/"/g, '""'),
          (order.phone || '').toString().replace(/"/g, '""'),
          order.total_amount,
          order.payment_status || 'pending',
          order.status,
          order.created_at,
          itemsSummary,
        ];
        return values
          .map((val) => `"${val !== undefined && val !== null ? val : ''}"`)
          .join(',');
      });
      const csvContent = [header.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'orders-report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Orders report downloaded');
    } catch (error) {
      console.error('Error exporting orders:', error);
      toast.error('Failed to export orders');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Manage Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all customer orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-border bg-background text-sm rounded-xl px-3 py-1.5"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={loading || exporting || orders.length === 0}
          >
            {exporting ? 'Exporting...' : 'Download Excel Report'}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-soft">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">
            Loading orders...
          </p>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No orders found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4">Order ID</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Payment</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Items</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0 align-top hover:bg-secondary/40 cursor-pointer"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <td className="py-3 pr-4 font-medium text-foreground">
                      #{order.id}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {order.user_name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.user_email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {order.phone}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {order.shipping_address}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span className="font-semibold text-foreground">
                        {formatAmount(order.total_amount)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : order.payment_status === 'failed'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {order.payment_status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : order.status === 'cancelled'
                            ? 'bg-destructive/10 text-destructive'
                            : order.status === 'processing'
                            ? 'bg-sky-100 text-sky-700'
                            : order.status === 'shipped'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">
                      {order.items && order.items.length > 0 ? (
                        <ul className="space-y-1 max-w-[220px]">
                          {order.items.map((item: any) => (
                            <li key={item.id} className="flex justify-between gap-2">
                              <span className="truncate">
                                {item.product_name || `Product #${item.product_id}`}
                              </span>
                              <span className="shrink-0">
                                × {item.quantity}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No items
                        </span>
                      )}
                    </td>
                    <td
                      className="py-3 pr-0 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as
                              | 'pending'
                              | 'processing'
                              | 'shipped'
                              | 'delivered'
                              | 'cancelled'
                          )
                        }
                        className="border border-border bg-background text-xs rounded-xl px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Marker icon for Leaflet
const orderMarkerIcon = new L.Icon({
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

// Single Order Details (with map & delivery info)
const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Store location (for distance calc) - using Kathmandu center as example
  const STORE_LAT = 27.7172;
  const STORE_LNG = 85.324;

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.getOrderById(Number(id));
        if (res.success && res.data) {
          setOrder(res.data.order);
        } else {
          toast.error(res.message || 'Order not found');
          navigate('/admin/orders', { replace: true });
        }
      } catch (error: any) {
        console.error('Error loading order:', error);
        toast.error(error.message || 'Failed to load order');
        navigate('/admin/orders', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [id, navigate]);

  const haversineDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const hasLocation =
    order?.latitude !== null &&
    order?.latitude !== undefined &&
    order?.longitude !== null &&
    order?.longitude !== undefined;

  // Convert latitude/longitude to numbers (they come as strings from DB)
  const latNum = hasLocation ? Number(order.latitude) : null;
  const lngNum = hasLocation ? Number(order.longitude) : null;

  const distanceKm =
    hasLocation && latNum !== null && lngNum !== null && !isNaN(latNum) && !isNaN(lngNum)
      ? haversineDistanceKm(STORE_LAT, STORE_LNG, latNum, lngNum)
      : null;

  // Simple delivery charge model for COD: base + per km
  const BASE_DELIVERY_FARE = 50; // NPR
  const PER_KM_FARE = 10; // NPR per km

  const deliveryCharge =
    order?.payment_status !== 'paid' && distanceKm !== null
      ? Math.round(BASE_DELIVERY_FARE + PER_KM_FARE * distanceKm)
      : 0;

  const paymentMethod =
    order?.payment_status === 'paid' ? 'Online Card (Stripe)' : 'Cash on Delivery (COD)';

  const openInGoogleMaps = () => {
    if (!hasLocation || latNum === null || lngNum === null || isNaN(latNum) || isNaN(lngNum)) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latNum},${lngNum}`;
    window.open(url, '_blank');
  };

  const formatAmount = (value: any) => {
    const n = Number(value);
    return Number.isFinite(n) ? `NPR ${n.toFixed(2)}` : `NPR ${value}`;
  };

  const formatDateTime = (value: string) =>
    value ? new Date(value).toLocaleString() : '';

  if (loading || !order) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Back to Orders
        </Button>
        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <p className="text-muted-foreground text-center py-8">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Order #{order.id}
          </h1>
          <p className="text-muted-foreground mt-1">
            Detailed view with customer info, payment, and delivery location.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/orders')}>
          Back to Orders
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: basic info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-2xl p-5 shadow-soft space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Placed on {formatDateTime(order.created_at)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last updated {formatDateTime(order.updated_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    order.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-700'
                      : order.status === 'cancelled'
                      ? 'bg-destructive/10 text-destructive'
                      : order.status === 'processing'
                      ? 'bg-sky-100 text-sky-700'
                      : order.status === 'shipped'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  Status: {order.status}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    order.payment_status === 'paid'
                      ? 'bg-emerald-100 text-emerald-700'
                      : order.payment_status === 'failed'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  Payment: {order.payment_status || 'pending'} ({paymentMethod})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h2 className="font-semibold text-foreground mb-2">
                  Customer
                </h2>
                <p className="text-sm font-medium">
                  {order.user_name || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.user_email}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.phone}
                </p>
              </div>
              <div>
                <h2 className="font-semibold text-foreground mb-2">
                  Shipping Address
                </h2>
                <p className="text-xs text-muted-foreground whitespace-pre-line">
                  {order.shipping_address}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-5 shadow-soft space-y-4">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Items
            </h2>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-2 text-sm">
                {order.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-border last:border-0 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {item.product_name || `Product #${item.product_id}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{formatAmount(item.subtotal)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No items found for this order.
              </p>
            )}
          </div>
        </div>

        {/* Right: totals & map */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl p-5 shadow-soft space-y-2 text-sm">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
              Payment Summary
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Order total</span>
              <span className="font-semibold text-foreground">
                {formatAmount(order.total_amount)}
              </span>
            </div>
            {order.payment_status !== 'paid' && distanceKm !== null && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Distance from store
                  </span>
                  <span className="font-medium text-foreground">
                    {distanceKm.toFixed(2)} km
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Estimated delivery charge
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatAmount(deliveryCharge)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border mt-1">
                  <span className="text-muted-foreground">Total COD amount</span>
                  <span className="font-semibold text-primary">
                    {formatAmount(
                      Number(order.total_amount) + (deliveryCharge || 0)
                    )}
                  </span>
                </div>
              </>
            )}
            {order.payment_status === 'paid' && (
              <p className="text-xs text-emerald-600 mt-2">
                Payment received via Stripe. No additional COD charge.
              </p>
            )}
          </div>

          <div className="bg-card rounded-2xl p-5 shadow-soft space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-xl font-semibold text-foreground">
                Delivery Location
              </h2>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasLocation}
                onClick={openInGoogleMaps}
              >
                Get Directions
              </Button>
            </div>
            {!hasLocation ? (
              <p className="text-xs text-muted-foreground">
                No location selected for this order.
              </p>
            ) : (
              <>
                <div className="w-full h-56 rounded-xl overflow-hidden border border-border">
                  {latNum !== null && lngNum !== null && !isNaN(latNum) && !isNaN(lngNum) ? (
                    <MapContainer
                      center={[latNum, lngNum]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[latNum, lngNum]} icon={orderMarkerIcon} />
                    </MapContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      Invalid coordinates
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Coordinates: {latNum !== null && !isNaN(latNum) ? latNum.toFixed(5) : 'N/A'},{' '}
                  {lngNum !== null && !isNaN(lngNum) ? lngNum.toFixed(5) : 'N/A'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const AdminDashboard = () => {
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
              <div>
                <span className="font-serif text-xl font-semibold text-foreground block">
                  Buneko Nepal
                </span>
                <span className="text-xs text-primary font-medium">Admin Panel</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive =
                location.pathname === link.href ||
                (link.href === '/admin' && location.pathname === '/admin/');
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
                {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}: {user?.name || 'Admin'}
              </span>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                {user?.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt={user.name || 'Admin'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-primary-foreground" />
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
              <Route index element={<AdminOverview />} />
              <Route path="categories" element={<CategoriesManagement />} />
              <Route path="products" element={<ProductsManagement />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="orders/:id" element={<OrderDetails />} />
              <Route path="customers" element={<CustomersManagement />} />
              <Route path="customizations" element={<CustomizationsManagement />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="profile" element={<AdminProfile />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
