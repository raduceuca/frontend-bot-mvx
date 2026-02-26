import { motion } from 'motion/react';
import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import maxAvatar from 'assets/img/max-avatar.png';
import { TASK_SERVICE_API_URL } from 'config';
import { environment } from 'config';
import { useGetPreviousSessions } from 'hooks';
import {
  useCreateJob,
  useGiveFeedback,
  useSendTokensToBot,
  useSubmitProof
} from 'hooks/transactions';
import {
  ACCOUNTS_ENDPOINT,
  getAccountProvider,
  NotificationsFeedManager,
  useGetAccount,
  useGetLoginInfo,
  useGetNetworkConfig
} from 'lib';
import { EnvironmentsEnum } from 'lib/sdkDapp/sdkDapp.types';
import { RouteNamesEnum } from 'localConstants';
import { ItemsIdentifiersEnum } from 'pages/Dashboard/dashboard.types';
import {
  ChatHeader,
  ChatInputBar,
  ChatMessages,
  FaucetModal,
  FeedbackModal,
  PreviousSessions,
  QuickActions,
  RatingConfirmModal,
  WalletBar
} from './components';
import { styles } from './createJob.styles';
import { JobPhase } from './createJob.types';
import {
  clearPersistedJob,
  loadPersistedJob,
  useChatMessages,
  useFeedback,
  useJobActions,
  useJobPersistence,
  useSessionRating,
  useTransactionTracking
} from './hooks';

const AGENT_PROFILE_URL = 'https://agents.multiversx.com/agent/110';

/** Start task; connect to /tasks/:taskId/stream for real-time line/delta events. */
const START_TASK_PATH = '/start-task';

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

// eslint-disable-next-line prettier/prettier
const TASK_GREETING = 'Hello there! 👋 I\'m your helpful MultiversX devnet assistant. I can explain tokens and swaps in plain language, explore devnet data with my MultiversX tools, and help you understand and use features like the mystery box. Ask what you\'re curious about and I\'ll keep it clear and honest.';

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

const buildSwapPrompt = (userAddress: string, amountAtoms: string) =>
  `[MYSTERY_BOX_BUTTON_TRIGGERED] The user at address ${userAddress} just sent ${amountAtoms} atoms of EGLD to the bot. Use the mx-swap-and-return skill:

IMPORTANT: This feature is called "Mystery Box" in our UI. Always refer to it as "Mystery Box".

1. Save this amount: user address = ${userAddress}, received token = EGLD, amount = ${amountAtoms} atoms.
2. Call the DEX metadata API (GET the same API base URL as this task service + /dex/metadata, e.g. https://mx-bot-api.elrond.ro/dex/metadata) to get the list of available tradeable tokens.
3. From the response, pick between 1 and 4 output tokens with reasoning (e.g. liquidity, diversity; exclude the input token). State briefly why you chose each.
4. Run run_swap_and_return.py with: --user-address ${userAddress} --received-token EGLD --amount ${amountAtoms} --output-tokens <your selected tokens comma-separated>. Use default bot PEM.
5. The user at ${userAddress} must receive the swapped tokens.
6. In your final report you MUST include: (a) your reasoning for choosing each output token (why you picked them), and (b) a clear line telling the user to check their wallet for their newly swapped tokens. Report which tokens and amounts were sent.`;

// ── Constants ─────────────────────────────────────────────────────

const LOW_BALANCE_THRESHOLD = BigInt('50000000000000000'); // 0.05 EGLD

const isBalanceLow = (balance: string) => {
  try {
    return BigInt(balance) < LOW_BALANCE_THRESHOLD;
  } catch {
    return true;
  }
};

// ── Component ─────────────────────────────────────────────────────

