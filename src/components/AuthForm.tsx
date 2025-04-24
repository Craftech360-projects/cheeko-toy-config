import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { supabase, getRedirectUrl } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.svg';
import toast from 'react-hot-toast';

export function AuthForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isAdminUser = email.toLowerCase() === 'rahul@craftech360.com';

      if (isAdminUser) {
        if (!password) {
          throw new Error('Password is required for admin login');
        }

        console.log('Attempting admin sign in with:', { 
          email: email.toLowerCase(),
          passwordLength: password?.length || 0 
        });

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password
        });

        console.log('Sign in response:', { data, error });

        if (error) {
          throw error;
        }

        toast.success('Successfully signed in!');
        navigate('/admin');
      } else {
        // For regular users, use magic link
        console.log('Attempting magic link sign in for:', email.toLowerCase());
        
        const { error } = await supabase.auth.signInWithOtp({
          email: email.toLowerCase(),
          options: {
            emailRedirectTo: getRedirectUrl(),
          },
        });

        console.log('Magic link response error:', error);

        if (error) {
          throw error;
        }

        setSent(true);
        toast.success('Check your email for the magic link!');
      }
    } catch (error: any) {
      console.log('Authentication error details:', {
        message: error?.message,
        error: error,
        email: email.toLowerCase(),
        isAdmin: email.toLowerCase() === 'rahul@craftech360.com'
      });
      
      const errorMessage = error?.message || 'Authentication failed. Please check your credentials.';
      toast.error(errorMessage);
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdminUser = email.toLowerCase() === 'rahul@craftech360.com';

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center mb-8">
            <img 
              src={logo}
              alt="Cheeko" 
              className="h-16 w-auto"
            />
          </div>
          
          {!sent ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary-700">
                  Email
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                  <Mail className="absolute right-3 top-3 text-primary-400" size={20} />
                </div>
              </div>

              {isAdminUser && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-primary-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your password"
                      required={isAdminUser}
                    />
                    <Lock className="absolute right-3 top-3 text-primary-400" size={20} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : (isAdminUser ? 'Sign In' : 'Send Magic Link')}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-primary-700">
                Magic link has been sent to your email!
              </p>
              <p className="text-sm text-primary-500">
                Please check your email and click the link to sign in.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}