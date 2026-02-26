import {
  faArrowUpRightFromSquare,
  faBell,
  faBolt,
  faCheckCircle,
  faChevronDown,
  faChevronUp,
  faClone,
  faCoins,
  faExternalLink,
  faPaperPlane,
  faPowerOff,
  faSpinner,
  faStar,
  faStarHalfStroke,
  faTimesCircle,
  faWallet
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { motion } from 'motion/react';
import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import maxAvatar from 'assets/img/max-avatar.png';
import { TASK_SERVICE_API_URL } from 'config';
import { environment } from 'config';
import {
  useCreateJob,
  useGiveFeedback,
  useSendTokensToBot
} from 'hooks/transactions';
import {
  ACCOUNTS_ENDPOINT,
  getAccountProvider,
  NotificationsFeedManager,
  parseAmount,
  useGetAccount,
  useGetLoginInfo,
  useGetNetworkConfig
} from 'lib';
import { EnvironmentsEnum } from 'lib/sdkDapp/sdkDapp.types';
import { RouteNamesEnum } from 'localConstants';
import { ItemsIdentifiersEnum } from 'pages/Dashboard/dashboard.types';
import { Faucet } from 'pages/Dashboard/widgets/Faucet/Faucet';
import { TransactionActivityBar, TransactionToast } from './components';
import { TrackedTransaction, TxStatus } from './createJob.types';

const AGENT_PROFILE_URL = 'https://agents.multiversx.com/agent/110';

// ── Types ──────────────────────────────────────────────────────────

type MessageRole = 'user' | 'agent' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  isStatus?: boolean;
  isError?: boolean;
}

type JobPhase =
  | 'idle'
  | 'creating'
  | 'ready'
  | 'prompting'
  | 'sending_tokens'
  | 'swapping'
  | 'rating'
  | 'error';

// ── Styles ─────────────────────────────────────────────────────────

const styles = {
  container: 'create-job-container flex flex-col gap-4 w-full mx-auto flex-1',
  card: 'bg-zinc-900/85 backdrop-blur-md border border-zinc-800 rounded-xl overflow-hidden',
  btn: 'px-4 py-2.5 rounded-lg font-medium text-base transition-colors duration-150 disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30',
  badge: 'flex items-center gap-1.5 px-2 py-0.5 rounded-md text-base font-mono',
  input:
    'bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-50 font-mono text-base focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/20 transition-colors duration-150',
  label:
    'text-base font-mono font-normal text-zinc-500 uppercase tracking-wider',
  chipBtn:
    'px-3 py-1.5 text-base text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:text-zinc-50 hover:border-zinc-700 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 whitespace-nowrap',
  header:
    'px-5 py-4 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-3'
} satisfies Record<string, string>;