export const CreateJob = () => {
  // ── Config state ──────────────────────────────────────────────
  const [agentNonce, setAgentNonce] = useState(110);
  const [serviceId, setServiceId] = useState('1');
  const [token] = useState('EGLD');
  const [nonce] = useState(0);
  const [amount, setAmount] = useState('0.05');

  // ── Core state machine ────────────────────────────────────────
  const [phase, setPhase] = useState<JobPhase>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [hasSentTokens, setHasSentTokens] = useState(false);

  // ── Chat ──────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState('');

  // ── UI toggles ────────────────────────────────────────────────
  const [showFaucetPanel, setShowFaucetPanel] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── SDK hooks ─────────────────────────────────────────────────
  const { address: userAddress, balance } = useGetAccount();
  const { createJob } = useCreateJob();
  const { sendTokensToBot } = useSendTokensToBot();
  const { giveFeedback } = useGiveFeedback();
  const { submitProof } = useSubmitProof();
  const { isLoggedIn, tokenLogin } = useGetLoginInfo();
  const { network } = useGetNetworkConfig();
  const {
    sessions: previousSessions,
    total: previousSessionsTotal,
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions
  } = useGetPreviousSessions(agentNonce, userAddress);
  const walletProvider = getAccountProvider();
  const walletNavigate = useNavigate();

  // ── Derived ───────────────────────────────────────────────────
  const isBusy =
    phase === 'creating' ||
    phase === 'prompting' ||
    phase === 'sending_tokens' ||
    phase === 'swapping';

  const isDevnet = environment === EnvironmentsEnum.devnet;
  const needsFunds = isBalanceLow(balance);

  // ── Custom hooks ──────────────────────────────────────────────
  const chat = useChatMessages();
  const txTracking = useTransactionTracking();

  const resetAll = useCallback(() => {
    clearPersistedJob();
    setJobId(null);
    setPhase('idle');
    chat.clearMessages();
    setPrompt('');
    setAgentNonce(110);
    setServiceId('1');
    setAmount('0.05');
    setHasSentTokens(false);
    txTracking.clearTransactions();
  }, [chat, txTracking]);

  const feedback = useFeedback({
    giveFeedback,
    trackTransaction: txTracking.trackTransaction,
    onClose: resetAll
  });

  const {
    sessionRating,
    isSubmittingSessionRating,
    sessionRatingError,
    finishingJobId,
    handleFinishSession,
    handleRateSession,
    handleConfirmSessionRating,
    handleCancelSessionRating
  } = useSessionRating({
    giveFeedback,
    submitProof,
    previousSessions,
    trackTransaction: txTracking.trackTransaction,
    refetchSessions
  });

  const jobActions = useJobActions({
    jobId,
    agentNonce,
    serviceId,
    token,
    nonce,
    amount,
    userAddress,
    hasSentTokens,
    nativeAuthToken: tokenLogin?.nativeAuthToken,
    chat,
    setPhase,
    setJobId,
    setHasSentTokens,
    trackTransaction: txTracking.trackTransaction,
    refetchSessions,
    createJob,
    sendTokensToBot
  });

  // ── Persistence ───────────────────────────────────────────────
  useEffect(() => {
    const persisted = loadPersistedJob();
    if (persisted?.jobId) {
      setJobId(persisted.jobId);
      setAgentNonce(persisted.agentNonce);
      setHasSentTokens(persisted.hasSentTokens ?? false);
      setPhase('ready');
      if (persisted.messages?.length) {
        chat.restoreMessages(persisted.messages);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useJobPersistence({
    jobId,
    agentNonce,
    messages: chat.messages,
    hasSentTokens
  });

  // ── Auto-scroll chat ──────────────────────────────────────────
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [chat.messages, phase]);

  // ── Auto-resize textarea ──────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [prompt]);

  // ── Escape key for faucet panel ───────────────────────────────
  useEffect(() => {
    if (!showFaucetPanel) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFaucetPanel(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showFaucetPanel]);

  // ── Wallet handlers ───────────────────────────────────────────
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

  const appendToLastAgentMessage = (chunk: string) =>
    setMessages((prev) => {
      if (!chunk) return prev;
      if (prev.length === 0) {
        return [
          ...prev,
          {
            id: uid(),
            role: 'agent' as const,
            content: chunk
          }
        ];
      }
      const last = prev[prev.length - 1];
      if (last.role !== 'agent' || last.isStatus || last.isError) {
        return [
          ...prev,
          {
            id: uid(),
            role: 'agent' as const,
            content: chunk
          }
        ];
      }
      const updatedLast: ChatMessage = {
        ...last,
        content: `${last.content ?? ''}${chunk}`
      };
      return [...prev.slice(0, -1), updatedLast];
    });

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

  const dismissToast = (toastId: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== toastId));

  // ── Session rating (Previous Sessions list) ────────────────────
  const {
    sessionRating,
    isSubmittingSessionRating,
    sessionRatingError,
    finishingJobId,
    handleFinishSession,
    handleRateSession,
    handleConfirmSessionRating,
    handleCancelSessionRating
  } = useSessionRating({
    giveFeedback,
    submitProof,
    previousSessions,
    trackTransaction,
    refetchSessions
  });

  // ── Shared streaming logic (SSE) ─────────────────────────────────

  const streamTaskEvents = async (
    taskId: string,
    onStatus: (
      status: 'completed' | 'failed',
      result?: string,
      error?: string
    ) => void
  ) => {
    try {
      const res = await fetch(
        `${TASK_SERVICE_API_URL}/tasks/${taskId}/stream`,
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`,
            Origin: window.location.origin
          }
        }
      );

      if (!res.ok || !res.body) {
        throw new Error(res.statusText || 'Stream failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;

      while (!done) {
        const readResult = await reader.read();
        done = readResult.done ?? false;
        if (done) {
          break;
        }

        const { value } = readResult;
        if (!value) continue;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          const match = chunk.match(/^data: (.+)$/m);
          if (!match) continue;

          let data: any;
          try {
            data = JSON.parse(match[1]);
          } catch {
            continue;
          }

          if (data.event === 'delta' && data.content) {
            appendToLastAgentMessage(String(data.content));
          } else if (data.event === 'line' && data.line) {
            // Fallback for CLI-style line events
            appendToLastAgentMessage(`${String(data.line)}\n`);
          } else if (data.event === 'status') {
            onStatus(data.status, data.result, data.error);
            return;
          }
        }
      }
    } catch (err: any) {
      onStatus('failed', undefined, err?.message || 'Stream connection failed');
    }
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
        token: 'xEGLD',
        status: 'confirmed'
      });

      setJobId(newJobId);
      setHasSentTokens(false);
      setPhase('ready');
      pushMessage({
        role: 'agent',
        content: TASK_GREETING
      });
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
        `${TASK_SERVICE_API_URL}${START_TASK_PATH}`,
        { jobId, prompt: userText },
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
          }
        }
      );

      await streamTaskEvents(initData.taskId, (status, result, error) => {
        removeLastStatus();
        if (status === 'completed') {
          if (result) {
            pushMessage({
              role: 'agent',
              content: parseAgentResponse(result)
            });
          }
          setPhase('ready');
        } else {
          replaceLastStatus(
            `Something went wrong: ${error || 'Unknown error'}`,
            true
          );
          setPhase('error');
        }
      });
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
        label: 'xEGLD to Max',
        amount: sendAmount,
        token: 'xEGLD',
        status: 'confirmed'
      });

      pushMessage({
        role: 'system',
        content: `${sendAmount} xEGLD sent to Max. Transaction confirmed.`
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
        `${TASK_SERVICE_API_URL}${START_TASK_PATH}`,
        { jobId, prompt: swapPrompt },
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
          }
        }
      );

      await streamTaskEvents(initData.taskId, (status, _result, error) => {
        removeLastStatus();
        if (status === 'completed') {
          setHasSentTokens(true);
          setPhase('ready');
        } else {
          replaceLastStatus(
            `Couldn't complete the swap: ${error || 'Unknown error'}`,
            true
          );
          setHasSentTokens(true);
          setPhase('error');
        }
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '';
      replaceLastStatus(`Couldn't complete the swap: ${errorMsg}`, true);
      setHasSentTokens(true);
      setPhase('error');
    }
  };

  // ── Job action wrappers ───────────────────────────────────────
  const handleFinishJob = () => {
    if (!jobId) return;
    feedback.openFeedback(jobId, agentNonce);
    setPhase('rating');
  };

  const handleSendPrompt = () => {
    if (!isBusy && prompt.trim()) {
      const text = prompt.trim();
      setPrompt('');
      textareaRef.current?.focus();
      jobActions.handleSendPrompt(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const handleCreateJob = () => {
    chat.clearMessages();
    jobActions.handleCreateJob();
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div id={ItemsIdentifiersEnum.createJob} className={styles.container}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className={`${styles.card} flex flex-col min-h-[320px] xs:min-h-[360px] sm:min-h-[480px]`}
      >
        <ChatHeader
          jobId={jobId}
          isBusy={isBusy}
          phase={phase}
          isLoggedIn={isLoggedIn}
          networkId={network.id}
          onFinishJob={handleFinishJob}
        />

        <ChatMessages
          isLoggedIn={isLoggedIn}
          jobId={jobId}
          phase={phase}
          isBusy={isBusy}
          messages={chat.messages}
          amount={amount}
          isDevnet={isDevnet}
          needsFunds={needsFunds}
          toasts={txTracking.toasts}
          trackedTransactions={txTracking.trackedTransactions}
          explorerAddress={network.explorerAddress}
          previousSessionsTotal={previousSessionsTotal}
          onConnect={handleConnect}
          onCreateJob={handleCreateJob}
          onShowFaucet={() => setShowFaucetPanel(true)}
          onDismissToast={txTracking.dismissToast}
          chatContainerRef={chatContainerRef}
        />

        <QuickActions
          isLoggedIn={isLoggedIn}
          jobId={jobId}
          isBusy={isBusy}
          isDevnet={isDevnet}
          hasSentTokens={hasSentTokens}
          variant={isLoggedIn && jobId ? 'inline' : 'placeholder'}
          onMysteryBox={jobActions.handleMysteryBox}
          onSetPrompt={setPrompt}
        />

        {isLoggedIn && jobId && (
          <ChatInputBar
            isLoggedIn={isLoggedIn}
            jobId={jobId}
            isBusy={isBusy}
            prompt={prompt}
            phase={phase}
            textareaRef={textareaRef}
            onPromptChange={setPrompt}
            onSendPrompt={handleSendPrompt}
            onCreateJob={handleCreateJob}
            onConnect={handleConnect}
            onKeyDown={handleKeyDown}
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
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className='flex-1 flex flex-col items-center justify-center gap-5 py-12'
            >
              {/* Agent profile card with OG-style background */}
              <a
                href={AGENT_PROFILE_URL}
                target='_blank'
                rel='noopener noreferrer'
                aria-label="View Max's agent profile on MultiversX (opens in new tab)"
                className='group relative w-full max-w-xs overflow-hidden rounded-xl border border-zinc-700/40 hover:border-teal/30 transition-all duration-200 bg-zinc-900'
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
                    <span className='text-xs text-zinc-400 leading-none mt-0.5'>
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
                <p className='text-base font-medium text-zinc-50'>
                  Max is ready
                </p>
                <p className='text-sm text-zinc-500 max-w-xs mx-auto mt-1'>
                  Connect your wallet to get started. Devnet only, no real
                  money.
                </p>
              </div>

              <button
                type='button'
                onClick={handleConnect}
                className={`${styles.btn} bg-teal hover:bg-teal/80 text-zinc-950 flex items-center justify-center gap-2`}
              >
                <FontAwesomeIcon icon={faWallet} /> Connect Wallet
              </button>
            </motion.div>
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
                    {amount} xEGLD
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
                      Job Cost (xEGLD)
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

              {/* Previous sessions */}
              <PreviousSessions
                sessions={previousSessions}
                total={previousSessionsTotal}
                isLoading={sessionsLoading}
                error={sessionsError}
                explorerAddress={network.explorerAddress}
                onRetry={refetchSessions}
                onRateSession={handleRateSession}
                onFinishSession={handleFinishSession}
                finishingJobId={finishingJobId}
              />
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
                      <div className='bg-zinc-800 border border-zinc-700/50 text-zinc-50 rounded-2xl rounded-tl-md px-5 py-4 text-base prose prose-invert prose-sm prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-lg prose-code:text-teal prose-a:text-teal prose-a:no-underline hover:prose-a:underline prose-table:my-2 prose-th:border prose-th:border-zinc-600 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-zinc-600 prose-td:px-3 prose-td:py-2 max-w-none'>
                        <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{normalizeAgentMarkdown(msg.content)}</Markdown>
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
        {isLoggedIn && (
          <WalletBar
            userAddress={userAddress}
            addressCopied={addressCopied}
            networkId={network.id}
            isDevnet={isDevnet}
            needsFunds={needsFunds}
            onCopyAddress={handleCopyAddress}
            onOpenExplorer={handleOpenExplorer}
            onShowFaucet={() => setShowFaucetPanel(true)}
            onNotifications={handleNotifications}
            onLogout={handleLogout}
          />
        )}
      </motion.div>

      {isLoggedIn && previousSessionsTotal > 0 && (
        <div id='previous-sessions' className='pt-6'>
          <PreviousSessions
            sessions={previousSessions}
            total={previousSessionsTotal}
            isLoading={sessionsLoading}
            error={sessionsError}
            explorerAddress={network.explorerAddress}
            onRetry={refetchSessions}
            onRateSession={handleRateSession}
            onFinishSession={handleFinishSession}
            finishingJobId={finishingJobId}
          />
        </div>
      )}

      {showFaucetPanel && (
        <FaucetModal onClose={() => setShowFaucetPanel(false)} />
      )}

      {phase === 'rating' && feedback.pendingFeedback && (
        <FeedbackModal
          feedbackRating={feedback.feedbackRating}
          isSubmitting={feedback.isSubmittingFeedback}
          error={feedback.feedbackError}
          onRatingChange={feedback.setFeedbackRating}
          onSubmit={feedback.submitFeedback}
          onClose={feedback.closeFeedback}
        />
      )}

      {sessionRating && (
        <RatingConfirmModal
          jobId={sessionRating.jobId}
          rating={sessionRating.rating}
          isSubmitting={isSubmittingSessionRating}
          error={sessionRatingError}
          onConfirm={handleConfirmSessionRating}
          onCancel={handleCancelSessionRating}
        />
      )}
    </div>
  );
};
