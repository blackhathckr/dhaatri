import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F1EB] px-4">
      <div className="w-40 h-40 relative mb-6">
        <Image src="/mascot/sprout-thinking.png" alt="Sprout thinking" fill className="object-contain" />
      </div>
      <h1 className="text-6xl font-extrabold text-[#1B4332] mb-2">404</h1>
      <h2 className="text-xl font-bold text-[#2D6A4F] mb-4">Page Not Found</h2>
      <p className="text-sm text-[#6B7F75] max-w-md text-center mb-8">
        Looks like this page wandered off into the forest. Let&apos;s get you back on track.
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-[#2D6A4F] text-white font-bold text-sm hover:bg-[#1B4332] transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-xl border-2 border-[#2D6A4F] text-[#2D6A4F] font-bold text-sm hover:bg-[#E9F5EE] transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
