"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global app error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-xl w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
              <span className="text-2xl font-bold">!</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              An unexpected error occurred. Please try again or return to the dashboard.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => reset()}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Try again
              </button>
              <Link
                href="/admin"
                className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
            {error?.digest && (
              <p className="mt-4 text-xs text-gray-400">Error ID: {error.digest}</p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}