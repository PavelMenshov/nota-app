'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/api';

interface ApiStatusProps {
  onStatusChange?: (isHealthy: boolean) => void;
}

export function ApiStatus({ onStatusChange }: ApiStatusProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isHealthy, setIsHealthy] = useState(false);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    const checkHealth = async () => {
      // Show the configured API URL for diagnostics
      setApiUrl(getApiUrl());
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        // Use relative URL to go through Next.js proxy, avoiding CORS issues
        const response = await fetch('/api/health', {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const healthy = response.ok;
        setIsHealthy(healthy);
        onStatusChange?.(healthy);
      } catch (error) {
        setIsHealthy(false);
        onStatusChange?.(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, onStatusChange is called but not tracked

  if (isChecking) {
    return (
      <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">Checking API server status...</p>
      </div>
    );
  }

  if (!isHealthy) {
    return (
      <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
        <p className="text-sm font-bold text-red-700">⚠️ Cannot connect to API server</p>
        <p className="text-xs text-red-600">
          The API server at <code className="bg-red-100 px-1 rounded">{apiUrl}</code> is not responding.
        </p>
        <p className="text-xs text-red-600">
          Please ensure the API server is running:
        </p>
        <div className="text-xs text-left bg-red-100 p-2 rounded font-mono max-w-md mx-auto">
          # Start the API server:<br />
          pnpm dev:api<br />
          <br />
          # Or start all services:<br />
          pnpm dev
        </div>
      </div>
    );
  }

  return (
    <div className="text-center p-2 bg-green-50 border border-green-200 rounded-lg">
      <p className="text-xs text-green-700">✓ Connected to API server</p>
    </div>
  );
}
