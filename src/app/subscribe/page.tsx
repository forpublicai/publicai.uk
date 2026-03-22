"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 3, [email]);

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
              Subscribe
            </p>
            <h1 className="font-serif text-3xl font-semibold leading-tight">
              Get updates on Public AI
            </h1>
            <p className="text-stone-600 leading-relaxed">
              This demo site includes BBC-style authentication UI. For full
              access to the features, you must sign in via BBC.co.uk.
            </p>
          </div>

          {!submitted ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
              <label className="block">
                <span className="text-sm font-semibold text-stone-700">
                  Email address
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#f0442c] focus:ring-offset-0"
                />
              </label>
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full inline-flex items-center justify-center rounded-full bg-[#f0442c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#d33a24] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue (demo)
              </button>
              <p className="text-xs text-stone-500">
                Demo only: no email is sent.
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2">
                <p className="font-semibold text-stone-900">
                  Subscription created (demo)
                </p>
                <p className="text-sm text-stone-600">
                  Next: sign in via BBC.co.uk to unlock the full Public AI
                  examples.
                </p>
              </div>
              <a
                href="/sign-in"
                className="w-full inline-flex items-center justify-center rounded-full bg-[#f0442c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#d33a24]"
              >
                Sign in to unlock features
              </a>
              <a
                href="/"
                className="w-full inline-flex items-center justify-center rounded-full border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                Back to site
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

