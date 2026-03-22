"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const CONSENT_COOKIE = "publicai_demo_consent_v1";

function readCookie(name: string): string | null {
  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const part of parts) {
    const [k, ...rest] = part.split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

export default function DemoConsentGate() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const v = readCookie(CONSENT_COOKIE);
    setHasConsent(v === "1");
  }, []);

  useEffect(() => {
    if (hasConsent === false) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [hasConsent]);

  if (hasConsent === null || hasConsent === true) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/60" aria-hidden />
      <div className="relative flex h-full w-full items-end justify-center p-3 md:items-center md:p-6">
        <div
          className="flex max-h-[min(100%,92vh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:rounded-3xl"
          role="dialog"
          aria-labelledby="consent-title"
          aria-describedby="consent-desc"
        >
          <div className="flex items-center gap-3 border-b border-stone-200 px-5 py-4 md:px-6">
            <div className="relative h-8 w-28 shrink-0 overflow-hidden rounded-sm">
              <Image
                src="/public-AI-logo.png"
                alt="Public AI"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 id="consent-title" className="font-serif text-lg font-semibold text-stone-900">
                Research demo
              </h1>
              <p className="text-xs text-stone-500">Before you enter the site</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 md:px-6">
            <div id="consent-desc" className="space-y-5">
              <p className="text-[15px] leading-relaxed text-stone-700">
                This is a <strong className="font-semibold text-stone-900">prototype</strong> for
                exploring how public AI might work in the UK. It is{" "}
                <strong className="font-semibold text-stone-900">not</strong> a BBC, NHS, or
                government product, and it does not imply endorsement by any institution.
              </p>
              <ul className="space-y-2 text-sm leading-relaxed text-stone-600">
                <li className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f0442c]" aria-hidden />
                  <span>Answers are illustrative — not legal, medical, or professional advice.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f0442c]" aria-hidden />
                  <span>
                    We use a cookie so this notice doesn&apos;t show on every visit. Clear cookies to
                    see it again.
                  </span>
                </li>
              </ul>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <label
                  htmlFor="consent-check"
                  className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-stone-800"
                >
                  <input
                    id="consent-check"
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-[#f0442c] focus:ring-[#f0442c]"
                  />
                  <span>I understand this is a research demo, not an official service.</span>
                </label>

                <button
                  type="button"
                  disabled={!checked}
                  onClick={() => {
                    setCookie(CONSENT_COOKIE, "1", 365 * 24 * 60 * 60);
                    setHasConsent(true);
                  }}
                  className="mt-4 w-full rounded-full bg-[#f0442c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d33a24] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
