interface NetworkBadgeProps {
  networkId: string;
}

export const NetworkBadge = ({ networkId }: NetworkBadgeProps) => (
  <span
    className='relative overflow-hidden text-xs font-mono font-medium uppercase tracking-wider text-amber-400/80 border border-amber-400/15 px-2.5 py-1 rounded-full'
    style={{
      backgroundImage:
        'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(251,191,36,0.04) 3px, rgba(251,191,36,0.04) 6px)'
    }}
  >
    {networkId}
  </span>
);
