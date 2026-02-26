import {
  faBolt,
  faBrain,
  faComments,
  faWallet
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import maxAvatar from 'assets/img/max-avatar.png';
import mysteryBoxBg from 'assets/img/token-safari-bg.png';
import { useGetIsLoggedIn } from 'lib';
import { RouteNamesEnum } from 'localConstants';

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

export const HomeCapabilities = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (isLoggedIn) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(RouteNamesEnum.unlock);
    }
  };

  return (
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

    {/* Mystery Box CTA */}
    <div className='relative rounded-2xl overflow-hidden'>
      {/* Background image — full, no blur */}
      <img
        src={mysteryBoxBg}
        alt=''
        className='absolute inset-0 w-full h-full object-cover'
      />
      {/* Gradient overlay — bottom-heavy for text readability */}
      <div className='absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent' />

      {/* Content — positioned over the image */}
      <div className='relative z-10 flex flex-col gap-5 p-6 sm:p-8 pt-32 sm:pt-40'>
        {/* Badge */}
        <div className='flex items-center gap-2'>
          <span className='text-sm font-mono font-semibold text-teal/80 uppercase tracking-wider bg-zinc-950/60 px-2.5 py-1 rounded-md'>
            Experiment
          </span>
        </div>

        {/* Title + description */}
        <div className='flex flex-col gap-2 max-w-lg'>
          <h3 className='text-2xl sm:text-3xl font-semibold text-zinc-50 tracking-tight'>
            Mystery Box
          </h3>
          <p className='text-base text-zinc-300 leading-relaxed'>
            Send 1 EGLD. Max picks a surprise mix of tokens from the DEX and
            sends them straight to your wallet. No strategy, no promises — just
            curiosity on devnet.
          </p>
        </div>

        {/* Flow steps */}
        <div className='flex items-center flex-wrap gap-x-3 gap-y-1.5 text-base'>
          <span className='font-mono text-zinc-400'>You send EGLD</span>
          <span className='text-teal/60'>&rarr;</span>
          <span className='font-mono text-zinc-400'>Max buys tokens</span>
          <span className='text-teal/60'>&rarr;</span>
          <span className='font-mono text-zinc-400'>
            Tokens land in your wallet
          </span>
        </div>

        {/* CTA */}
        <div className='flex items-center gap-3 pt-1'>
          <button
            onClick={handleCTA}
            className='flex items-center gap-2 px-5 py-2.5 bg-teal hover:bg-teal/80 text-zinc-950 font-medium text-base rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30'
          >
            {isLoggedIn ? (
              <>
                <img
                  src={maxAvatar}
                  alt=''
                  className='w-5 h-5 rounded-sm'
                />
                Start a job with Max
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faWallet} />
                Connect wallet to try
              </>
            )}
          </button>
          <span className='text-base text-zinc-500'>1 EGLD per run</span>
        </div>
      </div>
    </div>
  </div>
  );
};
