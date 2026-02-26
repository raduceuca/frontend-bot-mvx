import { faBolt, faBrain, faComments } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import maxAvatar from 'assets/img/max-avatar.png';
import mysteryBoxBg from 'assets/img/token-safari-bg.png';

const capabilities = [
  {
    icon: faBrain,
    title: 'Autonomous Trades',
    description:
      'Scans the market, picks tokens, and executes swaps — without asking permission.'
  },
  {
    icon: faBolt,
    title: 'On-Chain Execution',
    description:
      'Signs transactions, calls smart contracts, and moves tokens. Max handles the blockchain so you don\u2019t have to.'
  },
  {
    icon: faComments,
    title: 'Natural Language',
    description:
      'Tell Max what you want in plain English. No transaction builders, no hex data.'
  }
];

export const HomeCapabilities = () => (
  <div className='flex flex-col gap-8 w-full relative pt-10 sm:pt-16'>
    {/* Capabilities header + cards — normal flow */}
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col gap-1 items-center text-center'>
        <span className='text-base font-mono font-normal text-zinc-500 uppercase tracking-wider'>
          Capabilities
        </span>
        <h2 className='text-lg font-semibold tracking-tight text-zinc-50'>
          What Max can do
        </h2>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
        {capabilities.map((cap) => (
          <div
            key={cap.title}
            className='bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 flex flex-col gap-3 hover:border-zinc-700 transition-colors duration-150'
          >
            <div className='flex items-center gap-2.5'>
              <div className='w-8 h-8 rounded-lg bg-zinc-800 text-teal flex items-center justify-center text-base'>
                <FontAwesomeIcon icon={cap.icon} />
              </div>
              <h3 className='text-base font-medium text-zinc-50'>
                {cap.title}
              </h3>
            </div>
            <p className='text-base text-zinc-400 leading-relaxed'>
              {cap.description}
            </p>
          </div>
        ))}
      </div>
    </div>

    {/*
      Mystery Box callout — bigger, more visual.
      The background image overflows and bleeds into the bottom of the page.
    */}
    <div className='relative -mx-4 sm:-mx-6 px-4 sm:px-6'>
      {/* Background image — contained within the callout area */}
      <div
        className='absolute inset-0'
        style={{
          backgroundImage: `url(${mysteryBoxBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top'
        }}
      >
        <div className='absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/60 to-zinc-950' />
      </div>

      {/* Card content */}
      <div className='relative z-10 rounded-xl border border-teal/20 overflow-hidden p-5 sm:p-8 flex flex-col gap-4 bg-zinc-950/40 backdrop-blur-sm'>
        {/* Top row: icon + badge */}
        <div className='flex items-center gap-3'>
          <img
            src={maxAvatar}
            alt='Max'
            className='w-11 h-11 rounded-lg shrink-0'
          />
          <div className='flex flex-col gap-0.5'>
            <div className='flex items-center gap-2'>
              <span className='text-lg font-semibold text-teal tracking-tight'>
                Mystery Box
              </span>
              <span className='text-base font-mono text-warning bg-warning/10 px-1.5 py-0.5 rounded-md'>
                Experiment
              </span>
            </div>
            <span className='text-base text-zinc-500 font-mono'>
              1 EGLD per run
            </span>
          </div>
        </div>

        {/* Description */}
        <p className='text-base text-zinc-300 leading-relaxed max-w-lg'>
          Send 1 EGLD. Max buys a surprise mix of tokens and sends them straight
          to your wallet. No guarantees, no strategy — just curiosity on devnet.
        </p>

        {/* Visual hint — mini preview of what happens */}
        <div className='flex items-center flex-wrap gap-x-2 gap-y-1 text-base text-zinc-500'>
          <span className='font-mono'>You send EGLD</span>
          <span className='text-teal/60'>&rarr;</span>
          <span className='font-mono'>Max buys tokens</span>
          <span className='text-teal/60'>&rarr;</span>
          <span className='font-mono'>Tokens land in your wallet</span>
        </div>
      </div>

      <div className='h-6' />
    </div>
  </div>
);
