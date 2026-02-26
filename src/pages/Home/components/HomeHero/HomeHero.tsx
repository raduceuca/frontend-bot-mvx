import heroBg from 'assets/img/hero-underwater-bg.png';
import { CreateJob } from 'pages/Dashboard/widgets/CreateJob/CreateJob';

// ── Component ─────────────────────────────────────────────────────

export const HomeHero = () => (
  <div className='flex flex-col gap-6 w-full'>
    {/* Full-bleed hero banner */}
    <div className='relative left-1/2 -translate-x-1/2 w-screen overflow-hidden'>
      {/* Background image */}
      <div
        className='absolute inset-0'
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      {/* Gradient overlay — fades image into body background */}
      <div
        className='absolute inset-0'
        style={{
          background:
            'linear-gradient(to bottom, color-mix(in srgb, var(--bg-0) 15%, transparent) 0%, color-mix(in srgb, var(--bg-0) 35%, transparent) 40%, color-mix(in srgb, var(--bg-0) 75%, transparent) 70%, var(--bg-0) 100%)'
        }}
      />

      {/* Hero content */}
      <div className='relative z-10 flex flex-col items-center gap-6 px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16 lg:pt-28 lg:pb-20 max-w-4xl mx-auto'>
        <h1 className='text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-[-0.03em] text-zinc-50 text-center'>
          Give an AI a wallet; see what happens.
        </h1>
      </div>
    </div>

    {/* Unified chat interface */}
    <CreateJob />
  </div>
);
