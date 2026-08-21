import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
        DRISHTI AI
      </h1>
      <p className="text-xl text-zinc-400 max-w-2xl mb-8">
        Intelligent behavioural surveillance and analytics. Privacy-first, real-time insights for comprehensive environment monitoring.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200">
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="border-zinc-700 hover:bg-zinc-800">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
