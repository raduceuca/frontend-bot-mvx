import { motion } from 'motion/react';
import heroBg from 'assets/img/hero-underwater-bg.png';
import { CreateJob } from 'pages/Dashboard/widgets/CreateJob/CreateJob';

// ── Component ─────────────────────────────────────────────────────

export const HomeHero = () => (
  <div className='relative flex flex-col w-full'>
    {/* Background image — covers top portion only, not full chat height */}
    <div
      className='absolute top-0 left-1/2 -translate-x-1/2 w-screen h-[60%]'
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top'
      }}
    />
    {/* Gradient overlay — fades image out before it reaches the chat */}
    <div
      className='absolute top-0 left-1/2 -translate-x-1/2 w-screen h-[60%]'
      style={{
        background:
          'linear-gradient(to bottom, color-mix(in srgb, var(--bg-0) 10%, transparent) 0%, color-mix(in srgb, var(--bg-0) 25%, transparent) 30%, color-mix(in srgb, var(--bg-0) 55%, transparent) 60%, var(--bg-0) 100%)'
      }}
    />

    {/* Hero headline */}
    <div className='relative z-10 flex flex-col items-center gap-4 px-4 sm:px-6 pt-14 sm:pt-20 pb-10 sm:pb-14 lg:pt-28 lg:pb-16 max-w-4xl mx-auto'>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className='text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-zinc-50 text-center leading-[1.1]'
      >
        Give an AI a wallet; see what happens.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        className='text-base sm:text-lg text-zinc-400 text-center max-w-xl'
      >
        Max trades, swaps, and transacts on MultiversX — you just tell it what to do.
      </motion.p>
    </div>

    {/* Chat interface — sits over the fading background */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
      className='relative z-10'
    >
      <CreateJob />
    </motion.div>
  </div>
);
