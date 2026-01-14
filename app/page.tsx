'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AgeGate() {
  const router = useRouter();

  const enterHaven = () => {
    sessionStorage.setItem('haven_18_confirmed', 'true');
    router.push('/haven');
  };

  const exitSite = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <section className="max-w-xl text-center space-y-6">
        <h1 className="text-3xl font-light tracking-wide">
          Haven.ai
        </h1>

        <p className="text-sm opacity-80">
          Haven.ai è uno spazio sicuro creato per offrire riparo dal giudizio della
          società moderna. Un luogo tranquillo dove ognuno può sentirsi libero di
          essere se stesso. Tutte le conversazioni sono private e non vengono
          archiviate. Accesso riservato ai maggiorenni (18+).
        </p>

        <p className="text-sm opacity-70">
          Haven.ai is a safe space created to offer shelter from the judgment of
          modern society. A calm place where everyone can be themselves.
          Conversations are private and not stored. Adults only (18+).
        </p>

        <div className="flex flex-col gap-4 pt-4">
          <button
            onClick={enterHaven}
            className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            Ho 18 anni / I am 18
          </button>

          <button
            onClick={exitSite}
            className="px-6 py-3 rounded-lg text-sm opacity-60 hover:opacity-100 transition"
          >
            Non ho ancora 18 anni / I’m not 18 yet
          </button>
        </div>
      </section>
    </main>
  );
}
