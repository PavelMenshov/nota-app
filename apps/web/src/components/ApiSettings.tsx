'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiUrl, setConfig, isValidApiUrl, detectLocalApiServers } from '@/lib/api';

interface ApiSettingsProps {
  onSave?: () => void;
}

export function ApiSettings({ onSave }: ApiSettingsProps) {
  const [apiUrl, setApiUrl] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedServers, setDetectedServers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setApiUrl(getApiUrl());
  }, []);

  const handleDetectServers = async () => {
    setIsDetecting(true);
    setError('');
    try {
      const servers = await detectLocalApiServers();
      setDetectedServers(servers);
      if (servers.length === 0) {
        setError('No API servers found on common ports (3000, 4000)');
      } else if (servers.length === 1) {
        setApiUrl(servers[0]);
      }
    } catch (err) {
      setError('Failed to detect servers');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSave = () => {
    setError('');
    setSuccess(false);

    if (!apiUrl.trim()) {
      setError('API URL is required');
      return;
    }

    if (!isValidApiUrl(apiUrl)) {
      setError('Invalid URL format. Use http:// or https://');
      return;
    }

    try {
      setConfig({ apiUrl: apiUrl.trim() });
      setSuccess(true);
      setTimeout(() => {
        onSave?.();
        // Reload the page to apply new settings
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError('Failed to save settings');
    }
  };

  const handleReset = () => {
    setConfig({ apiUrl: undefined });
    setApiUrl(getApiUrl());
    setSuccess(false);
    setError('');
  };

  return (
    <div className="space-y-4 p-6 bg-white border border-[rgba(20,20,20,0.1)] rounded-xl">
      <div>
        <h3 className="text-lg font-bold text-[#141414] mb-1">API Server Settings</h3>
        <p className="text-sm text-[#5b6167]">
          Configure the API server URL if it's not on the default address
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-url" className="text-sm font-bold text-[#141414]">
            API Server URL
          </Label>
          <Input
            id="api-url"
            type="text"
            placeholder="http://localhost:4000"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="h-11 rounded-xl border-[rgba(20,20,20,0.10)] bg-white focus:border-[#1f7a4a] focus:ring-[rgba(31,122,74,0.12)] text-sm"
          />
          <p className="text-xs text-[#5b6167]">
            Current: {getApiUrl()}
          </p>
        </div>

        {detectedServers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#141414]">Detected Servers:</Label>
            <div className="space-y-1">
              {detectedServers.map((server) => (
                <button
                  key={server}
                  onClick={() => setApiUrl(server)}
                  className="block w-full text-left px-3 py-2 text-xs bg-[rgba(31,122,74,0.05)] hover:bg-[rgba(31,122,74,0.1)] rounded-lg border border-[rgba(31,122,74,0.2)] transition-colors"
                >
                  {server}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700">Settings saved! Reloading...</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleDetectServers}
            disabled={isDetecting}
            variant="outline"
            className="flex-1 h-10 text-xs font-bold rounded-full border-[rgba(20,20,20,0.10)] hover:bg-[rgba(0,0,0,0.02)]"
          >
            {isDetecting ? 'Detecting...' : 'Detect Servers'}
          </Button>
          <Button
            type="button"
            onClick={handleReset}
            variant="outline"
            className="h-10 px-4 text-xs font-bold rounded-full border-[rgba(20,20,20,0.10)] hover:bg-[rgba(0,0,0,0.02)]"
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={success}
            className="flex-1 h-10 text-xs font-bold rounded-full bg-gradient-to-b from-[#1f7a4a] to-[rgba(31,122,74,0.92)] border border-[rgba(31,122,74,0.45)] text-white shadow-[0_16px_34px_rgba(31,122,74,0.18)] hover:from-[#1f7a4a] hover:to-[rgba(31,122,74,0.86)]"
          >
            Save & Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
