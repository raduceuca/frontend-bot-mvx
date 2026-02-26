export const styles = {
  container: 'create-job-container flex flex-col gap-4 w-full mx-auto flex-1',
  card: 'bg-zinc-900/85 backdrop-blur-md border border-zinc-800 rounded-xl overflow-hidden',
  btn: 'px-4 py-2.5 rounded-lg font-medium text-base transition-colors duration-150 disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30',
  badge: 'flex items-center gap-1.5 px-2 py-0.5 rounded-md text-base font-mono',
  input:
    'bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-50 font-mono text-base focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/20 transition-colors duration-150',
  label:
    'text-base font-mono font-normal text-zinc-500 uppercase tracking-wider'
} satisfies Record<string, string>;
