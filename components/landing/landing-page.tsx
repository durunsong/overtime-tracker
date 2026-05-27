"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef } from "react";
import { ArrowRight, AtSign, Globe, MessageCircle } from "lucide-react";

const VIDEO_SOURCE =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4";

const FADE_DURATION = 500;
const LOOP_RESTART_DELAY = 100;
const FADE_OUT_REMAINING_SECONDS = 0.55;

export function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number | null>(null);
  const opacityRef = useRef(0);
  const fadingOutRef = useRef(false);

  const cancelFade = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const fadeTo = useCallback(
    (targetOpacity: number, afterFade?: () => void) => {
      cancelFade();

      const video = videoRef.current;
      if (!video) {
        return;
      }

      const startOpacity = opacityRef.current;
      const delta = targetOpacity - startOpacity;
      const startedAt = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / FADE_DURATION, 1);
        const nextOpacity = startOpacity + delta * progress;

        opacityRef.current = nextOpacity;
        video.style.opacity = nextOpacity.toString();

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick);
          return;
        }

        frameRef.current = null;
        afterFade?.();
      };

      frameRef.current = requestAnimationFrame(tick);
    },
    [cancelFade],
  );

  const fadeIn = useCallback(() => {
    fadingOutRef.current = false;
    fadeTo(1);
  }, [fadeTo]);

  const fadeOut = useCallback(() => {
    fadingOutRef.current = true;
    fadeTo(0);
  }, [fadeTo]);

  const replayVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    cancelFade();
    opacityRef.current = 0;
    video.style.opacity = "0";

    window.setTimeout(() => {
      if (!videoRef.current) {
        return;
      }

      video.currentTime = 0;
      void video.play();
      fadeIn();
    }, LOOP_RESTART_DELAY);
  }, [cancelFade, fadeIn]);

  useEffect(() => cancelFade, [cancelFade]);

  const handleLoadedData = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    opacityRef.current = Number.parseFloat(video.style.opacity || "0") || 0;
    void video.play();
    fadeIn();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || fadingOutRef.current) {
      return;
    }

    const remaining = video.duration - video.currentTime;
    if (remaining <= FADE_OUT_REMAINING_SECONDS) {
      fadeOut();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-black text-white">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full translate-y-[17%] object-cover opacity-0"
        src={VIDEO_SOURCE}
        muted
        autoPlay
        playsInline
        preload="auto"
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        onEnded={replayVideo}
      />

      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 to-transparent" />

      <nav className="relative z-20 px-6 py-6">
        <div className="liquid-glass mx-auto flex max-w-5xl items-center justify-between rounded-full px-6 py-3">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-white">
              <Globe size={24} aria-hidden="true" />
              <span>Asme</span>
            </Link>
            <div className="hidden items-center gap-8 md:flex">
              {["Features", "Pricing", "About"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/register" className="text-sm font-medium text-white">
              Sign Up
            </Link>
            <Link
              href="/auth/login"
              className="liquid-glass rounded-full px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative z-10 flex flex-1 -translate-y-[20%] flex-col items-center justify-center px-6 py-12 text-center">
        <h1
          className="mb-8 whitespace-nowrap text-5xl tracking-tight text-white md:text-6xl lg:text-7xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Built for the curious
        </h1>

        <div className="w-full max-w-xl space-y-4">
          <form
            className="liquid-glass flex items-center gap-3 rounded-full py-2 pl-6 pr-2"
            onSubmit={handleSubmit}
          >
            <input
              type="email"
              aria-label="Email address"
              placeholder="Enter your email"
              className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/40"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="rounded-full bg-white p-3 text-black transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          </form>

          <p className="px-4 text-sm leading-relaxed text-white">
            Stay updated with the latest news and insights. Subscribe to our newsletter today and
            never miss out on exciting updates.
          </p>

          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="liquid-glass rounded-full px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              Manifesto
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 flex justify-center gap-4 pb-12">
        {[
          { label: "Instagram", icon: AtSign, href: "https://instagram.com" },
          { label: "Twitter", icon: MessageCircle, href: "https://twitter.com" },
          { label: "Website", icon: Globe, href: "/" },
        ].map((social) => (
          <a
            key={social.label}
            href={social.href}
            aria-label={social.label}
            className="liquid-glass rounded-full p-4 text-white/80 transition-all hover:bg-white/5 hover:text-white"
          >
            <social.icon size={20} aria-hidden="true" />
          </a>
        ))}
      </footer>
    </main>
  );
}
