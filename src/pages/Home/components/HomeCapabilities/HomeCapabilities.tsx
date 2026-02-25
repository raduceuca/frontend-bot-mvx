import {
  faBolt,
  faBrain,
  faComments,
  faLeaf
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const capabilities = [
  {
    icon: faBrain,
    title: 'Autonomous Trades',
    description:
      'Reads market data, picks tokens, and executes swaps \u2014 all on its own.'
  },
  {
    icon: faBolt,
    title: 'Execution Engine',
    description:
      'Sends transactions, interacts with smart contracts, manages token transfers.'
  },
  {
    icon: faComments,
    title: 'Chat Interface',
    description:
      'Talk to the agent in plain language. It interprets your intent and acts.'
  }
];

export const HomeCapabilities = () => (
  <div className='flex flex-col gap-8 w-full'>
    <div className='flex flex-col gap-1'>
      <span className='text-base font-mono font-normal text-zinc-500 uppercase tracking-wider'>
        Capabilities
      </span>
      <h2 className='text-lg font-semibold tracking-tight text-zinc-50'>
        What the agent can do
      </h2>
    </div>

    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
      {capabilities.map((cap) => (
        <div
          key={cap.title}
          className='bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3 hover:border-zinc-700 transition-colors duration-100'
        >
          <div className='flex items-center gap-2.5'>
            <div className='w-8 h-8 rounded-md bg-zinc-800 text-emerald-400 flex items-center justify-center text-base'>
              <FontAwesomeIcon icon={cap.icon} />
            </div>
            <h3 className='text-base font-medium text-zinc-50'>{cap.title}</h3>
          </div>
          <p className='text-base text-zinc-400 leading-relaxed'>
            {cap.description}
          </p>
        </div>
      ))}
    </div>

    {/* Token Safari callout */}
    <div className='bg-emerald-900/20 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-4'>
      <div className='w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg shrink-0'>
        <FontAwesomeIcon icon={faLeaf} />
      </div>
      <div className='flex-1 flex flex-col gap-1'>
        <div className='flex items-center gap-2'>
          <span className='text-base font-medium text-emerald-400'>
            Token Safari
          </span>
          <span className='text-base font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded'>
            Try it
          </span>
        </div>
        <p className='text-base text-zinc-400 leading-relaxed'>
          Send 1 EGLD. The agent explores trending tokens on devnet, picks
          5\u201310, splits your EGLD across them, and sends the finds to your
          wallet.
        </p>
      </div>
    </div>
  </div>
);
