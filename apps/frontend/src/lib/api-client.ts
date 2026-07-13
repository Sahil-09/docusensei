'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { streamFlow } from 'genkit/beta/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4444/api/v1';

export function useApi() {
  const { getToken } = useAuth();

  const fetchWithAuth = async (endpoint: string, options: any = {}) => {
    const token = await getToken({

    });

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    console.log(response);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  };

  return {
    get: (endpoint: string) => fetchWithAuth(endpoint),
    post: (endpoint: string, data: unknown) =>
      fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    put: (endpoint: string, data: unknown) =>
      fetchWithAuth(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (endpoint: string) =>
      fetchWithAuth(endpoint, {
        method: 'DELETE',
      }),
    postFile: (endpoint: string, data: unknown) =>
      fetchWithAuth(endpoint, {
        method: 'POST',
        body: data,
      }),
    patchFile: (endpoint: string, data: unknown) =>
      fetchWithAuth(endpoint, {
        method: 'PATCH',
        body: data,
      }),
    streamAi: (endpoint: string, input: unknown) => {
      return streamFlow({
        url: `${API_BASE_URL}${endpoint}`,
        input,
      });
    },
  };
}
