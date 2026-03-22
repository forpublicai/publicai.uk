"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const [isDemoSignedIn, setIsDemoSignedIn] = useState(false);

  useEffect(() => {
    const v = window.localStorage.getItem("publicai_demo_signed_in");
    setIsDemoSignedIn(v === "1");
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-3">
          <a href="/" className="flex items-center gap-3">
            <div className="relative h-8 w-32 overflow-hidden rounded-sm">
              <Image
                src="/public-AI-logo.png"
                alt="Public AI"
                fill
                className="object-contain"
                priority
              />
            </div>
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f0442c]">
              Sign in
            </p>
            <h1 className="font-serif text-3xl font-semibold leading-tight">
              Access Public AI with your BBC account
            </h1>
            <p className="text-stone-600 leading-relaxed">
              This demo mimics BBC/iPlayer login UX. In this prototype, we
              simulate authentication by setting a local demo flag.
            </p>
          </div>

          {isDemoSignedIn ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2">
                <p className="font-semibold text-stone-900">
                  You are signed in (demo)
                </p>
                <p className="text-sm text-stone-600">
                  Full BBC-grounded examples and guidance are unlocked on the
                  homepage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.localStorage.setItem("publicai_demo_signed_in", "0");
                  window.location.href = "/";
                }}
                className="w-full inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
              >
                Sign out (demo)
              </button>
              <a
                href="/"
                className="w-full inline-flex items-center justify-center rounded-full bg-[#f0442c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#d33a24]"
              >
                Back to site
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2 text-sm text-stone-700">
                <p className="font-semibold text-stone-900">Demo flow</p>
                <p>
                  In a real product, this button would redirect you to
                  <span className="font-semibold"> BBC.co.uk sign-in</span> and
                  unlock features after authentication.
                </p>
                <p className="text-xs text-stone-500">
                  Prototype note: no BBC OAuth is implemented in this demo.
                </p>
              </div>
              <a
                href="https://www.bbc.co.uk/signin"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
              >
                Continue at BBC.co.uk (opens new tab)
              </a>
              <button
                type="button"
                onClick={() => {
                  window.localStorage.setItem("publicai_demo_signed_in", "1");
                  window.location.href = "/";
                }}
                className="w-full inline-flex items-center justify-center rounded-full bg-[#f0442c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#d33a24]"
              >
                Sign in as BBC user (demo unlock)
              </button>
              <a
                href="/"
                className="w-full inline-flex items-center justify-center rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Not now
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

