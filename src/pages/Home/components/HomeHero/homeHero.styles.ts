export default {
  heroContainer:
    'relative flex flex-col items-center justify-center w-full pt-16 pb-20 lg:pt-24 lg:pb-28 px-4',
  heroSectionTop:
    'relative z-10 flex flex-col items-center justify-center gap-6 w-full',
  heroSectionTopContent: 'flex flex-col items-center gap-4 text-center',
  heroTitle:
    'text-4xl lg:text-6xl font-semibold tracking-[-0.03em] text-zinc-50',
  heroDescription: 'text-lg lg:text-xl text-zinc-400 tracking-tight max-w-md',
  heroSectionTopButtons: 'flex items-center gap-3 mt-2'
} satisfies Record<string, string>;