const truncateAddress = (address: string) => {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

// ── Helpers ────────────────────────────────────────────────────────

let msgCounter = 0;
const uid = () => `msg-${++msgCounter}`;

const LOW_BALANCE_THRESHOLD = BigInt('50000000000000000'); // 0.05 EGLD

const CANCELLATION_SUBSTRINGS = [
  'Transaction canceled',
  'Signing canceled',
  'Transaction signing cancelled by user',
  'cancelled by user',
  'denied by the user',
  'extensionResponse'
] as const;

const isUserCancellation = (err: unknown): boolean => {
  const message = err instanceof Error ? err.message : String(err ?? '');
  return CANCELLATION_SUBSTRINGS.some((s) => message.includes(s));
};

const PERSISTED_JOB_KEY = 'mx_create_job_persisted';

interface PersistedJob {
  jobId: string;
  agentNonce: number;
  messages: Array<{
    role: MessageRole;
    content: string;
    isStatus?: boolean;
    isError?: boolean;
  }>;
  hasSentTokens?: boolean;
}

const loadPersistedJob = (): PersistedJob | null => {
  try {
    const raw = sessionStorage.getItem(PERSISTED_JOB_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedJob;
    if (typeof data?.jobId !== 'string' || typeof data?.agentNonce !== 'number')
      return null;
    return {
      jobId: data.jobId,
      agentNonce: data.agentNonce,
      messages: Array.isArray(data.messages) ? data.messages.slice(-10) : [],
      hasSentTokens: Boolean(data.hasSentTokens)
    };
  } catch {
    return null;
  }
};

const savePersistedJob = (job: PersistedJob) => {
  try {
    sessionStorage.setItem(
      PERSISTED_JOB_KEY,
      JSON.stringify({
        ...job,
        messages: job.messages.slice(-10)
      })
    );
  } catch {
    /* ignore */
  }
};

const clearPersistedJob = () => {
  try {
    sessionStorage.removeItem(PERSISTED_JOB_KEY);
  } catch {
    /* ignore */
  }
};

const parseAgentResponse = (val: unknown): string => {
  if (typeof val !== 'string') return JSON.stringify(val, null, 2);
  try {
    const parsed = JSON.parse(val);
    if (typeof parsed === 'string') return parseAgentResponse(parsed);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return val;
  }
};

const buildSwapPrompt = (userAddress: string, amountAtoms: string) =>
  `The user at address ${userAddress} just sent ${amountAtoms} atoms of EGLD to the bot. Use the mx-swap-and-return skill:

IMPORTANT: This feature is called "Mystery Box" in our UI. Always refer to it as "Mystery Box".

1. Save this amount: user address = ${userAddress}, received token = EGLD, amount = ${amountAtoms} atoms.
2. Call the DEX metadata API (GET the same API base URL as this task service + /dex/metadata, e.g. https://mx-bot-api.elrond.ro/dex/metadata) to get the list of available tradeable tokens.
3. From the response, pick between 1 and 4 output tokens with reasoning (e.g. liquidity, diversity; exclude the input token). State briefly why you chose each.
4. Run run_swap_and_return.py with: --user-address ${userAddress} --received-token EGLD --amount ${amountAtoms} --output-tokens <your selected tokens comma-separated>. Use default bot PEM.
5. The user at ${userAddress} must receive the swapped tokens.
6. In your final report you MUST include: (a) your reasoning for choosing each output token (why you picked them), and (b) a clear line telling the user to check their wallet for their newly swapped tokens. Report which tokens and amounts were sent.`;

const isBalanceLow = (balance: string) => {
  try {
    return BigInt(balance) < LOW_BALANCE_THRESHOLD;
  } catch {
    return true;
  }
};

// ── Component ──────────────────────────────────────────────────────

export const CreateJob = () => {
  // Config
  const [agentNonce, setAgentNonce] = useState(110);
  const [serviceId, setServiceId] = useState('1');
  const [token] = useState('EGLD');
  const [nonce] = useState(0);
  const [amount, setAmount] = useState('0.05');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Core state machine
  const [phase, setPhase] = useState<JobPhase>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [hasSentTokens, setHasSentTokens] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');

  // Faucet panel
  const [showFaucetPanel, setShowFaucetPanel] = useState(false);

  // Feedback
  const [pendingFeedback, setPendingFeedback] = useState<{
    jobId: string;
    agentNonce: number;
  } | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Transaction tracking
  const [trackedTransactions, setTrackedTransactions] = useState<
    TrackedTransaction[]
  >([]);
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      txHash: string;
      label: string;
      amount: string;
      token: string;
      status: 'confirmed' | 'failed';
    }>
  >([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { address: userAddress, balance } = useGetAccount();
  const { createJob } = useCreateJob();
  const { sendTokensToBot } = useSendTokensToBot();
  const { giveFeedback } = useGiveFeedback();
  const { isLoggedIn, tokenLogin } = useGetLoginInfo();
  const { network } = useGetNetworkConfig();
  const walletProvider = getAccountProvider();
  const walletNavigate = useNavigate();
  const [addressCopied, setAddressCopied] = useState(false);

  const handleLogout = useCallback(
    async (event: MouseEvent) => {
      event.preventDefault();
      await walletProvider.logout();
      walletNavigate(RouteNamesEnum.home);
    },
    [walletProvider, walletNavigate]
  );

  const handleCopyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(userAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [userAddress]);

  const handleOpenExplorer = useCallback(() => {
    const url = `${network.explorerAddress}/${ACCOUNTS_ENDPOINT}/${userAddress}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [network.explorerAddress, userAddress]);

  const handleNotifications = useCallback((event: MouseEvent) => {
    event.preventDefault();
    NotificationsFeedManager.getInstance().openNotificationsFeed();
  }, []);

  const handleConnect = () => {
    walletNavigate(RouteNamesEnum.unlock);
  };

  // Derived
  const isBusy =
    phase === 'creating' ||
    phase === 'prompting' ||
    phase === 'sending_tokens' ||
    phase === 'swapping';

  const isDevnet = environment === EnvironmentsEnum.devnet;
  const needsFunds = isBalanceLow(balance);

  // ── Persistence ──────────────────────────────────────────────────

  useEffect(() => {
    const persisted = loadPersistedJob();
    if (persisted?.jobId) {
      setJobId(persisted.jobId);
      setAgentNonce(persisted.agentNonce);
      setHasSentTokens(persisted.hasSentTokens ?? false);
      setPhase('ready');
      if (persisted.messages?.length) {
        setMessages(
          persisted.messages.map((m) => ({
            id: uid(),
            role: m.role,
            content: m.content,
            isStatus: m.isStatus,
            isError: m.isError
          }))
        );
      }
    }
  }, []);

  useEffect(() => {
    if (jobId) {
      savePersistedJob({
        jobId,
        agentNonce,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          isStatus: m.isStatus,
          isError: m.isError
        })),
        hasSentTokens
      });
    }
  }, [jobId, agentNonce, messages, hasSentTokens]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, phase]);

  // ── Message helpers ──────────────────────────────────────────────

  const pushMessage = (msg: Omit<ChatMessage, 'id'>) =>
    setMessages((prev) => [...prev, { ...msg, id: uid() }]);

  const replaceLastStatus = (content: string, isError = false) =>
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.isStatus) {
        return [
          ...prev.slice(0, -1),
          { ...last, content, isError, isStatus: !isError }
        ];
      }
      return [
        ...prev,
        {
          id: uid(),
          role: 'system' as const,
          content,
          isStatus: !isError,
          isError
        }
      ];
    });

  const removeLastStatus = () =>
    setMessages((prev) =>
      prev[prev.length - 1]?.isStatus ? prev.slice(0, -1) : prev
    );

  // ── Transaction tracking helpers ───────────────────────────────

  const txCounter = useRef(0);
  const txUid = () => `tx-${++txCounter.current}`;

  const toastCounter = useRef(0);

  const fireToast = (
    tx: { txHash: string; label: string; amount: string; token: string },
    status: 'confirmed' | 'failed'
  ) => {
    setToasts((prev) => [
      ...prev,
      { id: `toast-${++toastCounter.current}`, ...tx, status }
    ]);
  };

  const trackTransaction = (params: {
    txHash: string;
    label: string;
    amount: string;
    token: string;
    status?: TxStatus;
  }): string => {
    const id = txUid();
    const status = params.status ?? 'pending';
    const newTx: TrackedTransaction = {
      id,
      txHash: params.txHash,
      label: params.label,
      amount: params.amount,
      token: params.token,
      status,
      timestamp: Date.now()
    };
    setTrackedTransactions((prev) => [newTx, ...prev]);

    // Auto-fire toast for transactions tracked with a terminal status
    if (status === 'confirmed' || status === 'failed') {
      fireToast(
        {
          txHash: params.txHash,
          label: params.label,
          amount: params.amount,
          token: params.token
        },
        status
      );
    }

    return id;
  };

  const dismissToast = useCallback(
    (toastId: string) =>
      setToasts((prev) => prev.filter((t) => t.id !== toastId)),
    []
  );

  // ── Shared polling logic ─────────────────────────────────────────

  const pollTask = async (
    taskId: string,
    opts: { intervalMs?: number; maxAttempts?: number } = {}
  ) => {
    const { intervalMs = 3000, maxAttempts = 60 } = opts;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      const { data: task } = await axios.get(
        `${TASK_SERVICE_API_URL}/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
          }
        }
      );

      if (task.status === 'verifying') {
        replaceLastStatus('Confirming payment on-chain\u2026');
      } else if (task.status === 'processing') {
        replaceLastStatus('Max is on it\u2026');
      } else if (task.status === 'completed') {
        removeLastStatus();
        pushMessage({
          role: 'agent',
          content: parseAgentResponse(task.result)
        });
        return { success: true };
      } else if (task.status === 'failed') {
        replaceLastStatus(
          `Something went wrong: ${task.error || 'Unknown error'}`,
          true
        );
        return { success: false };
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    replaceLastStatus('Max timed out. Try again?', true);
    return { success: false };
  };

  // ── Actions ──────────────────────────────────────────────────────

  const handleCreateJob = async () => {
    try {
      setPhase('creating');
      setJobId(null);
      setMessages([]);

      const { jobId: newJobId, txHash } = await createJob(
        agentNonce,
        serviceId,
        { token, nonce, amount }
      );

      trackTransaction({
        txHash,
        label: 'Job created',
        amount,
        token: 'EGLD',
        status: 'confirmed'
      });

      setJobId(newJobId);
      setHasSentTokens(false);
      setPhase('ready');
    } catch (err: any) {
      if (isUserCancellation(err)) {
        setPhase('idle');
        return;
      }
      const errorMsg = err.response?.data?.message || err.message || '';
      pushMessage({
        role: 'system',
        content: `Couldn't start the job: ${errorMsg}`,
        isError: true
      });
      setPhase('error');
    }
  };

  const handleSendPrompt = async () => {
    if (!jobId || !prompt.trim()) return;

    const userText = prompt.trim();
    setPrompt('');
    textareaRef.current?.focus();

    pushMessage({ role: 'user', content: userText });
    setPhase('prompting');
    pushMessage({
      role: 'system',
      content: 'Sending to Max\u2026',
      isStatus: true
    });

    try {
      const { data: initData } = await axios.post(
        `${TASK_SERVICE_API_URL}/start-task-cli`,
        { jobId, prompt: userText },
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
          }
        }
      );

      const result = await pollTask(initData.taskId, { intervalMs: 2000 });
      setPhase(result.success ? 'ready' : 'error');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '';
      replaceLastStatus(`Connection lost: ${errorMsg}`, true);
      setPhase('error');
    }
  };

  const handleMysteryBox = async (sendAmount = '1') => {
    if (!userAddress || !jobId) return;
    if (hasSentTokens) {
      pushMessage({
        role: 'agent',
        content: 'Start a new job if you want me to trade for you again.'
      });
      return;
    }

    pushMessage({
      role: 'system',
      content: 'Mystery Box starting\u2026',
      isStatus: true
    });

    // Step 1: Send tokens to bot (requires signing)
    try {
      setPhase('sending_tokens');
      const { txHash: sendTxHash } = await sendTokensToBot({
        token: 'EGLD',
        nonce: 0,
        amount: sendAmount
      });

      trackTransaction({
        txHash: sendTxHash,
        label: 'EGLD to Max',
        amount: sendAmount,
        token: 'EGLD',
        status: 'confirmed'
      });

      pushMessage({
        role: 'system',
        content: `${sendAmount} EGLD sent to Max. Transaction confirmed.`
      });
      pushMessage({
        role: 'system',
        content: 'Max is crawling through tokens\u2026',
        isStatus: true
      });
    } catch (err: any) {
      if (isUserCancellation(err)) {
        replaceLastStatus(
          'Token transfer cancelled. Your job is still active \u2014 you can retry.',
          false
        );
      } else {
        const errorMsg = err.response?.data?.message || err.message || '';
        replaceLastStatus(`Token transfer failed: ${errorMsg}`, true);
      }
      setPhase('ready');
      return;
    }

    // Step 2: Trigger the swap (no signing, just API + polling)
    try {
      setPhase('swapping');
      const amountAtoms = parseAmount(sendAmount);
      const swapPrompt = buildSwapPrompt(userAddress, amountAtoms);

      const { data: initData } = await axios.post(
        `${TASK_SERVICE_API_URL}/start-task-cli`,
        { jobId, prompt: swapPrompt },
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
          }
        }
      );

      const result = await pollTask(initData.taskId, { intervalMs: 5000 });
      setHasSentTokens(true);
      setPhase(result.success ? 'ready' : 'error');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '';
      replaceLastStatus(`Couldn't complete the swap: ${errorMsg}`, true);
      setHasSentTokens(true);
      setPhase('error');
    }
  };

  const handleFinishJob = () => {
    if (!jobId) return;
    setPendingFeedback({ jobId, agentNonce });
    setFeedbackRating(0);
    setFeedbackError(null);
    setPhase('rating');
  };

  const resetAll = () => {
    clearPersistedJob();
    setJobId(null);
    setPhase('idle');
    setMessages([]);
    setPrompt('');
    setAgentNonce(110);
    setServiceId('1');
    setAmount('0.05');
    setHasSentTokens(false);
    setTrackedTransactions([]);
    setToasts([]);
  };

  const handleCloseFeedbackModal = () => {
    resetAll();
    setPendingFeedback(null);
    setFeedbackRating(0);
    setFeedbackError(null);
  };

  const handleSubmitFeedback = async () => {
    if (!pendingFeedback || feedbackRating <= 0) return;
    setIsSubmittingFeedback(true);
    setFeedbackError(null);
    try {
      const { txHash } = await giveFeedback(
        pendingFeedback.jobId,
        pendingFeedback.agentNonce,
        feedbackRating
      );
      if (txHash) {
        trackTransaction({
          txHash,
          label: `Rating: ${feedbackRating}/100`,
          amount: '0',
          token: 'EGLD',
          status: 'confirmed'
        });
      }
      handleCloseFeedbackModal();
    } catch (err: any) {
      if (isUserCancellation(err)) {
        setFeedbackError('Signing cancelled. Your rating was not submitted.');
      } else {
        setFeedbackError(
          err?.message ||
            err?.response?.data?.message ||
            'Couldn\u2019t submit your rating. Try again?'
        );
      }
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isBusy && prompt.trim()) handleSendPrompt();
    }
  };

  // ── Wallet Bar ───────────────────────────────────────────────────

  const walletBtn =
    'flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 cursor-pointer rounded-md px-2 py-1.5 -mx-2 hover:bg-zinc-800/50';

  const renderWalletBar = () => (
    <div className='px-4 sm:px-5 pb-3 sm:pb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-zinc-800/50 pt-2.5 sm:pt-3'>
      <div className='flex items-center gap-1.5 min-w-0'>
        <span className='text-sm font-mono text-zinc-500 truncate min-w-0 max-w-[120px] sm:max-w-none'>
          {truncateAddress(userAddress)}
        </span>
        <button
          onClick={handleCopyAddress}
          className={`${walletBtn} whitespace-nowrap ${
            addressCopied ? 'text-teal hover:text-teal' : ''
          }`}
        >
          <FontAwesomeIcon icon={faClone} className='text-sm' />
          <span>{addressCopied ? 'Copied' : 'Copy'}</span>
        </button>
        <button
          onClick={handleOpenExplorer}
          className={`${walletBtn} whitespace-nowrap`}
          aria-label='Explorer'
        >
          <FontAwesomeIcon icon={faExternalLink} className='text-sm' />
          <span className='hidden sm:inline'>Explorer</span>
        </button>
      </div>

      <div className='flex items-center gap-1.5'>
        <button
          onClick={handleNotifications}
          className={walletBtn}
          aria-label='Notifications'
        >
          <FontAwesomeIcon icon={faBell} className='text-sm' />
        </button>
        <span className='text-sm font-mono text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded-md capitalize'>
          {network.id}
        </span>
        <button
          onClick={handleLogout}
          className={`${walletBtn} hover:text-error/80 hover:bg-error/5`}
          aria-label='Disconnect wallet'
        >
          <FontAwesomeIcon icon={faPowerOff} className='text-sm' />
        </button>
      </div>
    </div>
  );

  // ── Quick Actions ────────────────────────────────────────────────

  const actionsDisabled = !isLoggedIn || !jobId;

  const chipClass =
    'px-3 py-1.5 text-sm text-zinc-400 bg-zinc-800/50 border border-zinc-700/50 rounded-full hover:bg-zinc-800 hover:text-zinc-50 hover:border-zinc-600 transition-colors duration-150 cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 whitespace-nowrap shrink-0';

  const renderQuickActions = () => (
    <div
      className='relative px-4 sm:px-5 pb-1.5'
      style={{
        maskImage:
          'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)'
      }}
    >
      <div className='flex gap-1.5 overflow-x-auto scrollbar-none'>
        {/* 1. Mystery Box — primary CTA */}
        <button
          onClick={() => handleMysteryBox('1')}
          disabled={!isLoggedIn || !jobId || isBusy || hasSentTokens}
          className={`px-3 py-1.5 text-sm border rounded-full transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 ${
            !isLoggedIn || !jobId
              ? 'bg-teal/5 text-teal/40 border-teal/10 cursor-default'
              : 'bg-teal/10 text-teal border-teal/20 hover:bg-teal/20 hover:border-teal/30 cursor-pointer disabled:opacity-40'
          }`}
        >
          <img
            src={maxAvatar}
            alt=''
            className='w-3 h-3 inline-block mr-1 -mt-0.5 rounded-sm'
          />
          Mystery Box &middot; 1 EGLD
        </button>

        {/* 2. Faucet — devnet only */}
        {isDevnet && (
          <button
            onClick={() => setShowFaucetPanel(true)}
            disabled={!isLoggedIn}
            className={`${chipClass} ${
              !isLoggedIn
                ? 'opacity-40 cursor-default'
                : needsFunds
                ? 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 hover:border-warning/30'
                : ''
            }`}
          >
            <FontAwesomeIcon
              icon={faCoins}
              className='mr-1 text-warning text-sm'
            />
            Get 5 xEGLD
          </button>
        )}

        {/* 3. Fun prompts */}
        <button
          onClick={() =>
            setPrompt('Who\u2019s the best user on devnet? Wrong answers only.')
          }
          disabled={actionsDisabled || isBusy}
          className={`${chipClass} ${
            actionsDisabled ? 'opacity-40 cursor-default' : ''
          }`}
        >
          Best devnet user?
        </button>

        <button
          onClick={() =>
            setPrompt('Pick a random token and convince me to ape in.')
          }
          disabled={actionsDisabled || isBusy}
          className={`${chipClass} ${
            actionsDisabled ? 'opacity-40 cursor-default' : ''
          }`}
        >
          Shill me something
        </button>

        <button
          onClick={() =>
            setPrompt('What would you do with 100 EGLD and zero morals?')
          }
          disabled={actionsDisabled || isBusy}
          className={`${chipClass} ${
            actionsDisabled ? 'opacity-40 cursor-default' : ''
          }`}
        >
          100 EGLD, zero morals
        </button>

        <button
          onClick={() => setPrompt('Rate my wallet. Be brutally honest.')}
          disabled={actionsDisabled || isBusy}
          className={`${chipClass} ${
            actionsDisabled ? 'opacity-40 cursor-default' : ''
          }`}
        >
          Rate my wallet
        </button>

        <button
          onClick={() =>
            setPrompt('Write a haiku about gas fees on MultiversX.')
          }
          disabled={actionsDisabled || isBusy}
          className={`${chipClass} ${
            actionsDisabled ? 'opacity-40 cursor-default' : ''
          }`}
        >
          Haiku about gas fees
        </button>

        <button
          onClick={() =>
            setPrompt(
              'If every token on MultiversX was a person at a party, describe the vibe.'
            )
          }
          disabled={actionsDisabled || isBusy}
          className={`${chipClass} ${
            actionsDisabled ? 'opacity-40 cursor-default' : ''
          }`}
        >
          Tokens at a party
        </button>

        <button
          onClick={() =>
            setPrompt('Explain what you do like I\u2019m a golden retriever.')
          }
          disabled={actionsDisabled || isBusy}
          className={`${chipClass} ${
            actionsDisabled ? 'opacity-40 cursor-default' : ''
          }`}
        >
          Explain like I&apos;m a golden retriever
        </button>

        <button
          onClick={() =>
            setPrompt(
              'Give me a mass-adoption conspiracy theory that sounds almost plausible.'
            )
          }
          disabled={actionsDisabled || isBusy}
          className={`${chipClass} ${
            actionsDisabled ? 'opacity-40 cursor-default' : ''
          }`}
        >
          Crypto conspiracy theory
        </button>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div id={ItemsIdentifiersEnum.createJob} className={styles.container}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className={`${styles.card} flex flex-col min-h-[360px] sm:min-h-[480px]`}
      >
        {/* ── Chat header ── */}
        <div className='px-4 sm:px-5 py-3 border-b border-zinc-800 flex items-center justify-between'>
          <div className='flex items-center gap-2.5'>
            <div className='relative'>
              <img src={maxAvatar} alt='Max' className='w-8 h-8 rounded-lg' />
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
              <span className='text-base font-medium text-zinc-50'>Max</span>
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
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className='text-sm'
                  />
                  {phase === 'creating' && 'Starting'}
                  {phase === 'prompting' && 'Thinking'}
                  {phase === 'sending_tokens' && 'Sending'}
                  {phase === 'swapping' && 'Crawling'}
                </div>
              )}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {jobId && (
              <button
                disabled={isBusy}
                onClick={handleFinishJob}
                className={`${styles.btn} bg-zinc-800 hover:bg-zinc-700 text-zinc-50 border border-zinc-700`}
              >
                <div className='flex items-center justify-center gap-2'>
                  <FontAwesomeIcon icon={faCheckCircle} /> Finish
                </div>
              </button>
            )}

            {!isLoggedIn && (
              <div className='text-sm font-mono text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded-md capitalize'>
                {network.id}
              </div>
            )}
          </div>
        </div>

        {/* ── Transaction Activity Bar ── */}
        {trackedTransactions.length > 0 && (
          <TransactionActivityBar
            transactions={trackedTransactions}
            explorerAddress={network.explorerAddress}
          />
        )}

        {/* ── Messages / Empty State ── */}
        <div
          ref={chatContainerRef}
          role='log'
          aria-live='polite'
          aria-label='Chat with Max'
          className='flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-5 py-4 flex flex-col gap-3'
        >
          {/* Transaction confirmation toasts */}
          {toasts.length > 0 && (
            <TransactionToast
              toasts={toasts}
              explorerAddress={network.explorerAddress}
              onDismiss={dismissToast}
            />
          )}

          {!isLoggedIn ? (
            /* State 1: Not logged in — Connect Wallet CTA */
            <div className='flex-1 flex flex-col items-center justify-center gap-5 py-12'>
              <img
                src={maxAvatar}
                alt='Max'
                className='w-16 h-16 rounded-xl opacity-60'
              />
              <div className='text-center'>
                <p className='text-base font-medium text-zinc-50'>
                  Max is ready
                </p>
                <p className='text-base text-zinc-500 max-w-sm mx-auto mt-1'>
                  Connect your wallet to get started. This runs on devnet
                  — test tokens only, no real money.
                </p>
              </div>

              {/* Connect Wallet + Agent Profile — matched height */}
              <div className='flex items-stretch gap-2'>
                <button
                  onClick={handleConnect}
                  className={`${styles.btn} bg-teal hover:bg-teal/80 text-zinc-950 flex items-center justify-center gap-2`}
                >
                  <FontAwesomeIcon icon={faWallet} /> Connect Wallet
                </button>

                <a
                  href={AGENT_PROFILE_URL}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='group flex items-center gap-2.5 bg-zinc-800/60 border border-zinc-700/50 hover:border-teal/30 rounded-lg px-3 transition-all duration-150'
                >
                  <img
                    src={maxAvatar}
                    alt='Max'
                    className='w-7 h-7 rounded-md shrink-0'
                  />
                  <div className='flex flex-col items-start leading-tight'>
                    <span className='text-sm font-medium text-zinc-50'>
                      Max
                    </span>
                    <span className='text-sm text-zinc-500 font-mono'>
                      AI Agent on MultiversX
                    </span>
                  </div>
                  <FontAwesomeIcon
                    icon={faArrowUpRightFromSquare}
                    className='w-2.5 h-2.5 text-zinc-600 group-hover:text-teal transition-colors duration-150'
                    aria-hidden='true'
                  />
                </a>
              </div>
            </div>
          ) : !jobId ? (
            /* State 2: Logged in, no active job — Start Job CTA */
            <div className='flex-1 flex flex-col items-center justify-center gap-4 py-8'>
              <img
                src={maxAvatar}
                alt='Max'
                className='w-12 h-12 rounded-xl opacity-60'
              />
              <div className='text-center'>
                <p className='text-base font-medium text-zinc-50'>
                  Start a job with Max
                </p>
                <p className='text-base text-zinc-500 max-w-sm mx-auto mt-1'>
                  Pay {amount} xEGLD to activate Max. Ask anything, trigger
                  swaps, or try a Mystery Box.
                </p>
                {isDevnet && (
                  <p className='text-sm text-zinc-600 max-w-sm mx-auto mt-1.5'>
                    Devnet — test tokens only, no real money.
                    {needsFunds && (
                      <>
                        {' '}
                        <button
                          onClick={() => setShowFaucetPanel(true)}
                          className='text-teal hover:text-teal/80 transition-colors duration-150 cursor-pointer'
                        >
                          Get free xEGLD from the faucet.
                        </button>
                      </>
                    )}
                  </p>
                )}
              </div>

              <button
                disabled={phase === 'creating'}
                onClick={handleCreateJob}
                className={`${styles.btn} bg-teal hover:bg-teal/80 text-zinc-950 min-w-[200px]`}
              >
                {phase === 'creating' ? (
                  <div className='flex items-center justify-center gap-2'>
                    <FontAwesomeIcon icon={faSpinner} spin /> Starting&hellip;
                  </div>
                ) : (
                  <div className='flex items-center justify-center gap-2'>
                    <FontAwesomeIcon icon={faBolt} /> Start Job &middot;{' '}
                    {amount} EGLD
                  </div>
                )}
              </button>

              {/* Advanced settings toggle */}
              <button
                onClick={() => setShowAdvanced((prev) => !prev)}
                className='text-base text-zinc-500 hover:text-zinc-50 transition-colors duration-150 flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 rounded-lg px-3 py-2'
                aria-expanded={showAdvanced}
                aria-controls='advanced-config'
              >
                Advanced
                <FontAwesomeIcon
                  icon={showAdvanced ? faChevronUp : faChevronDown}
                />
              </button>

              {showAdvanced && (
                <div
                  id='advanced-config'
                  className='w-full max-w-md grid grid-cols-1 md:grid-cols-3 gap-3'
                >
                  <div className='flex flex-col gap-1'>
                    <label htmlFor='agent-nonce' className={styles.label}>
                      Agent Nonce
                    </label>
                    <input
                      id='agent-nonce'
                      type='number'
                      value={agentNonce}
                      onChange={(e) => setAgentNonce(Number(e.target.value))}
                      className={styles.input}
                    />
                  </div>
                  <div className='flex flex-col gap-1'>
                    <label htmlFor='service-id' className={styles.label}>
                      Service ID
                    </label>
                    <input
                      id='service-id'
                      type='text'
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div className='flex flex-col gap-1'>
                    <label htmlFor='job-cost' className={styles.label}>
                      Job Cost (EGLD)
                    </label>
                    <input
                      id='job-cost'
                      type='text'
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* State 3: Active job — messages or idle */
            <>
              {messages.length === 0 && (
                <div className='flex-1 flex flex-col items-center justify-center gap-3 py-12'>
                  <img
                    src={maxAvatar}
                    alt='Max'
                    className='w-10 h-10 rounded-lg opacity-60'
                  />
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
                      className='flex justify-end max-w-[90%] sm:max-w-[80%] ml-auto'
                    >
                      <div className='bg-zinc-800 text-zinc-50 rounded-2xl rounded-tr-md px-5 py-3 text-base prose prose-invert prose-sm prose-p:my-1 prose-headings:my-2 prose-code:text-teal max-w-none'>
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
                      className='flex justify-start gap-3 max-w-[95%] sm:max-w-[80%]'
                    >
                      <img
                        src={maxAvatar}
                        alt=''
                        className='w-8 h-8 shrink-0 mt-1 rounded-lg'
                      />
                      <div className='bg-zinc-800 border border-zinc-700/50 text-zinc-50 rounded-2xl rounded-tl-md px-5 py-4 text-base prose prose-invert prose-sm prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-lg prose-code:text-teal prose-a:text-teal prose-a:no-underline hover:prose-a:underline max-w-none'>
                        <Markdown>{msg.content}</Markdown>
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

              {/* Thinking indicator — visible during all busy phases */}
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
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      className='text-teal'
                    />
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

        {/* ── Quick actions (always visible) ── */}
        {renderQuickActions()}

        {/* ── Input bar ── */}
        <div className='px-4 sm:px-5 pb-3 sm:pb-4 pt-1'>
          {!isLoggedIn ? (
            <button
              onClick={handleConnect}
              className='w-full flex items-center gap-3 bg-zinc-950 border border-zinc-700/50 rounded-xl px-4 py-3 cursor-pointer hover:border-zinc-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30'
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
              onClick={handleCreateJob}
              disabled={phase === 'creating'}
              className='w-full flex items-center gap-3 bg-zinc-950 border border-zinc-700/50 rounded-xl px-4 py-3 cursor-pointer hover:border-zinc-600 transition-colors duration-150 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30'
            >
              <span className='flex-1 text-base text-zinc-500 text-left'>
                Start a job to talk to Max&hellip;
              </span>
              <div className='shrink-0 w-10 h-10 bg-teal/20 text-teal rounded-lg flex items-center justify-center'>
                <FontAwesomeIcon icon={faBolt} />
              </div>
            </button>
          ) : (
            <div className='flex items-end gap-3 bg-zinc-950 border border-zinc-700/50 rounded-xl px-4 py-3 focus-within:border-teal/40 focus-within:ring-2 focus-within:ring-teal/20 transition-colors duration-150'>
              <label htmlFor='agent-prompt' className='sr-only'>
                Message to Max
              </label>
              <textarea
                id='agent-prompt'
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className='flex-1 bg-transparent border-none p-0 text-base text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-0 resize-none leading-relaxed max-h-32 overflow-y-auto custom-scrollbar'
                placeholder='Tell Max what to do&hellip;'
              />
              <button
                disabled={isBusy || !prompt.trim()}
                onClick={handleSendPrompt}
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

        {/* ── Wallet bar (logged in only) ── */}
        {isLoggedIn && renderWalletBar()}
      </motion.div>

      {/* Faucet panel */}
      {showFaucetPanel && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 overflow-y-auto'
          role='dialog'
          aria-modal='true'
          aria-labelledby='faucet-title'
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className='bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 flex flex-col gap-5'
          >
            <div>
              <h3
                id='faucet-title'
                className='text-lg font-semibold text-zinc-50 tracking-tight'
              >
                Devnet Faucet
              </h3>
              <p className='text-base text-zinc-400 mt-2 leading-relaxed'>
                Get 5 xEGLD — test tokens with no real value. Use them to start
                jobs, try a Mystery Box, and do everything Max can do. One
                request every 24 hours.
              </p>
            </div>

            <Faucet />

            <button
              type='button'
              onClick={() => setShowFaucetPanel(false)}
              className='text-base text-zinc-500 hover:text-zinc-300 transition-colors duration-150 cursor-pointer self-center rounded-lg px-4 py-2.5 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30'
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Feedback modal */}
      {phase === 'rating' && pendingFeedback && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 overflow-y-auto'
          role='dialog'
          aria-modal='true'
          aria-labelledby='feedback-title'
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className='bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full p-6 flex flex-col gap-4'
          >
            <h3
              id='feedback-title'
              className='text-lg font-semibold text-zinc-50 tracking-tight'
            >
              How did Max do?
            </h3>
            <p className='text-base text-zinc-500 leading-relaxed'>
              Your rating goes on-chain and helps improve the agent.
            </p>

            {/* Star rating */}
            <fieldset aria-label='Rate Max'>
              <legend className='sr-only'>
                Rate Max from 10 to 100 points
              </legend>
              <div className='flex items-center gap-0.5'>
                {[0, 1, 2, 3, 4].map((starIndex) => {
                  const halfValue = starIndex * 20 + 10;
                  const fullValue = (starIndex + 1) * 20;
                  const showFull = feedbackRating >= fullValue;
                  const showHalf = feedbackRating >= halfValue && !showFull;
                  const filled = showFull || showHalf;
                  return (
                    <div key={starIndex} className='relative flex w-10'>
                      <span
                        className={`pointer-events-none text-2xl transition-colors ${
                          filled ? 'text-warning' : 'text-zinc-700'
                        }`}
                      >
                        {showFull ? (
                          <FontAwesomeIcon icon={faStar} />
                        ) : showHalf ? (
                          <FontAwesomeIcon icon={faStarHalfStroke} />
                        ) : (
                          <FontAwesomeIcon icon={faStar} />
                        )}
                      </span>
                      <button
                        type='button'
                        onClick={() => setFeedbackRating(halfValue)}
                        className='absolute left-0 top-0 w-1/2 h-full cursor-pointer'
                        aria-label={`${halfValue} points`}
                      />
                      <button
                        type='button'
                        onClick={() => setFeedbackRating(fullValue)}
                        className='absolute left-1/2 top-0 w-1/2 h-full cursor-pointer'
                        aria-label={`${fullValue} points`}
                      />
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <p className='text-base text-zinc-500 font-mono' aria-live='polite'>
              {feedbackRating > 0
                ? `${feedbackRating} / 100 points`
                : 'Tap to rate'}
            </p>

            {feedbackError && (
              <p role='alert' className='text-error text-base'>
                {feedbackError}
              </p>
            )}

            <div className='flex gap-3'>
              <button
                type='button'
                onClick={handleCloseFeedbackModal}
                className='flex-1 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors duration-150 text-base font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30'
              >
                Skip
              </button>
              <button
                type='button'
                disabled={feedbackRating <= 0 || isSubmittingFeedback}
                onClick={handleSubmitFeedback}
                className='flex-1 px-4 py-2.5 bg-teal hover:bg-teal/80 text-zinc-950 rounded-lg font-medium text-base transition-colors duration-150 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30'
              >
                {isSubmittingFeedback ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Submitting&hellip;
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
