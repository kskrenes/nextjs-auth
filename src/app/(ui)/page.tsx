"use client";

import BackgroundContainer from "@/components/background-container";
import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";

const features = [
  "Email/password authentication",
  "Google OAuth authentication",
  "Multifactor authentication",
  "Passkeys",
  "Protected routes and pages",
  "Session management",
  "Email verification",
  "Profile management",
];

export default function Home() {

  const router = useRouter();

  return (
    <div className="flex min-h-screen font-sans">
      <BackgroundContainer>
        <div className="w-full sm:max-w-[80%] lg:max-w-[58%] xl:max-w-[52%]">

          {/* Eyebrow */}
          <p className="text-xs font-semibold uppercase tracking-widest text-landing-highlight mb-4">
            Open-source reference implementation
          </p>

          {/* Title */}
          <h1
            className="text-landing mb-6 leading-tight text-[clamp(1.75rem,4vw,3rem)] font-bold"
          >
            Authentication built with{" "}
            <span className="text-landing-highlight">Next.js</span> and{" "}
            <span className="text-landing-highlight">React Context</span>
          </h1>

          {/* Body — desktop: intro + list; mobile: single paragraph */}
          <div 
            className="text-landing-body font-medium mb-10 text-[clamp(0.95rem, 1.5vw, 1.1rem)] leading-[1.7]" 
          >

            {/* Desktop: intro line + feature list */}
            <div className="hidden sm:block">
              <p className="mb-5">
                A secure JSON Web Token authentication example, including:
              </p>
              <ul className="space-y-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="list-bullet">
                      <Check className="w-3 h-3 text-landing-highlight" strokeWidth={2.5} />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile: condensed prose */}
            <p className="sm:hidden">
              A secure JSON Web Token authentication example, including OAuth,
              multifactor authentication, passkeys, protected routes, session
              management, account verification, profile management, and more.
            </p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="button-cta"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Sign-in nudge */}
          <p className="mt-5 text-sm text-landing-muted">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-landing-highlight hover:text-landing-hover font-medium transition-colors underline underline-offset-2 cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </BackgroundContainer>
    </div>
  );
}
