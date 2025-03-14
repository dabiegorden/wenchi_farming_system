'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth';

export default function Navigation() {
  const { user, logout } = useAuth();
  
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Wenchi Farm Institute
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span>Welcome, {user.fullName}</span>
              <button 
                onClick={logout}
                className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1 hover:underline">
                Login
              </Link>
              <Link 
                href="/register" 
                className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}