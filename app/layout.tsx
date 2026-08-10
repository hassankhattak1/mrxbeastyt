import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = "https://mrxbeastyt-downloader.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MRXBEASTYT Downloader - Free Online Video & Audio Downloader",
    template: "%s | MRXBEASTYT Downloader",
  },
  description:
    "Fast, free, and secure online video downloader for YouTube, Facebook, Instagram, TikTok, Reels, Shorts and more. Download 4K, 1080p MP4 videos and high-quality MP3 audio with no software required.",
  keywords: [
    "video downloader",
    "YouTube downloader",
    "Instagram reels downloader",
    "TikTok video downloader",
    "Facebook downloader",
    "MP4 downloader",
    "MP3 converter",
    "free video downloader",
    "MRXBEASTYT"
  ],
  authors: [{ name: "MRXBEASTYT Team" }],
  creator: "MRXBEASTYT",
  publisher: "MRXBEASTYT Downloader",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "MRXBEASTYT Downloader - Fast & Free 4K Video Downloader",
    description:
      "Download high-quality videos and MP3 audio from 10+ platforms including YouTube, Instagram, Facebook, and TikTok. 100% Free, Secure & Fast.",
    siteName: "MRXBEASTYT Downloader",
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "MRXBEASTYT Video Downloader Interface Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MRXBEASTYT Downloader - Free 4K Video Downloader",
    description:
      "Download high-quality videos and MP3 audio from 10+ platforms including YouTube, Instagram, Facebook, and TikTok.",
    creator: "@mrxbeastyt",
    images: [`${siteUrl}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // WebApplication JSON-LD
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "MRXBEASTYT Downloader",
    "url": siteUrl,
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Download 4K, 1080p MP4 videos and high quality MP3 audio from YouTube, Facebook, Instagram, TikTok and 10+ major social media platforms."
  };

  // FAQPage JSON-LD
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is MRXBEASTYT Downloader free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, MRXBEASTYT Downloader is 100% free with unlimited downloads and no registration required."
        }
      },
      {
        "@type": "Question",
        "name": "Which video formats and qualities are supported?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We support resolutions ranging from 480p up to 4K Ultra HD in MP4 format, as well as MP3 high-bitrate audio extraction."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to install any software or extensions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No software installation is required. Everything runs directly inside your web browser on desktop, iOS, and Android devices."
        }
      },
      {
        "@type": "Question",
        "name": "What platforms can I download videos from?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We support YouTube, Instagram (Reels & Posts), Facebook, TikTok (without watermark), Twitter/X, Vimeo, Pinterest, Reddit, and Twitch."
        }
      },
      {
        "@type": "Question",
        "name": "Can I convert video files to MP3 audio?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, you can extract crystal-clear 320kbps audio from any supported video link in seconds."
        }
      },
      {
        "@type": "Question",
        "name": "Is downloading videos legal?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Downloading public content for personal offline viewing or archival purposes is generally acceptable. Always respect copyright laws and creator content rights."
        }
      },
      {
        "@type": "Question",
        "name": "Where are the downloaded files saved on my device?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Files are automatically saved in your browser's default 'Downloads' folder or default media gallery on mobile."
        }
      },
      {
        "@type": "Question",
        "name": "Is MRXBEASTYT Downloader safe and secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Our platform features end-to-end SSL encryption, stores no user data, and contains zero adware or malware."
        }
      }
    ]
  };

  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-red-600 selection:text-white min-h-screen flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
