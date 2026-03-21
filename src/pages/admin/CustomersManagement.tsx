import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Customer {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  profile_image_url: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

const CustomersManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, searchTerm ? 500 : 0); // Debounce search, but load immediately when cleared

    return () => clearTimeout(timer);
  }, [page, searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers({
        page,
        limit,
        role: 'customer', // Only show customers
      });
      
      if (response.success && response.data) {
        let customersList = response.data.users || [];
        
        // Filter by search term if provided
        if (searchTerm) {
          customersList = customersList.filter((customer: Customer) =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        
        setCustomers(customersList);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        }
      }
    } catch (error: any) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    setIsToggling(true);
    setTogglingId(customer.id);
    try {
      await api.toggleUserStatus(customer.id, !customer.is_active);
      toast.success(`Customer ${!customer.is_active ? 'activated' : 'deactivated'} successfully`);
      loadCustomers();
    } catch (error: any) {
      console.error('Error toggling customer status:', error);
      toast.error(error.message || 'Failed to update customer status');
    } finally {
      setIsToggling(false);
      setTogglingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Manage Customers
          </h1>
          <p className="text-muted-foreground mt-1">
            View and monitor all registered customers. Mark customers as inactive to restrict access.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center shadow-soft">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-lg mb-4">No customers found</p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {customer.profile_image_url ? (
                              <img
                                src={customer.profile_image_url}
                                alt={customer.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserIcon className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.address ? (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-foreground line-clamp-2">
                              {customer.address}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {customer.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {formatDate(customer.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {formatDate(customer.last_login)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end">
                          <Button
                            variant={customer.is_active ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleToggleStatus(customer)}
                            disabled={isToggling && togglingId === customer.id}
                          >
                            {isToggling && togglingId === customer.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {customer.is_active ? 'Deactivating...' : 'Activating...'}
                              </>
                            ) : customer.is_active ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Mark Inactive
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark Active
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomersManagement;
