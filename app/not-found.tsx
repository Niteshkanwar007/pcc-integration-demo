import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold font-mono text-white mb-2">404 - Page Not Found</h2>
      <p className="text-slate-400 text-sm max-w-md mb-6">
        The requested resource does not exist in this PCC Integration Demo.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold font-mono transition-colors"
      >
        Return to Integration Console
      </Link>
    </div>
  );
}
