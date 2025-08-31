'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { LoginCredentials, AuthResponse } from '@/types/auth.types';
import { loginSchema } from '@/utils/validators';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Eye, EyeOff } from 'lucide-react';
import * as yup from 'yup';

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const form = useForm<LoginCredentials>({
    resolver: yupResolver(loginSchema as yup.AnyObjectSchema), // ✅ cast schema
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      const response = await login(data);
      
      // Ensure we have a valid response
      if (response && response.userType && response.token) {
        console.log('Redirecting to:', response.userType === 'student' ? '/student' : '/admin');
        
        // Use replace instead of push to prevent back navigation issues
        if (response.userType === 'student') {
          router.replace('/student');
        } else if (response.userType === 'admin') {
          router.replace('/admin');
        }
      } else {
        console.error('Invalid login response:', response);
      }
    } catch (error) {
      console.error('Login error:', error);
      // error is already handled inside useAuth
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo + Heading */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-600 flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">STUDENT</span>
          </div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your student information portal
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your Matric Number (students) or Email (admins)
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Identity */}
              <div className="space-y-2">
                <Label htmlFor="identity">Matric Number / Email</Label>
                <Input
                  id="identity"
                  placeholder="e.g. VUG/BNS/12/0042 or name@veritas.edu.ng"
                  {...form.register('identity')}
                />
                {form.formState.errors.identity && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.identity.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...form.register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-sm text-muted-foreground">
              Having trouble? Contact your orientation camp office.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
