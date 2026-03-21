const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || 'Request failed');
      }

      if (!response.ok) {
        // If unauthorized, handle it appropriately
        if (response.status === 401) {
          // For getCurrentUser endpoint, don't clear session here - let AuthContext handle it
          // For other endpoints, clear and redirect
          if (!endpoint.includes('/auth/me')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect if not already on login/signup page
            if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
              window.location.href = '/login';
            }
          }
        }
        // Handle 403 (Forbidden) - account deactivated
        if (response.status === 403) {
          const errorMessage = data.message || data.error || 'Your account has been deactivated. Please contact support for assistance.';
          const error = new Error(errorMessage);
          (error as any).status = 403;
          throw error;
        }
        // Provide more detailed error message
        const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error: any) {
      console.error('API request error:', error);
      // Re-throw with better error message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error.message || 'Network error. Please check your connection.');
    }
  }

  // Auth endpoints
  async register(name: string, email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string) {
    try {
      return await this.request<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (error: any) {
      // Handle 403 (Forbidden) specifically for inactive accounts
      if (error.status === 403 || error.message?.includes('deactivated')) {
        throw new Error(error.message || 'Your account has been deactivated. Please contact support for assistance.');
      }
      throw error;
    }
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    try {
      return await this.request<{ user: any }>('/auth/me', {
        method: 'GET',
      });
    } catch (error: any) {
      // Re-throw with more context for AuthContext to handle
      if (error.message && (
        error.message.includes('401') || 
        error.message.includes('Unauthorized') ||
        error.message.includes('Invalid token') ||
        error.message.includes('Token expired')
      )) {
        throw new Error('Authentication failed');
      }
      throw error;
    }
  }

  // Product endpoints
  async getProducts(params?: {
    page?: number;
    limit?: number;
    category_id?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return this.request<{ products: any[]; pagination: any }>(
      `/products${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async getProductById(id: number) {
    return this.request<{ product: any }>(`/products/${id}`, {
      method: 'GET',
    });
  }

  async createProduct(productData: {
    name: string;
    description: string;
    price: number;
    category_id: number;
    stock?: number;
    image?: File;
  }) {
    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('description', productData.description);
    formData.append('price', productData.price.toString());
    formData.append('category_id', productData.category_id.toString());
    if (productData.stock !== undefined) {
      formData.append('stock', productData.stock.toString());
    }
    if (productData.image) {
      formData.append('image', productData.image);
    }

    const token = this.getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle validation errors
      if (data.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map((err: any) => err.msg || err.message).join(', ');
        throw new Error(errorMessages || data.message || 'Validation failed');
      }
      throw new Error(data.message || 'Failed to create product');
    }

    return data;
  }

  async updateProduct(id: number, productData: {
    name: string;
    description: string;
    price: number;
    category_id: number;
    stock?: number;
    image?: File;
    image_url?: string;
  }) {
    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('description', productData.description);
    formData.append('price', productData.price.toString());
    formData.append('category_id', productData.category_id.toString());
    if (productData.stock !== undefined) {
      formData.append('stock', productData.stock.toString());
    }
    if (productData.image) {
      formData.append('image', productData.image);
    } else if (productData.image_url) {
      formData.append('image_url', productData.image_url);
    }

    const token = this.getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle validation errors
      if (data.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map((err: any) => err.msg || err.message).join(', ');
        throw new Error(errorMessages || data.message || 'Validation failed');
      }
      throw new Error(data.message || 'Failed to update product');
    }

    return data;
  }

  async deleteProduct(id: number) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Order endpoints
  async createOrder(orderData: {
    items: Array<{ product_id: number; quantity: number }>;
    shipping_address: string;
    phone: string;
    latitude?: number | null;
    longitude?: number | null;
    payment_status?: 'pending' | 'paid' | 'failed';
    notes?: string;
  }) {
    return this.request<{ order: any }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrderById(id: number) {
    return this.request<{ order: any }>(`/orders/${id}`, {
      method: 'GET',
    });
  }

  async getOrders(params?: { page?: number; limit?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request<{ orders: any[] }>(
      `/orders${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async updateOrderStatus(
    id: number,
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  ) {
    return this.request<{ order: any }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getUserOrders() {
    return this.request<{ orders: any[] }>('/orders/my-orders', {
      method: 'GET',
    });
  }

  // Wishlist endpoints
  async getWishlist() {
    return this.request<{ items: any[] }>('/wishlist', {
      method: 'GET',
    });
  }

  async addToWishlist(productId: number) {
    return this.request('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    });
  }

  async removeFromWishlist(productId: number) {
    return this.request(`/wishlist/${productId}`, {
      method: 'DELETE',
    });
  }

  async createCheckoutSession(payload: {
    items: Array<{ product_id: number; quantity: number }>;
    successUrl?: string;
    cancelUrl?: string;
  }) {
    return this.request<{ url: string; sessionId: string }>('/payments/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Category endpoints
  async getCategories() {
    return this.request<{ categories: any[] }>('/categories', {
      method: 'GET',
    });
  }

  async getCategoryById(id: number) {
    return this.request<{ category: any }>(`/categories/${id}`, {
      method: 'GET',
    });
  }

  async createCategory(categoryData: {
    name: string;
    description?: string;
    image_url?: string;
  }) {
    return this.request<{ category: any }>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id: number, categoryData: {
    name?: string;
    description?: string;
    image_url?: string;
  }) {
    return this.request<{ category: any }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id: number) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // User/Profile endpoints
  async updateProfile(profileData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    profile_image?: File;
    profile_image_url?: string;
  }) {
    const formData = new FormData();
    if (profileData.name) formData.append('name', profileData.name);
    if (profileData.email) formData.append('email', profileData.email);
    if (profileData.phone) formData.append('phone', profileData.phone);
    if (profileData.address) formData.append('address', profileData.address);
    if (profileData.profile_image) {
      formData.append('profile_image', profileData.profile_image);
    } else if (profileData.profile_image_url) {
      formData.append('profile_image_url', profileData.profile_image_url);
    }

    const token = this.getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map((err: any) => err.msg || err.message).join(', ');
        throw new Error(errorMessages || data.message || 'Validation failed');
      }
      throw new Error(data.message || 'Failed to update profile');
    }

    return data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/users/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Content (TikTok) endpoints
  async getContents(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<{ contents: any[]; pagination: any }>(
      `/contents${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async createContent(data: { title: string; url: string }) {
    return this.request<{ content: any }>(`/contents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContent(id: number, data: { title: string; url: string }) {
    return this.request<{ content: any }>(`/contents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContent(id: number) {
    return this.request(`/contents/${id}`, {
      method: 'DELETE',
    });
  }

  // Users/Customers endpoints
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);

    const query = queryParams.toString();
    return this.request<{ users: any[]; pagination: any }>(
      `/users${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async getUserById(id: number) {
    return this.request<{ user: any }>(`/users/${id}`, {
      method: 'GET',
    });
  }

  async updateUser(id: number, userData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    role?: string;
  }) {
    return this.request<{ user: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleUserStatus(id: number, isActive: boolean) {
    return this.request<{ user: any }>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request<{
      totalProducts: number;
      totalOrders: number;
      totalCustomers: number;
      totalRevenue: number;
      recentOrders: any[];
    }>('/dashboard/stats', {
      method: 'GET',
    });
  }

  // Customer dashboard endpoints
  async getCustomerDashboardStats() {
    return this.request<{
      totalOrders: number;
      activeOrders: number;
      wishlistItems: number;
      recentOrders: any[];
    }>('/customer/dashboard/stats', {
      method: 'GET',
    });
  }

  // Customization endpoints
  async getUserCustomizations(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<{ customizations: any[]; pagination: any }>(
      `/customizations/my-customizations${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async getAllCustomizations(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request<{ customizations: any[]; pagination: any }>(
      `/customizations${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async getCustomizationById(id: number) {
    return this.request<{ customization: any }>(`/customizations/${id}`, {
      method: 'GET',
    });
  }

  async createCustomization(data: {
    title: string;
    description: string;
    type?: 'bouquet' | 'flower' | 'arrangement' | 'other';
    occasion?: string;
    preferred_colors?: string;
    budget?: number;
    delivery_date?: string;
    special_requirements?: string;
  }) {
    return this.request<{ customization: any }>('/customizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomizationStatus(
    id: number,
    data: {
      status: 'pending' | 'reviewing' | 'quoted' | 'accepted' | 'rejected' | 'completed';
      admin_notes?: string;
      quoted_price?: number;
    }
  ) {
    return this.request<{ customization: any }>(`/customizations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createOrderFromCustomization(
    id: number,
    data: {
      shipping_address: string;
      phone: string;
      latitude?: number;
      longitude?: number;
      notes?: string;
    }
  ) {
    return this.request<{ order: any }>(`/customizations/${id}/create-order`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeCustomizationOrder(
    id: number,
    data: {
      shipping_address: string;
      phone: string;
      latitude?: number;
      longitude?: number;
      notes?: string;
      payment_status?: 'pending' | 'paid';
    }
  ) {
    return this.request<{ order: any }>(`/customizations/${id}/complete-order`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();

