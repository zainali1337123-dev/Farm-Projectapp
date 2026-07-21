import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-3xl font-extrabold font-display text-slate-900 tracking-tight mb-2">404</h2>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Page Not Found</p>
        <p className="text-slate-600 mb-6 text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
        >
          Go back to Dashboard
        </Link>
      </div>
    </div>
  );
}
