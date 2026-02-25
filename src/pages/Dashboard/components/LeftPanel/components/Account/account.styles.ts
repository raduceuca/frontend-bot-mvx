export default {
  container: 'flex flex-col',
  row: 'flex h-14 gap-2 items-center',
  iconBox:
    'min-w-10 min-h-10 max-h-10 max-w-10 flex items-center justify-center text-tertiary border border-secondary rounded-lg overflow-hidden p-1.5 transition-all duration-200 ease-out',
  icon: 'w-6 h-6',
  xLogo: 'fill-primary w-6 h-6 transition-all duration-200 ease-out',
  text: 'truncate flex flex-col max-w-[80%]',
  value: 'text-primary text-base transition-all duration-200 ease-out'
} satisfies Record<string, string>;
