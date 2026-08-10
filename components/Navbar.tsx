import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-zinc-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-900/40 group-hover:scale-105 transition transform duration-200">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              MRXBEASTYT
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 -mt-1">
              Downloader
            </span>
          </div>
        </Link>

        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm font-medium text-zinc-300 hover:text-indigo-400 transition-colors">
            How It Works
          </a>
          <a href="#features" className="text-sm font-medium text-zinc-300 hover:text-indigo-400 transition-colors">
            Features
          </a>
          <a href="#tools" className="text-sm font-medium text-zinc-300 hover:text-indigo-400 transition-colors">
            Tools
          </a>
          <a href="#faq" className="text-sm font-medium text-zinc-300 hover:text-indigo-400 transition-colors">
            FAQ
          </a>
          <a href="#blog" className="text-sm font-medium text-zinc-300 hover:text-indigo-400 transition-colors">
            Blog
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#download-form"
            className="px-4 py-2 text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-md shadow-indigo-900/30 transition transform hover:scale-105 active:scale-95"
          >
            Start Download
          </a>
        </div>
      </div>
    </header>
  );
}
