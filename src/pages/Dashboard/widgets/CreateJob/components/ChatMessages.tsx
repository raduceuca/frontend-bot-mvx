import {
  faArrowUpRightFromSquare,
  faBolt,
  faSpinner,
  faTimesCircle,
  faWallet
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import maxAvatar from 'assets/img/max-avatar.webp';
import { styles } from '../createJob.styles';
import {
  ChatMessage,
  JobPhase,
  ToastData,
  TrackedTransaction
} from '../createJob.types';
import { TransactionActivityBar } from './TransactionActivityBar';
import { TransactionToast } from './TransactionToast';

const AGENT_PROFILE_URL = 'https://agents.multiversx.com/agent/111';

/** Normalize agent markdown for display: paragraph breaks, table newlines, step headers. */
const normalizeAgentMarkdown = (raw: string): string => {
  if (!raw?.trim()) return raw;
  let s = raw;
  // Sentence boundaries: after . ! ? followed by space and capital letter, add paragraph break
  s = s.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');
  // Run-on sentences: "!Got" or "?Really" with no space -> add paragraph break
  s = s.replace(/([!?])([A-Z])/g, '$1\n\n$2');
  // Table: ensure newline before separator row (| |------- -> |\n|-------)
  s = s.replace(/ \|\s+\|(?=\s*[-|])/g, ' |\n|');
  // Step / list headers on their own line (e.g. "textStep 1:" -> "text\n\nStep 1:")
  s = s.replace(/([^\n])(Step \d+:)/g, '$1\n\n$2');
  s = s.replace(/([^\n])(My token picks:)/g, '$1\n\n$2');
  s = s.replace(/([^\n])(Why I chose)/g, '$1\n\n$2');
  // Fix "Step 1:**" / "Step 2:**" (stray ** after step header) -> "Step 1:" / "Step 2:"
  s = s.replace(/(Step \d+):\*\*/g, '$1:');
  // Remove orphan "**" at line end/start (unpaired bold markers)
  s = s.replace(/\*\*\s*$/gm, '');
  s = s.replace(/^\s*\*\*/gm, '');
  // Ensure space after colon when missing (e.g. "EGLD:Wrapped" -> "EGLD: Wrapped"), skip "://"
  s = s.replace(/:(?!\/\/)([A-Za-z0-9])/g, ': $1');
  return s;
};

interface ChatMessagesProps {
  isLoggedIn: boolean;
  jobId: string | null;
  phase: JobPhase;
  isBusy: boolean;
  messages: ChatMessage[];
  amount: string;
  isDevnet: boolean;
  needsFunds: boolean;

  toasts: ToastData[];
  trackedTransactions: TrackedTransaction[];
  explorerAddress: string;
  previousSessionsTotal: number;

  onConnect: () => void;
  onCreateJob: () => void;
  onShowFaucet: () => void;
  onDismissToast: (id: string) => void;

  chatContainerRef: React.RefObject<HTMLDivElement>;
}

export const ChatMessages = ({
  isLoggedIn,
  jobId,
  phase,
  isBusy,
  messages,
  amount,
  isDevnet,
  needsFunds,
  toasts,
  trackedTransactions,
  explorerAddress,
  previousSessionsTotal,
  onConnect,
  onCreateJob,
  onShowFaucet,
  onDismissToast,
  chatContainerRef
}: ChatMessagesProps) => (
  <>
    {/* Transaction Activity Bar */}
    {trackedTransactions.length > 0 && (
      <TransactionActivityBar
        transactions={trackedTransactions}
        explorerAddress={explorerAddress}
      />
    )}

    {/* Messages / Empty State */}
    <div
      ref={chatContainerRef}
      role='log'
      aria-live='polite'
      aria-label='Chat with Max'
      className='flex-1 overflow-y-auto custom-scrollbar px-3 xs:px-4 sm:px-5 pt-3 xs:pt-4 pb-24 flex flex-col gap-3'
    >
      {/* Transaction confirmation toasts */}
      {toasts.length > 0 && (
        <TransactionToast
          toasts={toasts}
          explorerAddress={explorerAddress}
          onDismiss={onDismissToast}
        />
      )}

      {!isLoggedIn ? (
        /* State 1: Not logged in -- Connect Wallet CTA */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className='flex-1 flex flex-col items-center justify-center gap-4 xs:gap-5 py-8 xs:py-12'
        >
          {/* Agent profile card with OG-style background */}
          <a
            href={AGENT_PROFILE_URL}
            target='_blank'
            rel='noopener noreferrer'
            aria-label="View Max's agent profile on MultiversX (opens in new tab)"
            className='group relative w-full max-w-[280px] xs:max-w-xs overflow-hidden rounded-xl border border-zinc-700/40 hover:border-teal/30 transition-all duration-200 bg-zinc-900'
          >
            <img
              src='/preview-card.webp'
              alt=''
              loading='eager'
              className='absolute inset-0 w-full h-full object-cover'
              aria-hidden='true'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/30' />
            <div className='relative flex items-end gap-3 px-4 pt-16 pb-4'>
              <img
                src={maxAvatar}
                alt='Max'
                className='w-11 h-11 rounded-lg shrink-0 ring-2 ring-zinc-800/80'
              />
              <div className='flex flex-col min-w-0'>
                <span className='text-sm font-semibold text-zinc-50 leading-none'>
                  Max
                </span>
                <span className='text-sm text-zinc-400 leading-none mt-0.5'>
                  AI Agent on MultiversX
                </span>
              </div>
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className='w-2.5 h-2.5 text-zinc-500 group-hover:text-teal transition-colors duration-150 ml-auto shrink-0 mb-0.5'
                aria-hidden='true'
              />
            </div>
          </a>

          <div className='text-center'>
            <p className='text-base font-medium text-zinc-50'>Max is ready</p>
            <p className='text-sm text-zinc-500 max-w-xs mx-auto mt-1'>
              Connect your wallet to get started. Devnet only, no real money.
            </p>
          </div>

          <button
            type='button'
            onClick={onConnect}
            className={`${styles.btn} bg-teal hover:bg-teal/80 text-zinc-950 flex items-center justify-center gap-2 min-h-[44px]`}
          >
            <FontAwesomeIcon icon={faWallet} /> Connect Wallet
          </button>
        </motion.div>
      ) : !jobId ? (
        /* State 2: Logged in, no active job -- Start Chat CTA */
        <div className='flex-1 flex flex-col items-center justify-center gap-4 py-8'>
          <img
            src={maxAvatar}
            alt='Max'
            className='w-12 h-12 rounded-xl opacity-60'
          />
          <div className='text-center'>
            <p className='text-base font-medium text-zinc-50'>
              Start a chat with Max
            </p>
            <p className='text-base text-zinc-500 max-w-sm mx-auto mt-1'>
              Pay {amount} xEGLD to activate Max. Ask anything, trigger swaps,
              or try a Mystery Box.
            </p>
            {isDevnet && (
              <p className='text-sm text-zinc-600 max-w-sm mx-auto mt-1.5'>
                Devnet — test tokens only, no real money.
                {needsFunds && (
                  <>
                    {' '}
                    <button
                      onClick={onShowFaucet}
                      className='text-teal hover:text-teal/80 transition-colors duration-150 cursor-pointer'
                    >
                      Get free xEGLD from the faucet.
                    </button>
                  </>
                )}
              </p>
            )}
          </div>

          {/* Error from a failed job creation attempt */}
          {phase === 'error' &&
            messages.filter((m) => m.isError).length > 0 && (
              <div
                role='alert'
                className='flex items-center gap-2 text-sm text-error max-w-sm text-center'
              >
                <FontAwesomeIcon icon={faTimesCircle} className='shrink-0' />
                <span>
                  {messages.filter((m) => m.isError).pop()?.content}
                </span>
              </div>
            )}

          <button
            disabled={phase === 'creating'}
            onClick={onCreateJob}
            className={`${styles.btn} bg-teal hover:bg-teal/80 text-zinc-950 min-w-[180px] xs:min-w-[200px] min-h-[44px]`}
          >
            {phase === 'creating' ? (
              <div className='flex items-center justify-center gap-2'>
                <FontAwesomeIcon icon={faSpinner} spin /> Starting&hellip;
              </div>
            ) : (
              <div className='flex items-center justify-center gap-2'>
                <FontAwesomeIcon icon={faBolt} />{' '}
                {phase === 'error' ? 'Try again' : 'Start chat'} &middot;{' '}
                {amount} xEGLD
              </div>
            )}
          </button>

          {/* Previous sessions link */}
          {previousSessionsTotal > 0 && (
            <button
              onClick={() =>
                document
                  .getElementById('previous-sessions')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className='text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 cursor-pointer'
            >
              You have{' '}
              <span className='text-zinc-300'>{previousSessionsTotal}</span>{' '}
              previous {previousSessionsTotal === 1 ? 'session' : 'sessions'}{' '}
              &darr;
            </button>
          )}
        </div>
      ) : (
        /* State 3: Active job -- messages or idle */
        <>
          {messages.length === 0 && (
            <div className='flex-1 flex items-center justify-center py-12'>
              <span className='text-base text-zinc-500'>
                Max is standing by
              </span>
            </div>
          )}

          {messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className='flex justify-end max-w-[92%] xs:max-w-[88%] sm:max-w-[80%] ml-auto'
                >
                  <div className='bg-zinc-800 text-zinc-50 rounded-2xl rounded-tr-md px-3 xs:px-5 py-2.5 xs:py-3 text-base prose prose-invert prose-sm prose-p:my-1 prose-headings:my-2 prose-code:text-teal max-w-none min-w-0 overflow-hidden break-words'>
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </motion.div>
              );
            }

            if (msg.role === 'agent') {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className='flex justify-start gap-2 xs:gap-3 max-w-[95%] sm:max-w-[80%]'
                >
                  <img
                    src={maxAvatar}
                    alt=''
                    className='w-8 h-8 shrink-0 mt-1 rounded-lg'
                  />
                  <div className='bg-zinc-800 border border-zinc-700/50 text-zinc-50 rounded-2xl rounded-tl-md px-3 xs:px-5 py-3 xs:py-4 text-base prose prose-invert prose-sm prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:text-teal prose-a:text-teal prose-a:no-underline hover:prose-a:underline prose-table:my-2 prose-table:block prose-table:overflow-x-auto prose-th:border prose-th:border-zinc-600 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-zinc-600 prose-td:px-3 prose-td:py-2 max-w-none min-w-0 overflow-hidden break-words'>
                    <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                      {normalizeAgentMarkdown(msg.content)}
                    </Markdown>
                  </div>
                </motion.div>
              );
            }

            // System message
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className='flex justify-center'
              >
                <div
                  role={msg.isError ? 'alert' : undefined}
                  className={`flex items-center gap-2 text-base ${
                    msg.isError
                      ? 'text-error'
                      : msg.isStatus
                      ? 'text-zinc-500'
                      : 'text-zinc-400'
                  }`}
                >
                  {msg.isStatus && (
                    <div className='w-1.5 h-1.5 rounded-full bg-teal animate-pulse' />
                  )}
                  {msg.isError && <FontAwesomeIcon icon={faTimesCircle} />}
                  {msg.content}
                </div>
              </motion.div>
            );
          })}

          {/* Thinking indicator -- visible during all busy phases */}
          {isBusy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className='flex justify-start gap-3'
            >
              <img
                src={maxAvatar}
                alt=''
                className='w-8 h-8 shrink-0 mt-1 rounded-lg'
              />
              <div
                role='status'
                aria-label='Max is thinking'
                className='bg-zinc-800 border border-zinc-700/50 rounded-2xl rounded-tl-md px-5 py-4 flex items-center gap-2 text-base text-zinc-400'
              >
                <FontAwesomeIcon icon={faSpinner} spin className='text-teal' />
                <span>
                  {phase === 'creating' && 'Starting up\u2026'}
                  {phase === 'prompting' && 'Thinking\u2026'}
                  {phase === 'sending_tokens' && 'Sending tokens\u2026'}
                  {phase === 'swapping' && 'Crawling through tokens\u2026'}
                </span>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  </>
);
