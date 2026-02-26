import {
  faArrowUpRightFromSquare,
  faCheckCircle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import maxAvatar from 'assets/img/max-avatar.webp';
import { styles } from '../createJob.styles';
import { JobPhase } from '../createJob.types';
import { NetworkBadge } from './NetworkBadge';

const AGENT_PROFILE_URL = 'https://agents.multiversx.com/agent/110';

interface ChatHeaderProps {
  jobId: string | null;
  isBusy: boolean;
  phase: JobPhase;
  isLoggedIn: boolean;
  networkId: string;
  onFinishJob: () => void;
}

export const ChatHeader = ({
  jobId,
  isBusy,
  phase,
  isLoggedIn: _isLoggedIn,
  networkId,
  onFinishJob
}: ChatHeaderProps) => (
  <div className='px-3 xs:px-4 sm:px-5 py-2.5 xs:py-3 border-b border-zinc-800 flex items-center justify-between gap-2'>
    <div className='flex items-center gap-2.5'>
      <div className='relative'>
        <img src={maxAvatar} alt='Max' className='w-10 h-10 rounded-lg' />
        {jobId && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${
              isBusy ? 'bg-warning animate-pulse' : 'bg-success'
            }`}
            aria-hidden='true'
          />
        )}
      </div>
      <div className='flex items-center gap-2'>
        <a
          href={AGENT_PROFILE_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='text-base font-medium text-zinc-50 hover:text-teal transition-colors duration-150'
        >
          Max
          <FontAwesomeIcon
            icon={faArrowUpRightFromSquare}
            className='ml-1.5 text-sm text-zinc-500'
          />
        </a>
        {jobId && !isBusy && (
          <span className='text-sm font-mono text-success/80 bg-success/10 border border-success/15 px-1.5 py-0.5 rounded-md hidden sm:flex items-center gap-1'>
            <span className='w-1 h-1 rounded-full bg-success' />
            Active Job
          </span>
        )}
        {isBusy && (
          <div
            role='status'
            aria-live='polite'
            className={`${styles.badge} bg-warning/10 text-warning border border-warning/20 text-sm`}
          >
            <FontAwesomeIcon icon={faSpinner} spin className='text-sm' />
            {phase === 'creating' && 'Starting'}
            {phase === 'prompting' && 'Thinking'}
            {phase === 'sending_tokens' && 'Sending'}
            {phase === 'swapping' && 'Crawling'}
          </div>
        )}
      </div>
    </div>

    <div className='flex items-center gap-2'>
      <NetworkBadge networkId={networkId} />

      {jobId && (
        <button
          disabled={isBusy}
          onClick={onFinishJob}
          className={`${styles.btn} bg-zinc-800 hover:bg-zinc-700 text-zinc-50 border border-zinc-700`}
        >
          <div className='flex items-center justify-center gap-2'>
            <FontAwesomeIcon icon={faCheckCircle} /> Finish
          </div>
        </button>
      )}
    </div>
  </div>
);
