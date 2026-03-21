import { useEffect, useState } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  MessageSquare,
  User,
  Mail,
  Calendar,
  DollarSign,
  Palette,
  Gift,
  ShoppingCart,
  MapPin,
  Phone,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Customization {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  title: string;
  description: string;
  type: string;
  occasion: string | null;
  preferred_colors: string | null;
  budget: number | null;
  delivery_date: string | null;
  special_requirements: string | null;
  status: string;
  admin_notes: string | null;
  quoted_price: number | null;
  created_at: string;
  updated_at: string;
}

const CustomizationsManagement = () => {
  const [customizations, setCustomizations] = useState<Customization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [selectedCustomization, setSelectedCustomization] = useState<Customization | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [responseData, setResponseData] = useState({
    status: 'pending',
    admin_notes: '',
    quoted_price: '',
  });

  const [orderFormData, setOrderFormData] = useState({
    shipping_address: '',
    phone: '',
    latitude: '',
    longitude: '',
    notes: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomizations();
    }, searchTerm ? 400 : 0);

    return () => clearTimeout(timer);
  }, [page, searchTerm, statusFilter]);

  const loadCustomizations = async () => {
    try {
      setLoading(true);
      const response = await api.getAllCustomizations({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (response.success && response.data) {
        let items = response.data.customizations || [];

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          items = items.filter(
            (item: Customization) =>
              item.title.toLowerCase().includes(term) ||
              item.user_name.toLowerCase().includes(term) ||
              item.user_email.toLowerCase().includes(term) ||
              (item.description && item.description.toLowerCase().includes(term))
          );
        }

        setCustomizations(items);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        }
      }
    } catch (error: any) {
      console.error('Error loading customizations:', error);
      toast.error('Failed to load customizations');
    } finally {
      setLoading(false);
    }
  };

  const openResponseDialog = (customization: Customization) => {
    setSelectedCustomization(customization);
    setResponseData({
      status: customization.status,
      admin_notes: customization.admin_notes || '',
      quoted_price: customization.quoted_price
        ? customization.quoted_price.toString()
        : '',
    });
    setIsDialogOpen(true);
  };

  const handleQuickAction = async (
    customization: Customization,
    newStatus: 'accepted' | 'rejected'
  ) => {
    try {
      await api.updateCustomizationStatus(customization.id, {
        status: newStatus,
        admin_notes: customization.admin_notes || '',
        quoted_price: customization.quoted_price || undefined,
      });
      toast.success(`Customization ${newStatus} successfully`);
      loadCustomizations();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedCustomization) return;

    setIsSubmitting(true);
    try {
      await api.updateCustomizationStatus(selectedCustomization.id, {
        status: responseData.status as any,
        admin_notes: responseData.admin_notes || undefined,
        quoted_price: responseData.quoted_price
          ? parseFloat(responseData.quoted_price)
          : undefined,
      });
      toast.success('Response updated successfully');
      setIsDialogOpen(false);
      loadCustomizations();
    } catch (error: any) {
      console.error('Error updating response:', error);
      toast.error(error.message || 'Failed to update response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateOrderDialog = (customization: Customization) => {
    if (customization.status !== 'accepted' || !customization.quoted_price) {
      toast.error('Only accepted customizations with quoted price can be converted to orders');
      return;
    }
    setSelectedCustomization(customization);
    setOrderFormData({
      shipping_address: '',
      phone: '',
      latitude: '',
      longitude: '',
      notes: '',
    });
    setIsCreateOrderDialogOpen(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedCustomization) return;

    if (!orderFormData.shipping_address.trim() || !orderFormData.phone.trim()) {
      toast.error('Shipping address and phone are required');
      return;
    }

    setIsCreatingOrder(true);
    try {
      await api.createOrderFromCustomization(selectedCustomization.id, {
        shipping_address: orderFormData.shipping_address.trim(),
        phone: orderFormData.phone.trim(),
        latitude: orderFormData.latitude ? parseFloat(orderFormData.latitude) : undefined,
        longitude: orderFormData.longitude ? parseFloat(orderFormData.longitude) : undefined,
        notes: orderFormData.notes.trim() || undefined,
      });
      toast.success('Order created successfully');
      setIsCreateOrderDialogOpen(false);
      loadCustomizations();
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      reviewing: { bg: 'bg-blue-100', text: 'text-blue-800' },
      quoted: { bg: 'bg-purple-100', text: 'text-purple-800' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Customization Requests
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage customer customization requests and provide responses
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, customer name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="quoted">Quoted</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Customizations List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading customizations...
        </div>
      ) : customizations.length === 0 ? (
        <Card className="rounded-2xl shadow-soft">
          <CardContent className="p-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-60" />
            <p className="text-muted-foreground">
              No customization requests found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {customizations.map((customization) => (
            <Card
              key={customization.id}
              className="rounded-2xl shadow-soft hover:shadow-card transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {customization.title}
                    </CardTitle>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{customization.user_name}</span>
                        <span className="mx-1">•</span>
                        <Mail className="h-3 w-3" />
                        <span>{customization.user_email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Gift className="h-3 w-3" />
                        <span className="capitalize">{customization.type}</span>
                        {customization.occasion && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{customization.occasion}</span>
                          </>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(customization.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {customization.description}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
                  {customization.preferred_colors && (
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Palette className="h-3 w-3" />
                        Preferred Colors
                      </div>
                      <p className="text-sm font-medium">
                        {customization.preferred_colors}
                      </p>
                    </div>
                  )}
                  {customization.budget && (
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <DollarSign className="h-3 w-3" />
                        Budget
                      </div>
                      <p className="text-sm font-medium">
                        NPR {parseFloat(customization.budget.toString()).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {customization.delivery_date && (
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        Delivery Date
                      </div>
                      <p className="text-sm font-medium">
                        {new Date(customization.delivery_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {customization.quoted_price && (
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <DollarSign className="h-3 w-3" />
                        Quoted Price
                      </div>
                      <p className="text-sm font-medium text-primary">
                        NPR {parseFloat(customization.quoted_price.toString()).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {customization.special_requirements && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">
                      Special Requirements
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {customization.special_requirements}
                    </p>
                  </div>
                )}

                {customization.admin_notes && (
                  <div className="pt-2 border-t border-border bg-secondary/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Admin Notes
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {customization.admin_notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openResponseDialog(customization)}
                    className="rounded-xl"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Respond
                  </Button>
                  {customization.status === 'accepted' && customization.quoted_price && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openCreateOrderDialog(customization)}
                      className="rounded-xl bg-primary text-primary-foreground"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Create Order
                    </Button>
                  )}
                  {customization.status !== 'accepted' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(customization, 'accepted')}
                      className="rounded-xl text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                  )}
                  {customization.status !== 'rejected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(customization, 'rejected')}
                      className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  )}
                  <div className="ml-auto text-xs text-muted-foreground">
                    {new Date(customization.created_at).toLocaleDateString()}
                  </div>
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
                  className="rounded-xl"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Customization Request</DialogTitle>
            <DialogDescription>
              Update status, add notes, and set quoted price for this
              customization request.
            </DialogDescription>
          </DialogHeader>

          {selectedCustomization && (
            <div className="space-y-4 py-4">
              {/* Request Details */}
              <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">{selectedCustomization.title}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCustomization.user_name} ({selectedCustomization.user_email})
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {selectedCustomization.description}
                </p>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={responseData.status}
                  onChange={(e) =>
                    setResponseData({ ...responseData, status: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="quoted">Quoted</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Quoted Price */}
              <div>
                <Label htmlFor="quoted_price">Quoted Price (NPR)</Label>
                <Input
                  id="quoted_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={responseData.quoted_price}
                  onChange={(e) =>
                    setResponseData({ ...responseData, quoted_price: e.target.value })
                  }
                  placeholder="e.g., 5000"
                />
              </div>

              {/* Admin Notes */}
              <div>
                <Label htmlFor="admin_notes">Response / Notes</Label>
                <Textarea
                  id="admin_notes"
                  value={responseData.admin_notes}
                  onChange={(e) =>
                    setResponseData({ ...responseData, admin_notes: e.target.value })
                  }
                  placeholder="Write your response or notes for the customer..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be visible to the customer
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              {isSubmitting ? 'Saving...' : 'Save Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Order Dialog */}
      <Dialog open={isCreateOrderDialogOpen} onOpenChange={setIsCreateOrderDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create Order from Customization</DialogTitle>
            <DialogDescription>
              Create an order for this accepted customization request.
            </DialogDescription>
          </DialogHeader>

          {selectedCustomization && (
            <div className="space-y-4 py-4">
              {/* Customization Details */}
              <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">{selectedCustomization.title}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCustomization.user_name} ({selectedCustomization.user_email})
                </p>
                {selectedCustomization.quoted_price && (
                  <p className="text-lg font-semibold text-primary">
                    Quoted Price: NPR {parseFloat(selectedCustomization.quoted_price.toString()).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Shipping Address */}
              <div>
                <Label htmlFor="shipping_address">Shipping Address *</Label>
                <Textarea
                  id="shipping_address"
                  value={orderFormData.shipping_address}
                  onChange={(e) =>
                    setOrderFormData({ ...orderFormData, shipping_address: e.target.value })
                  }
                  placeholder="Enter complete shipping address..."
                  rows={3}
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={orderFormData.phone}
                  onChange={(e) =>
                    setOrderFormData({ ...orderFormData, phone: e.target.value })
                  }
                  placeholder="e.g., +9779843062389"
                  required
                />
              </div>

              {/* Location Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude (optional)</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={orderFormData.latitude}
                    onChange={(e) =>
                      setOrderFormData({ ...orderFormData, latitude: e.target.value })
                    }
                    placeholder="e.g., 27.7172"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude (optional)</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={orderFormData.longitude}
                    onChange={(e) =>
                      setOrderFormData({ ...orderFormData, longitude: e.target.value })
                    }
                    placeholder="e.g., 85.3240"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={orderFormData.notes}
                  onChange={(e) =>
                    setOrderFormData({ ...orderFormData, notes: e.target.value })
                  }
                  placeholder="Any additional notes for this order..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOrderDialogOpen(false)}
              disabled={isCreatingOrder}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={isCreatingOrder}
              className="rounded-xl"
            >
              {isCreatingOrder ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomizationsManagement;

