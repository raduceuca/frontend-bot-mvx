import {
  faBolt,
  faPaperPlane,
  faSpinner,
  faWallet
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { JobPhase } from '../createJob.types';

interface ChatInputBarProps {
  isLoggedIn: boolean;
  jobId: string | null;
  isBusy: boolean;
  prompt: string;
  phase: JobPhase;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onPromptChange: (val: string) => void;
  onSendPrompt: () => void;
  onCreateJob: () => void;
  onConnect: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const ChatInputBar = ({
  isLoggedIn,
  jobId,
  isBusy,
  prompt,
  phase,
  textareaRef,
  onPromptChange,
  onSendPrompt,
  onCreateJob,
  onConnect,
  onKeyDown
}: ChatInputBarProps) => (
  <div className='px-3 xs:px-4 sm:px-5 pb-3 sm:pb-4 pt-1'>
    {!isLoggedIn ? (
      <button
        onClick={onConnect}
        className='w-full flex items-center gap-2 xs:gap-3 bg-zinc-950 border border-zinc-700/50 rounded-xl px-3 xs:px-4 py-2.5 xs:py-3 cursor-pointer hover:border-zinc-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 min-h-[44px]'
      >
        <span className='flex-1 text-base text-zinc-500 text-left'>
          Connect wallet to talk to Max&hellip;
        </span>
        <div className='shrink-0 w-10 h-10 bg-teal/20 text-teal rounded-lg flex items-center justify-center'>
          <FontAwesomeIcon icon={faWallet} />
        </div>
      </button>
    ) : !jobId ? (
      <button
        onClick={onCreateJob}
        disabled={phase === 'creating'}
        className='w-full flex items-center gap-2 xs:gap-3 bg-zinc-950 border border-zinc-700/50 rounded-xl px-3 xs:px-4 py-2.5 xs:py-3 cursor-pointer hover:border-zinc-600 transition-colors duration-150 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 min-h-[44px]'
      >
        <span className='flex-1 text-base text-zinc-500 text-left'>
          Start a chat with Max&hellip;
        </span>
        <div className='shrink-0 w-10 h-10 bg-teal/20 text-teal rounded-lg flex items-center justify-center'>
          <FontAwesomeIcon icon={faBolt} />
        </div>
      </button>
    ) : (
      <div className='flex items-end gap-2 xs:gap-3 bg-zinc-950 border border-zinc-700/50 rounded-xl px-3 xs:px-4 py-2.5 xs:py-3 focus-within:border-teal/40 focus-within:ring-2 focus-within:ring-teal/20 transition-colors duration-150'>
        <label htmlFor='agent-prompt' className='sr-only'>
          Message to Max
        </label>
        <textarea
          id='agent-prompt'
          ref={textareaRef}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          className='flex-1 bg-transparent border-none p-0 text-base text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-0 resize-none leading-relaxed max-h-32 overflow-y-auto custom-scrollbar'
          placeholder='Tell Max what to do&hellip;'
        />
        <button
          disabled={isBusy || !prompt.trim()}
          onClick={onSendPrompt}
          aria-label='Send message'
          className='shrink-0 w-10 h-10 bg-teal hover:bg-teal/80 text-zinc-950 rounded-lg flex items-center justify-center transition-colors duration-150 disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30'
        >
          {isBusy ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faPaperPlane} />
          )}
        </button>
      </div>
    )}
  </div>
);
