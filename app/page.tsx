import Image from "next/image";
import Navbar from "@/components/Navbar";
import HeroForm from "@/components/HeroForm";
import FaqAccordion from "@/components/FaqAccordion";

// STATIC CONST ARRAYS FOR O(1) SERVER RENDER MAPS
const PLATFORM_ICONS = [
  {
    name: "YouTube",
    badge: "4K & MP3",
    color: "from-red-600 to-rose-700",
    icon: (
      <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    name: "Facebook",
    badge: "HD Videos",
    color: "from-blue-600 to-indigo-700",
    icon: (
      <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    name: "Instagram",
    badge: "Reels & Posts",
    color: "from-pink-600 to-purple-700",
    icon: (
      <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    name: "TikTok",
    badge: "No Watermark",
    color: "from-cyan-500 to-teal-600",
    icon: (
      <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.57-1.31 1.56-1.28 2.56.02.9.52 1.74 1.28 2.22.84.54 1.93.63 2.87.26.91-.35 1.62-1.16 1.83-2.11.11-.53.14-1.08.13-1.62.03-4.52.02-9.04.02-13.56z"/>
      </svg>
    ),
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Copy Video URL",
    description: "Navigate to YouTube, Facebook, Instagram, or TikTok and copy the video's public web link.",
    icon: (
      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Paste URL Here",
    description: "Paste the copied URL into the downloader input bar above and click the Download button.",
    icon: (
      <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Select Format & Quality",
    description: "Choose your preferred video resolution (4K, 1080p, 720p) or high-bitrate MP3 audio format.",
    icon: (
      <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  {
    step: "04",
    title: "Save File to Device",
    description: "Click download to save the media file directly to your computer, tablet, or smartphone.",
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
];

const SUPPORTED_PLATFORMS = [
  { name: "YouTube", desc: "4K, 1080p, Shorts & MP3", icon: "▶️" },
  { name: "Facebook", desc: "Watch Videos, Stories & Reels", icon: "📘" },
  { name: "Instagram", desc: "Reels, IGTV, Posts & Stories", icon: "📸" },
  { name: "TikTok", desc: "HD Videos Without Watermark", icon: "🎵" },
  { name: "Twitter / X", desc: "Tweets Video & GIF Downloader", icon: "🐦" },
  { name: "Vimeo", desc: "High Quality HD Video Downloads", icon: "🎞️" },
  { name: "Pinterest", desc: "Pin Videos & Story Pins", icon: "📌" },
  { name: "Reddit", desc: "Embedded Audio & Video Streams", icon: "🤖" },
  { name: "Twitch", desc: "Clips & Highlight Downloads", icon: "💜" },
  { name: "Threads", desc: "Video Posts & Media Clips", icon: "🧵" },
];

const WHY_CHOOSE_US_FEATURES = [
  {
    title: "Ultra Lightning Speed",
    description: "High-speed media processing engine converts and processes download links in milliseconds.",
    icon: (
      <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "4K & Full HD Crisp Quality",
    description: "Preserve maximum video resolution up to 4K Ultra HD without any compression loss.",
    icon: (
      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "100% Free Forever",
    description: "Enjoy unlimited downloads with zero hidden fees, subscriptions, or credit card requirements.",
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "No Account Required",
    description: "Download instantly without creating an account, logging in, or sharing personal credentials.",
    icon: (
      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    title: "Safe, Private & Secure",
    description: "SSL encrypted connections. We store zero download logs or personal media data on servers.",
    icon: (
      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Multi-Format Options",
    description: "Extract clean audio into MP3 format or keep full video streams in MP4 and WEBM formats.",
    icon: (
      <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
  {
    title: "Cross-Platform Compatible",
    description: "Works flawlessly on macOS, Windows, Linux, Android smartphones, iPhones, and iPads.",
    icon: (
      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Unlimited Usage",
    description: "Zero restrictions on daily downloads. Grab as many videos and audio tracks as you need.",
    icon: (
      <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a9 9 0 010-12.728m0 0l2.829 2.829M5.636 5.636L3 3" />
      </svg>
    ),
  },
];

const TOOL_LINKS_GRID = [
  { title: "YouTube Video Downloader", desc: "Download 4K & Full HD YouTube videos", anchor: "#download-form" },
  { title: "YouTube Shorts Downloader", desc: "Download short vertical videos in MP4", anchor: "#download-form" },
  { title: "YouTube Thumbnail Grabber", desc: "Extract original HD video thumbnails", anchor: "#download-form" },
  { title: "YouTube Tag Extractor", desc: "View video SEO tags and keywords", anchor: "#download-form" },
  { title: "Facebook Video Downloader", desc: "Save public Facebook posts & videos", anchor: "#download-form" },
  { title: "Facebook Reels Downloader", desc: "Download high definition FB Reels", anchor: "#download-form" },
  { title: "Instagram Reels Downloader", desc: "Save Insta Reels directly to gallery", anchor: "#download-form" },
  { title: "TikTok Watermark Remover", desc: "Save TikTok clips with no watermark", anchor: "#download-form" },
];

const QUALITY_INFO_CARDS = [
  {
    quality: "4K Ultra HD",
    res: "3840 x 2160",
    bitrate: "~25 Mbps",
    badge: "Ultra Crisp",
    color: "border-red-500/40 text-red-400",
    desc: "Best for large smart TVs and desktop displays. Maximum visual fidelity.",
  },
  {
    quality: "2K QHD",
    res: "2560 x 1440",
    bitrate: "~12 Mbps",
    badge: "High Clarity",
    color: "border-rose-500/40 text-rose-400",
    desc: "Ideal balance of high definition detail and optimized file storage.",
  },
  {
    quality: "1080p Full HD",
    res: "1920 x 1080",
    bitrate: "~6 Mbps",
    badge: "Standard HD",
    color: "border-amber-500/40 text-amber-400",
    desc: "Universal standard for mobile screens, tablets, and laptops.",
  },
  {
    quality: "720p HD",
    res: "1280 x 720",
    bitrate: "~3 Mbps",
    badge: "Fast Load",
    color: "border-emerald-500/40 text-emerald-400",
    desc: "Lightweight download size with smooth playback on mobile networks.",
  },
  {
    quality: "480p SD",
    res: "854 x 480",
    bitrate: "~1.5 Mbps",
    badge: "Data Saver",
    color: "border-blue-500/40 text-blue-400",
    desc: "Compact file size for quick sharing and low bandwidth connections.",
  },
];

const BLOG_PREVIEWS = [
  {
    title: "How to Download 4K YouTube Videos for Offline Viewing",
    category: "Guides",
    date: "Aug 08, 2026",
    readTime: "4 min read",
    snippet: "Learn step-by-step how to download ultra-high-definition 4K videos on PC, Mac, and mobile devices effortlessly.",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop",
  },
  {
    title: "Top 5 Ways to Save Instagram Reels Without Watermarks",
    category: "Tips & Tricks",
    date: "Aug 05, 2026",
    readTime: "3 min read",
    snippet: "Discover how to save Instagram Reels in original 1080p resolution directly to your iOS or Android camera roll.",
    image: "https://images.unsplash.com/photo-1611262588024-d12430b98920?q=80&w=600&auto=format&fit=crop",
  },
  {
    title: "MP4 vs MP3: Which Video & Audio Format Should You Choose?",
    category: "Comparison",
    date: "Jul 29, 2026",
    readTime: "5 min read",
    snippet: "Understand file container differences, audio bitrates, and compression formats for optimal media storage.",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop",
  },
  {
    title: "Understanding Public Media Download Laws & Best Practices",
    category: "Legal & Safety",
    date: "Jul 20, 2026",
    readTime: "6 min read",
    snippet: "A practical breakdown of copyright rules, fair use guidelines, and safe media archival standards online.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
  },
];

const FAQS_DATA = [
  {
    question: "Is MRXBEASTYT Downloader free to use?",
    answer: "Yes, MRXBEASTYT Downloader is 100% free with unlimited downloads and no registration required.",
  },
  {
    question: "Which video formats and qualities are supported?",
    answer: "We support resolutions ranging from 480p up to 4K Ultra HD in MP4 format, as well as MP3 high-bitrate audio extraction.",
  },
  {
    question: "Do I need to install any software or browser extensions?",
    answer: "No software installation is required. Everything runs directly inside your web browser on desktop, iOS, and Android devices.",
  },
  {
    question: "What platforms can I download videos from?",
    answer: "We support YouTube, Instagram (Reels & Posts), Facebook, TikTok (without watermark), Twitter/X, Vimeo, Pinterest, Reddit, and Twitch.",
  },
  {
    question: "Can I convert video files to MP3 audio?",
    answer: "Yes, you can extract crystal-clear 320kbps audio from any supported video link in seconds.",
  },
  {
    question: "Is downloading videos legal?",
    answer: "Downloading public content for personal offline viewing or archival purposes is generally acceptable. Always respect copyright laws and creator content rights.",
  },
  {
    question: "Where are the downloaded files saved on my device?",
    answer: "Files are automatically saved in your browser's default 'Downloads' folder or default media gallery on mobile.",
  },
  {
    question: "Is MRXBEASTYT Downloader safe and secure?",
    answer: "Yes! Our platform features end-to-end SSL encryption, stores no user data, and contains zero adware or malware.",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="flex-1 space-y-24 pb-20">
        {/* SECTION 1: HERO SECTION */}
        <section id="download-form" className="relative pt-12 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-emerald-500/15 blur-[140px] rounded-full pointer-events-none -z-10" />

          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Real-Time High Speed Downloader
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Download 4K Videos & MP3s <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">From Any Platform Instantly</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Fast, free, and secure online media downloader for YouTube, Facebook, Instagram, TikTok, and more. Powered by yt-dlp & FFmpeg audio/video stream merging.
            </p>

            {/* Interactive Hero Input Form */}
            <div className="pt-4 min-h-[140px]">
              <HeroForm />
            </div>

            {/* Trust Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 max-w-3xl mx-auto">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center hover:border-zinc-700 transition">
                <p className="text-2xl font-bold text-white">10+ Platforms</p>
                <p className="text-xs text-zinc-400 mt-0.5">Full Support</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center hover:border-zinc-700 transition">
                <p className="text-2xl font-bold text-emerald-400">100% Free</p>
                <p className="text-xs text-zinc-400 mt-0.5">No Hidden Fees</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center hover:border-zinc-700 transition">
                <p className="text-2xl font-bold text-indigo-400">4K & HD</p>
                <p className="text-xs text-zinc-400 mt-0.5">Crisp Media</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center hover:border-zinc-700 transition">
                <p className="text-2xl font-bold text-purple-400">100% Secure</p>
                <p className="text-xs text-zinc-400 mt-0.5">SSL Encrypted</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: PLATFORM ICONS ROW */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Popular Supported Services
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {PLATFORM_ICONS.map((platform, idx) => (
              <div
                key={idx}
                className="glass-card p-5 rounded-2xl flex items-center gap-4 group cursor-pointer"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${platform.color} text-white shadow-lg shrink-0 group-hover:scale-110 transition transform`}>
                  {platform.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-red-400 transition">
                    {platform.name}
                  </h3>
                  <span className="text-[11px] text-zinc-400 block font-medium">
                    {platform.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: HOW IT WORKS 4-STEP PROCESS */}
        <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest">
              Simple Workflow
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              How to Download Videos in 4 Steps
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Follow this easy process to grab high quality video or audio files in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS_STEPS.map((item, idx) => (
              <div key={idx} className="glass-card p-6 rounded-2xl relative space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-3xl font-black text-zinc-800 font-mono">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: SUPPORTED PLATFORMS GRID */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest">
              Multi-Platform Engine
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Supported Media Platforms
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Download from over 10+ social media platforms and video hosting providers seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {SUPPORTED_PLATFORMS.map((item, idx) => (
              <div
                key={idx}
                className="glass-card p-4 rounded-xl text-center space-y-2 group hover:border-zinc-700 transition"
              >
                <div className="text-3xl group-hover:scale-110 transition transform">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-sm text-white">{item.name}</h3>
                <p className="text-[11px] text-zinc-400 leading-tight">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: WHY CHOOSE US 8-FEATURE GRID */}
        <section id="features" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest">
              Premium Features
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Why Choose MRXBEASTYT Downloader
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Engineered for maximum download speed, crystal-clear media resolution, and total user privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_CHOOSE_US_FEATURES.map((feat, idx) => (
              <div key={idx} className="glass-card p-6 rounded-2xl space-y-3 hover:border-red-900/40">
                <div className="w-12 h-12 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center">
                  {feat.icon}
                </div>
                <h3 className="text-base font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: TOOL LINKS GRID */}
        <section id="tools" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest">
              Specialized Utilities
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Free Online Downloader Tools
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Quick access shortcuts for specific media formats and platform tools.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {TOOL_LINKS_GRID.map((tool, idx) => (
              <a
                key={idx}
                href={tool.anchor}
                className="glass-card p-5 rounded-xl block space-y-2 group hover:border-red-500/50"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition">
                    {tool.title}
                  </h3>
                  <svg className="w-4 h-4 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <p className="text-xs text-zinc-400">{tool.desc}</p>
              </a>
            ))}
          </div>
        </section>

        {/* SECTION 7: QUALITY INFO SECTION */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest">
              Resolution Specs
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Available Video & Audio Qualities
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Choose the exact video quality or audio bitrate that matches your device and storage needs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {QUALITY_INFO_CARDS.map((card, idx) => (
              <div
                key={idx}
                className={`glass-card p-5 rounded-2xl space-y-3 border ${card.color}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {card.badge}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-current" />
                </div>
                <h3 className="text-xl font-black text-white">{card.quality}</h3>
                <div className="space-y-1 text-xs text-zinc-400 font-mono">
                  <p>Res: {card.res}</p>
                  <p>Bitrate: {card.bitrate}</p>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-900 pt-2">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 8: BLOG PREVIEW CARDS */}
        <section id="blog" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest">
              Latest Articles
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Guides & Video Tips
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Read our latest guides on video downloader technology, formats, and best practices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BLOG_PREVIEWS.map((post, idx) => (
              <article
                key={idx}
                className="glass-card rounded-2xl overflow-hidden group flex flex-col"
              >
                <div className="relative h-44 w-full bg-zinc-800 overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 text-red-400 text-[10px] font-bold uppercase rounded-md backdrop-blur-md">
                    {post.category}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                      <span>{post.date}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="font-bold text-base text-white group-hover:text-red-400 transition line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                      {post.snippet}
                    </p>
                  </div>
                  <a
                    href="#download-form"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 pt-2"
                  >
                    <span>Read Guide</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 9: FAQ ACCORDION */}
        <section id="faq" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest">
              Got Questions?
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Everything you need to know about using MRXBEASTYT Downloader.
            </p>
          </div>

          <FaqAccordion faqs={FAQS_DATA} />
        </section>
      </main>

      {/* SECTION 10: FOOTER WITH LINK COLUMNS AND LEGAL DISCLAIMER */}
      <footer className="border-t border-zinc-900 bg-zinc-950 text-zinc-400 text-sm pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z" />
                  </svg>
                </div>
                <span className="font-extrabold text-lg tracking-tight text-white">
                  MRXBEASTYT Downloader
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                The ultimate free online media utility for converting and downloading public videos and audio streams in ultra high resolution.
              </p>
              <div className="text-xs text-zinc-500 font-mono">
                © {new Date().getFullYear()} MRXBEASTYT. All rights reserved.
              </div>
            </div>

            <div>
              <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
                Downloaders
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#download-form" className="hover:text-white transition">YouTube Downloader</a></li>
                <li><a href="#download-form" className="hover:text-white transition">Facebook Downloader</a></li>
                <li><a href="#download-form" className="hover:text-white transition">Instagram Downloader</a></li>
                <li><a href="#download-form" className="hover:text-white transition">TikTok Downloader</a></li>
                <li><a href="#download-form" className="hover:text-white transition">Twitter / X Downloader</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
                Tools
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#download-form" className="hover:text-white transition">Reels Downloader</a></li>
                <li><a href="#download-form" className="hover:text-white transition">Shorts Converter</a></li>
                <li><a href="#download-form" className="hover:text-white transition">MP3 Audio Extractor</a></li>
                <li><a href="#download-form" className="hover:text-white transition">Thumbnail Grabber</a></li>
                <li><a href="#download-form" className="hover:text-white transition">Tag Extractor</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
                Resources & Legal
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#blog" className="hover:text-white transition">Blog & Guides</a></li>
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#download-form" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#download-form" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-900 pt-8 text-[11px] text-zinc-500 leading-relaxed space-y-2">
            <p className="font-bold text-zinc-400 uppercase tracking-wider">Disclaimer & Terms of Use:</p>
            <p>
              MRXBEASTYT Downloader is an independent utility tool and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with YouTube, Facebook, Instagram, TikTok, Twitter/X, or any of their subsidiaries or affiliates. All trademarks, service marks, trade names, product names, and logos appearing on this site are the property of their respective owners.
            </p>
            <p>
              Users are solely responsible for ensuring that their use of this service complies with applicable copyright laws, intellectual property rights, and platform terms of service. This website does not host copyrighted media files on its servers.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
