'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const PendingPaymentsTest: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing API...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/nysc/test-pending-payments`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Result:', result);
      setData(result);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">API Test Component</h3>
      
      <Button onClick={testAPI} disabled={loading}>
        {loading ? 'Testing...' : 'Test API'}
      </Button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {data && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
          <p><strong>Success!</strong></p>
          <p>Total Pending: {data.stats?.total_pending}</p>
          <p>Recent Pending: {data.recent_pending?.length}</p>
          <details className="mt-2">
            <summary>Raw Data</summary>
            <pre className="text-xs mt-2 overflow-auto max-h-40">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default PendingPaymentsTest;