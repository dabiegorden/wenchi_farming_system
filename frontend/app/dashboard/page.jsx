'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/user-info', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include' // Important to include cookies for session
        });

        if (!response.ok) {
          // If response is 401 (Unauthorized), redirect to sign-in
          if (response.status === 401) {
            router.push('/sign-in');
            return;
          }
          throw new Error('Failed to fetch user information');
        }

        const data = await response.json();
        setUser(data.data.user);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [router]);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      
      const response = await fetch('http://localhost:5000/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Important to include cookies for session
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign out');
      }
      
      // Clear any client-side state if needed
      setUser(null);
      
      // Redirect to sign-in page after successful sign-out
      router.push('/sign-in');
    } catch (err) {
      setError(err.message);
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-500">Error: {error}</p>
          <button 
            onClick={() => router.push('/sign-in')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>

        <div className="py-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and account information.</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.name || 'Not provided'}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.email}</dd>
                </div>
                {/* <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?._id}</dd>
                </div> */}
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Account created</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'Not available'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}