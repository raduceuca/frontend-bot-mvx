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
    <div className='relative z-10 flex flex-col items-center gap-3 xs:gap-5 px-4 sm:px-6 pt-10 xs:pt-16 sm:pt-24 pb-8 xs:pb-10 sm:pb-14 lg:pt-32 lg:pb-16 max-w-5xl mx-auto'>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className='text-2xl xs:text-4xl sm:text-5xl lg:text-7xl font-bold tracking-[-0.04em] text-zinc-50 text-center leading-[1.05]'
      >
        We gave Max a wallet.
        <br />
        What could go wrong?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        className='text-base xs:text-lg sm:text-xl text-zinc-400 text-center max-w-2xl leading-relaxed'
      >
        Tell Max what you want in plain English. He handles the blockchain.
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
