import heroBg from 'assets/img/hero-underwater-bg.png';
import { CreateJob } from 'pages/Dashboard/widgets/CreateJob/CreateJob';

// ── Component ─────────────────────────────────────────────────────

export const HomeHero = () => (
  <div className='relative flex flex-col w-full'>
    {/* Background image — spans the full hero including chat area */}
    <div
      className='absolute inset-0 left-1/2 -translate-x-1/2 w-screen'
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top'
      }}
    />
    {/* Gradient overlay — slow fade across the entire section */}
    <div
      className='absolute inset-0 left-1/2 -translate-x-1/2 w-screen'
      style={{
        background:
          'linear-gradient(to bottom, color-mix(in srgb, var(--bg-0) 10%, transparent) 0%, color-mix(in srgb, var(--bg-0) 30%, transparent) 25%, color-mix(in srgb, var(--bg-0) 60%, transparent) 50%, color-mix(in srgb, var(--bg-0) 85%, transparent) 70%, var(--bg-0) 90%)'
      }}
    />

    {/* Hero headline */}
    <div className='relative z-10 flex flex-col items-center gap-6 px-4 sm:px-6 pt-14 sm:pt-20 pb-10 sm:pb-14 lg:pt-28 lg:pb-16 max-w-4xl mx-auto'>
      <h1 className='text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-[-0.03em] text-zinc-50 text-center'>
        Give an AI a wallet; see what happens.
      </h1>
    </div>

    {/* Chat interface — sits over the fading background */}
    <div className='relative z-10'>
      <CreateJob />
    </div>
  </div>
);
