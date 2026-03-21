import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('✅ Form submitted with data:', data);
    try {
      console.log('🔄 Attempting login with:', data.email);
      const userData = await login(data.email, data.password);
      console.log('✅ Login successful, user data:', userData);
      
      toast.success(`Welcome back, ${userData.name}!`);
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        // Redirect based on user role
        if (userData?.role === 'superadmin' || userData?.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          // Regular customers go to home; they can enter dashboard via navbar/profile icon
          navigate('/', { replace: true });
        }
      }, 100);
    } catch (error: any) {
      console.error('❌ Login error:', error);
      toast.error(error.message || 'Invalid credentials. Please try again.');
    }
  };

  const onError = (errors: any) => {
    console.log('❌ Form validation errors:', errors);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <img src="/logo.jpg" alt="Buneko Nepal" className="h-8 w-8 object-contain" />
            <span className="font-serif text-2xl font-semibold text-foreground">
              Buneko Nepal
            </span>
          </Link>

          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mb-8">
            Sign in to your account to continue
          </p>

          <form 
            onSubmit={handleSubmit(onSubmit, onError)}
            className="space-y-6"
            noValidate
          >
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-10 rounded-xl"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 rounded-xl"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="text-center mt-8 text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex w-1/2 bg-primary items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center max-w-md"
        >
              <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <img src="/logo.jpg" alt="Buneko Nepal" className="h-12 w-12 object-contain rounded-full" />
              </div>
          <h2 className="font-serif text-3xl font-bold text-primary-foreground mb-4">
            Handcrafted with Love
          </h2>
          <p className="text-primary-foreground/80 leading-relaxed">
            Experience the beauty of traditional Nepali craftsmanship with our 
            unique collection of handmade flowers, created by skilled local artisans.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
