'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-extrabold font-display text-slate-900 tracking-tight mb-2">Error</h2>
        <p className="text-sm font-semibold text-rose-600 uppercase tracking-wider mb-4">Something went wrong!</p>
        <p className="text-slate-600 mb-6 text-sm">
          An unexpected error occurred. Please try reloading the page or reset the application view.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
          >
            Reset view
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-all"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
