import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle login
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Step 1: Authenticate user with Supabase auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw new Error(authError.message);

      // Step 2: Check if the user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin') // Admin table containing user_id and role
        .select('role, user_id')
        .eq('user_id', data.user.id) // Matching the user_id with the logged-in user's ID
        .single();

      if (adminError || !adminData) {
        toast.error('You are not authorized as an admin');
        return;
      }

      // Step 3: Redirect to admin dashboard if the user is an admin
      if (adminData.role === 'admin' || adminData.role === 'superadmin') {
        toast.success('Successfully logged in as admin!');
        navigate('/'); // Redirect to the admin dashboard or any admin page
      } else {
        toast.error('User is not an admin');
      }

    } catch (error) {
      toast.error(error.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Google Sign-In */}
        {/* <div className="mt-4">
          <button
            disabled={loading}
            onClick={() => {
              // Add your Google sign-in logic here if needed
            }}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div> */}
      </div>
    </div>
  );
}
