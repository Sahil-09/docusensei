'use client';
import { useApi } from '../lib/api-client';
import { useState } from 'react';

import { UserButton, useUser, useAuth } from '@clerk/nextjs';

export function UserProfile() {
  const api = useApi()
  const [data, setData] = useState(null);

  const fetchProtectedData = async () => {
    try {
      const result = await api.get('/protected');
      setData(result);
      console.log('Protected data:', result);
    } catch (error) {
      console.error('API Error:', error);
    }
  };

  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  if (!isLoaded) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex items-center gap-4 p-4">
      <UserButton />
      <div>
        <p className="font-semibold">
          Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User'}
        </p>
        <p className="text-sm text-gray-600">{user?.emailAddresses[0]?.emailAddress}</p>
      </div>
      <button
        onClick={async () => {
          const token = await getToken();
          console.log('JWT Token:', token);
        }}
        className="ml-4 rounded bg-blue-500 px-4 py-2 text-white text-sm hover:bg-blue-600"
      >
        Log JWT Token
      </button>
      <button onClick={()=>fetchProtectedData()}>
        Call backend
      </button>
    </div>
  );
}
