'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function MarketingLanding() {
  const router = useRouter();

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Top Left Logo */}
      <div className="absolute top-6 left-8 z-50">
        <h1 className="text-2xl font-bold text-gray-400 tracking-wider">MORV AI</h1>
        <p className="text-xs text-gray-600 mt-1">Military CMMS System</p>
      </div>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black" />
      
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-scroll 20s linear infinite'
        }} />
      </div>

      {/* Upper half - Old TV with video */}
      <div className="absolute top-0 left-0 right-0 h-[55%] flex items-center justify-center p-8">
        <div className="relative max-w-5xl w-full">
          {/* Vintage TV Frame - CSS Based */}
          <div className="relative flex items-stretch bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl shadow-2xl border-8 border-black p-6">
            {/* Left side - TV Screen */}
            <div className="flex-1 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 shadow-inner">
              {/* Screen Bezel */}
              <div className="relative bg-black rounded-xl p-3 shadow-2xl border-4 border-gray-700">
                {/* CRT Screen Effect */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                {/* Scanlines overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none opacity-20" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.3) 2px, rgba(0, 0, 0, 0.3) 4px)',
                  animation: 'scanlines 8s linear infinite'
                }} />
                
                {/* CRT curve effect */}
                <div className="absolute inset-0 z-10 pointer-events-none" style={{
                  background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.6) 100%)',
                  boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.9)'
                }} />

                {/* Screen flicker */}
                <div className="absolute inset-0 z-10 pointer-events-none bg-white opacity-0" style={{
                  animation: 'flicker 3s infinite'
                }} />

                {/* Video */}
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'contrast(1.1) brightness(0.9)' }}
                >
                  <source src="/videos/morv-demo.mp4" type="video/mp4" />
                  {/* Fallback: Replace with actual video URL */}
                  {/* For now, showing a placeholder */}
                </video>

                {/* If video doesn't exist, show animated placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-indigo-900/50">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-blue-300 text-sm font-medium">System Diagnostics Running...</p>
                      <div className="space-y-2">
                        <div className="h-2 bg-blue-500/30 rounded-full w-64 mx-auto overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '75%' }} />
                        </div>
                        <p className="text-blue-400/70 text-xs font-mono">Analyzing 847 components...</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Static noise overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none opacity-5" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
                  animation: 'noise 0.2s steps(10) infinite'
                }} />
              </div>
            </div>
          </div>
          
          {/* Right side - Control Panel */}
          <div className="w-48 bg-gradient-to-b from-gray-800 via-gray-900 to-black rounded-2xl shadow-inner ml-6 p-6 flex flex-col items-center justify-center gap-8">
            {/* Speaker Grille */}
            <div className="w-full h-24 rounded-lg overflow-hidden">
              <div className="w-full h-full" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.8) 0px, rgba(0,0,0,0.8) 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
              }} />
            </div>

            {/* Control Panel Plate */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-6 shadow-lg border-2 border-gray-700 w-full">
              {/* Top Knob */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 shadow-lg border-4 border-gray-900 flex items-center justify-center">
                  <div className="absolute w-1 h-6 bg-black rounded-full top-2" />
                  <div className="text-xs text-gray-400 font-bold">CH</div>
                </div>
                <div className="flex gap-2 mt-2">
                  {[1,2,3,4,5,6,7].map((n) => (
                    <div key={n} className="w-0.5 h-2 bg-gray-600 rounded-full" />
                  ))}
                </div>
              </div>

              {/* Bottom Knob */}
              <div className="flex flex-col items-center">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 shadow-lg border-4 border-gray-900 flex items-center justify-center">
                  <div className="absolute w-1 h-6 bg-black rounded-full top-2" />
                  <div className="text-xs text-gray-400 font-bold">VOL</div>
                </div>
                <div className="flex gap-2 mt-2">
                  {[1,2,3,4,5,6,7].map((n) => (
                    <div key={n} className="w-0.5 h-2 bg-gray-600 rounded-full" />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Speaker Grille */}
            <div className="w-full h-16 rounded-lg overflow-hidden">
              <div className="w-full h-full" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.8) 0px, rgba(0,0,0,0.8) 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
              }} />
            </div>
          </div>
        </div>

        {/* TV Legs */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3/4 flex justify-between px-12">
          <div className="w-20 h-8 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-lg" />
          <div className="w-20 h-8 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-lg" />
        </div>
      </div>
    </div>

      {/* Lower portion - Catchphrase and CTA with more spacing */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] flex flex-col items-center justify-start p-8 pt-16 space-y-12">
        {/* Catchphrase */}
        <div className="text-center space-y-4 w-full">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gray-400">
            Maximum readiness.
          </h1>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-500">
            Zero downtime.
          </h2>
        </div>

        {/* CTA Button - Centered */}
        <div className="flex justify-center w-full">
          <button
            onClick={() => router.push('/twin')}
            className="group relative px-12 py-6 bg-black hover:bg-gray-900 text-gray-300 hover:text-white text-xl font-bold rounded-lg shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
          >
          {/* Button subtle glow effect */}
          <div className="absolute inset-0 bg-gray-800 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300" />
          
          {/* Button content - Centered */}
          <div className="relative flex items-center justify-center gap-3">
            <span>Try Us Now</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
          </div>

          {/* Subtle shimmer effect */}
          <div className="absolute inset-0 -top-full bg-gradient-to-b from-transparent via-gray-700/10 to-transparent group-hover:top-full transition-all duration-700" />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-gray-600 text-sm md:text-base max-w-2xl text-center pb-8 w-full">
          AI-powered predictive maintenance for military assets. Keep your fleet mission-ready, always.
        </p>
      </div>

      <style jsx>{`
        @keyframes grid-scroll {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(50px);
          }
        }

        @keyframes scanlines {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(4px);
          }
        }

        @keyframes flicker {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.02;
          }
        }

        @keyframes noise {
          0%, 100% {
            transform: translate(0, 0);
          }
          10% {
            transform: translate(-5%, -5%);
          }
          20% {
            transform: translate(-10%, 5%);
          }
          30% {
            transform: translate(5%, -10%);
          }
          40% {
            transform: translate(-5%, 15%);
          }
          50% {
            transform: translate(-10%, 5%);
          }
          60% {
            transform: translate(15%, 0);
          }
          70% {
            transform: translate(0, 10%);
          }
          80% {
            transform: translate(-15%, 0);
          }
          90% {
            transform: translate(10%, 5%);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes gradient-reverse {
          0%, 100% {
            background-position: 100% 50%;
          }
          50% {
            background-position: 0% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }

        .animate-gradient-reverse {
          background-size: 200% auto;
          animation: gradient-reverse 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
