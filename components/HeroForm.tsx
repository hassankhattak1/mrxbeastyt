"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import Image from "next/image";

interface FormatOption {
  formatId: string;
  quality: string;
  format: string;
  size: string;
  type: string;
  resolution?: string;
}

interface MediaResult {
  title: string;
  thumbnail: string;
  duration: string;
  platform: string;
  webpageUrl?: string;
  url: string;
  formats: FormatOption[];
}

type JobStatus = "idle" | "queued" | "downloading" | "merging" | "done" | "error";

export default function HeroForm() {
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaData, setMediaData] = useState<MediaResult | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<FormatOption | null>(null);

  // Job & Progress states
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [jobError, setJobError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Clean up EventSource connection on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setError("Please paste a valid video URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setMediaData(null);
    setSelectedFormat(null);
    resetJobState();

    try {
      const res = await fetch("/api/fetch-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMediaData({ ...data.data, url: urlInput.trim() });
        if (data.data.formats && data.data.formats.length > 0) {
          setSelectedFormat(data.data.formats[0]);
        }
      } else {
        setError(data.error || "Failed to extract video. Please check the URL.");
      }
    } catch {
      setError("Network or extraction error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetJobState = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setJobId(null);
    setJobStatus("idle");
    setProgress(0);
    setJobError(null);
  };

  const startDownloadJob = async () => {
    if (!mediaData || !selectedFormat) return;

    resetJobState();
    setJobStatus("queued");

    try {
      const res = await fetch("/api/download/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: mediaData.url,
          formatId: selectedFormat.formatId,
          title: mediaData.title,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.jobId) {
        setJobStatus("error");
        setJobError(data.error || "Failed to start download job.");
        return;
      }

      const activeJobId = data.jobId;
      setJobId(activeJobId);

      // Open Server-Sent Events stream for live progress updates
      const es = new EventSource(`/api/download/progress/${activeJobId}`);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.status) setJobStatus(payload.status);
          if (typeof payload.progress === "number") setProgress(payload.progress);

          if (payload.status === "done") {
            es.close();
            // Automatically trigger file download via /api/download/file/[jobId]
            triggerFileDownload(activeJobId);
          } else if (payload.status === "error") {
            es.close();
            setJobError(payload.error || "Download process encountered an error.");
          }
        } catch {
          // Ignore JSON parse errors
        }
      };

      es.onerror = () => {
        es.close();
      };
    } catch {
      setJobStatus("error");
      setJobError("Failed to initiate connection to server.");
    }
  };

  const triggerFileDownload = (id: string) => {
    const link = document.createElement("a");
    link.href = `/api/download/file/${id}`;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text);
        setError(null);
      }
    } catch {
      // Ignore clipboard permission errors silently
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-2xl blur-md opacity-30 group-hover:opacity-60 transition duration-300"></div>
        <div className="relative flex flex-col md:flex-row gap-3 p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl">
          <div className="relative flex-1 flex items-center">
            <div className="pl-4 text-indigo-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <input
              type="url"
              required
              aria-label="Paste video URL here"
              placeholder="Paste public video URL (YouTube, Facebook, Instagram, TikTok...)"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-3 py-3 bg-transparent text-zinc-100 placeholder-zinc-500 text-sm md:text-base focus:outline-none"
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => setUrlInput("")}
                aria-label="Clear input"
                className="pr-3 text-zinc-500 hover:text-zinc-300 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={handlePaste}
              className="hidden sm:inline-flex items-center px-3 py-1.5 mr-2 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
            >
              Paste
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            aria-label="Start video download"
            className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Extracting...
              </>
            ) : (
              <>
                <span>Download</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-xl text-red-200 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Extracted Video & Format Radio Group Card */}
      {mediaData && (
        <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative w-full sm:w-48 h-32 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-800">
              <Image
                src={mediaData.thumbnail}
                alt={mediaData.title}
                fill
                sizes="(max-width: 640px) 100vw, 192px"
                className="object-cover"
                unoptimized
              />
              <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-xs font-mono rounded">
                {mediaData.duration}
              </span>
            </div>
            <div className="space-y-2 flex-1">
              <span className="inline-block px-2.5 py-0.5 text-xs font-medium text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 rounded-full">
                {mediaData.platform} Ready
              </span>
              <h2 className="text-lg font-bold text-zinc-100 line-clamp-2">
                {mediaData.title}
              </h2>
              <p className="text-xs text-zinc-400 truncate max-w-md">
                URL: {mediaData.url}
              </p>
            </div>
          </div>

          {/* Format Radio Selection Cards */}
          <div className="border-t border-zinc-800 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Select Format & Resolution
              </h3>
              <span className="text-xs text-zinc-500 font-mono">
                {mediaData.formats.length} options available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Select Video Format">
              {mediaData.formats.map((item, idx) => {
                const isSelected = selectedFormat?.formatId === item.formatId;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedFormat(item)}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") setSelectedFormat(item);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500"
                        : "bg-zinc-950/80 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-100">{item.quality}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${item.type === 'audio' ? 'bg-amber-950 text-amber-400 border border-amber-800/50' : 'bg-indigo-950 text-indigo-400 border border-indigo-800/50'}`}>
                          {item.format}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">Filesize: {item.size}</p>
                    </div>

                    <div className="shrink-0 pl-2">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "border-zinc-700 bg-zinc-900"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Start Download Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={startDownloadJob}
                disabled={!selectedFormat || jobStatus === "downloading" || jobStatus === "merging" || jobStatus === "queued"}
                className="w-full py-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-lg shadow-indigo-900/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Start Downloading Selected Format</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Progress Bar & Job Status Card */}
      {jobStatus !== "idle" && (
        <div className="p-6 bg-zinc-900/95 border border-zinc-800 rounded-2xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {jobStatus === "queued" && (
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              )}
              {(jobStatus === "downloading" || jobStatus === "merging") && (
                <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
              )}
              {jobStatus === "done" && (
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              )}
              {jobStatus === "error" && (
                <span className="w-3 h-3 rounded-full bg-red-500" />
              )}

              <span className="text-sm font-bold text-white">
                {jobStatus === "queued" && "Queued (Waiting for download slot...)"}
                {jobStatus === "downloading" && `Downloading Media Stream (${progress}%)`}
                {jobStatus === "merging" && "Merging Audio & Video Streams with FFmpeg..."}
                {jobStatus === "done" && "Download Completed Successfully!"}
                {jobStatus === "error" && "Download Error Encountered"}
              </span>
            </div>

            <span className="font-mono text-sm font-extrabold text-indigo-400">
              {jobStatus === "merging" ? "Merging" : `${progress}%`}
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                jobStatus === "error"
                  ? "bg-red-600"
                  : jobStatus === "merging"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse"
                  : jobStatus === "done"
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500"
              }`}
              style={{
                width: jobStatus === "merging" ? "100%" : `${Math.max(progress, 3)}%`,
              }}
            />
          </div>

          {/* Job State Messages & Retry Button */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            {jobStatus === "merging" && (
              <p className="animate-pulse text-purple-300">
                Piping high definition video and audio tracks...
              </p>
            )}

            {jobStatus === "done" && (
              <p className="text-emerald-400 font-medium">
                Your file has been sent to your browser downloads folder.
              </p>
            )}

            {jobStatus === "error" && (
              <div className="w-full flex items-center justify-between gap-4">
                <p className="text-red-300 truncate max-w-md">
                  {jobError || "Failed to complete media job."}
                </p>
                <button
                  type="button"
                  onClick={startDownloadJob}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-800 hover:bg-red-700 rounded-lg transition shrink-0"
                >
                  Retry Download
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
