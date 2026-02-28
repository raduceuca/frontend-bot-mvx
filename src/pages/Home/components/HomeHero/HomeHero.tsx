import { motion } from 'motion/react';
import heroBg from 'assets/img/hero-underwater-bg.webp';
import { CreateJob } from 'pages/Dashboard/widgets/CreateJob/CreateJob';

// ── Component ─────────────────────────────────────────────────────

export const HomeHero = () => (
  <div className='relative flex flex-col w-full'>
    {/* Background image — full viewport width, native 16:9 aspect ratio.
         Uses mask-image to fade the bottom to transparent, revealing
         whatever background is behind it (no color-matching needed). */}
    <div
      className='absolute inset-x-0 top-0 w-screen left-1/2 -translate-x-1/2'
      style={{
        aspectRatio: '16 / 9',
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, black 50%, transparent 100%)'
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
