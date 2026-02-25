import {
  faBolt,
  faCheckCircle,
  faPaperPlane,
  faRedo,
  faRobot,
  faSpinner,
  faStar,
  faStarHalfStroke,
  faTimesCircle,
  faUser,
  faWallet
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { TASK_SERVICE_API_URL } from 'config';
import { useCreateJob, useSendTokensToBot, useGiveFeedback } from 'hooks/transactions';
import { useGetAccount, useGetLoginInfo, parseAmount } from 'lib';
import { ItemsIdentifiersEnum } from 'pages/Dashboard/dashboard.types';

type MessageRole = 'user' | 'agent' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** For system/status messages like 'verifying…' */
  isStatus?: boolean;
  isError?: boolean;
}

const styles = {
  container:
    'create-job-container flex flex-col gap-6 w-full mx-auto p-4 lg:p-0 flex-1',
  glassCard:
    'bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)]',
  header:
    'px-8 py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5',
  statsGrid: 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-6',
  statItem:
    'bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col gap-1 hover:bg-white/10 transition-colors',
  actionButton:
    'relative overflow-hidden group px-8 py-4 bg-interactive hover:bg-interactive/90 text-white rounded-xl font-bold shadow-lg shadow-interactive/20 disabled:opacity-50 transition-all active:scale-95',
  badge:
    'flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest'
} satisfies Record<string, string>;

let msgCounter = 0;
const uid = () => `msg-${++msgCounter}`;

const PERSISTED_JOB_KEY = 'mx_create_job_persisted';
const PERSISTED_MESSAGES_MAX = 10;

interface PersistedMessage {
  role: MessageRole;
  content: string;
  isStatus?: boolean;
  isError?: boolean;
}

interface PersistedJob {
  jobId: string;
  agentNonce: number;
  messages: PersistedMessage[];
  hasSentToBotForJob?: boolean;
}

const loadPersistedJob = (): PersistedJob | null => {
  try {
    const raw = sessionStorage.getItem(PERSISTED_JOB_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedJob;
    if (typeof data?.jobId !== 'string' || typeof data?.agentNonce !== 'number') return null;
    const messages = Array.isArray(data.messages) ? data.messages : [];
    return {
      jobId: data.jobId,
      agentNonce: data.agentNonce,
      messages,
      hasSentToBotForJob: Boolean(data.hasSentToBotForJob)
    };
  } catch {
    return null;
  }
};

const savePersistedJob = (
  jobId: string,
  agentNonce: number,
  messages: ChatMessage[],
  hasSentToBotForJob: boolean
) => {
  try {
    const last = messages.slice(-PERSISTED_MESSAGES_MAX);
    const persisted: PersistedJob = {
      jobId,
      agentNonce,
      messages: last.map((m) => ({ role: m.role, content: m.content, isStatus: m.isStatus, isError: m.isError })),
      hasSentToBotForJob
    };
    sessionStorage.setItem(PERSISTED_JOB_KEY, JSON.stringify(persisted));
  } catch {
    // ignore
  }
};

const clearPersistedJob = () => {
  try {
    sessionStorage.removeItem(PERSISTED_JOB_KEY);
  } catch {
    // ignore
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

export const CreateJob = () => {
  // Config state
  const [agentNonce, setAgentNonce] = useState(110);
  const [serviceId, setServiceId] = useState('1');
  const [token, setToken] = useState('EGLD');
  const [nonce, setNonce] = useState(0);
  const [amount, setAmount] = useState('0.05');

  // Operational state
  const [jobId, setJobId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'verifying' | 'processing' | 'verified' | 'failed'
  >('idle');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isPrompting, setIsPrompting] = useState(false);

  const [isSendingToBot, setIsSendingToBot] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  // EGLD amount to send to bot (for swap flow)
  const [egldAmountToBot, setEgldAmountToBot] = useState('1');

  // Send to bot is allowed only once per job; second click shows agent message
  const [hasSentToBotForJob, setHasSentToBotForJob] = useState(false);

  // Feedback modal (after Mark as finished)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<{
    jobId: string;
    agentNonce: number;
  } | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(0); // 0, 10, 20, ..., 100.
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { address: userAddress } = useGetAccount();
  const { createJob } = useCreateJob();
  const { sendTokensToBot } = useSendTokensToBot();
  const { giveFeedback } = useGiveFeedback();
  const { tokenLogin } = useGetLoginInfo();

  // Restore persisted job on mount (e.g. after refresh)
  useEffect(() => {
    const persisted = loadPersistedJob();
    if (persisted?.jobId) {
      setJobId(persisted.jobId);
      setAgentNonce(persisted.agentNonce);
      setHasSentToBotForJob(persisted.hasSentToBotForJob ?? false);
      if (persisted.messages?.length) {
        const restored: ChatMessage[] = persisted.messages.map((m) => ({
          id: uid(),
          role: m.role,
          content: m.content,
          isStatus: m.isStatus,
          isError: m.isError
        }));
        setMessages(restored);
      }
    }
  }, []);

  // Persist job, last 10 messages, and send-to-bot-once flag when we have an open job
  useEffect(() => {
    if (jobId) {
      savePersistedJob(jobId, agentNonce, messages, hasSentToBotForJob);
    }
  }, [jobId, agentNonce, messages, hasSentToBotForJob]);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPrompting]);

  const pushMessage = (msg: Omit<ChatMessage, 'id'>) =>
    setMessages((prev) => [...prev, { ...msg, id: uid() }]);

  const replaceLastSystemStatus = (content: string, isError = false) =>
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
        { id: uid(), role: 'system', content, isStatus: !isError, isError }
      ];
    });

  const handleCreateJob = async () => {
    try {
      setIsCreating(true);
      setJobId(null);
      setVerificationStatus('idle');
      setMessages([]);

      const { jobId: newJobId } = await createJob(agentNonce, serviceId, {
        token,
        nonce,
        amount
      });

      setJobId(newJobId);
      setHasSentToBotForJob(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '';
      pushMessage({
        role: 'system',
        content: `Job creation failed: ${errorMsg}`,
        isError: true
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendPrompt = async () => {
    if (!jobId || !prompt.trim()) return;

    const userText = prompt.trim();
    setPrompt('');
    textareaRef.current?.focus();

    pushMessage({ role: 'user', content: userText });

    try {
      setIsPrompting(true);
      setVerificationStatus('idle');
      pushMessage({
        role: 'system',
        content: 'Submitting task…',
        isStatus: true
      });

      // 1. Submit Task
      const { data: initData } = await axios.post(
        `${TASK_SERVICE_API_URL}/start-task-cli`,
        { jobId, prompt: userText },
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
          }
        }
      );

      const taskId = initData.taskId;

      // 2. Poll for Result
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5 s delay

      while (!completed && attempts < maxAttempts) {
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
          setVerificationStatus('verifying');
          replaceLastSystemStatus(
            `Verifying employer on-chain… (attempt ${attempts})`
          );
        } else if (task.status === 'processing') {
          setVerificationStatus('processing');
          replaceLastSystemStatus('Agent is processing your request…');
        } else if (task.status === 'completed') {
          setVerificationStatus('verified');
          // Remove the status bubble and add the real agent reply
          setMessages((prev) =>
            prev[prev.length - 1]?.isStatus ? prev.slice(0, -1) : prev
          );
          pushMessage({
            role: 'agent',
            content: parseAgentResponse(task.result)
          });
          completed = true;
        } else if (task.status === 'failed') {
          setVerificationStatus('failed');
          replaceLastSystemStatus(
            `Execution failed: ${task.error || 'Unknown error'}`,
            true
          );
          completed = true;
        }

        if (!completed) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      if (!completed) {
        setVerificationStatus('failed');
        replaceLastSystemStatus(
          'Execution timed out — the task took too long.',
          true
        );
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '';
      replaceLastSystemStatus(`Communication failure: ${errorMsg}`, true);
    } finally {
      setIsPrompting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isPrompting && prompt.trim()) handleSendPrompt();
    }
  };

  const resetAll = () => {
    clearPersistedJob();
    setJobId(null);
    setVerificationStatus('idle');
    setMessages([]);
    setPrompt('');
    setAgentNonce(110);
    setServiceId('1');
    setToken('EGLD');
    setNonce(0);
    setAmount('0.05');
    setEgldAmountToBot('1');
    setHasSentToBotForJob(false);
  };

  const handleFinishJob = () => {
    if (!jobId) return;
    const jobToRate = jobId;
    const nonceToRate = agentNonce;
    resetAll();
    setPendingFeedback({ jobId: jobToRate, agentNonce: nonceToRate });
    setFeedbackRating(0);
    setFeedbackError(null);
    setShowFeedbackModal(true);
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setPendingFeedback(null);
    setFeedbackRating(0);
    setFeedbackError(null);
  };

  const handleSubmitFeedback = async () => {
    if (!pendingFeedback || feedbackRating <= 0) return;
    setIsSubmittingFeedback(true);
    setFeedbackError(null);
    try {
      await giveFeedback(pendingFeedback.jobId, pendingFeedback.agentNonce, feedbackRating);
      handleCloseFeedbackModal();
    } catch (err: any) {
      setFeedbackError(err?.message || err?.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const triggerSwapAndReturn = async () => {
    if (!jobId || !userAddress) return;
    const amountAtoms = parseAmount(egldAmountToBot);
    const swapPrompt = `The user at address ${userAddress} just sent ${amountAtoms} atoms of EGLD to the bot. Use the mx-swap-and-return skill:

1. Save this amount: user address = ${userAddress}, received token = EGLD, amount = ${amountAtoms} atoms.
2. Call the DEX metadata API (GET the same API base URL as this task service + /dex/metadata, e.g. https://mx-bot-api.elrond.ro/dex/metadata) to get the list of available tradeable tokens.
3. From the response, pick between 1 and 4 output tokens with reasoning (e.g. liquidity, diversity; exclude the input token). State briefly why you chose each.
4. Run run_swap_and_return.py with: --user-address ${userAddress} --received-token EGLD --amount ${amountAtoms} --output-tokens <your selected tokens comma-separated>. Use default bot PEM.
5. The user at ${userAddress} must receive the swapped tokens.
6. In your final report you MUST include: (a) your reasoning for choosing each output token (why you picked them), and (b) a clear line telling the user to check their wallet for their newly swapped tokens. Report which tokens and amounts were sent.`;
    try {
      const { data: initData } = await axios.post(
        `${TASK_SERVICE_API_URL}/start-task-cli`,
        { jobId, prompt: swapPrompt },
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
          }
        }
      );
      const taskId = initData.taskId;
      let completed = false;
      let attempts = 0;
      const pollIntervalMs = 5000;
      const maxAttempts = 60; // ~5 min at 5s
      while (!completed && attempts < maxAttempts) {
        attempts++;
        const { data: task } = await axios.get(
          `${TASK_SERVICE_API_URL}/tasks/${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
            }
          }
        );
        if (task.status === 'completed') {
          setMessages((prev) =>
            prev[prev.length - 1]?.isStatus ? prev.slice(0, -1) : prev
          );
          pushMessage({
            role: 'agent',
            content: parseAgentResponse(task.result)
          });
          completed = true;
        } else if (task.status === 'failed') {
          replaceLastSystemStatus(
            `Swap failed: ${task.error || 'Unknown error'}`,
            true
          );
          completed = true;
        } else {
          replaceLastSystemStatus(
            `Bot is swapping your tokens… (${attempts})`
          );
        }
        if (!completed) {
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }
      }
      if (!completed) {
        replaceLastSystemStatus('Swap timed out.', true);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '';
      replaceLastSystemStatus(`Swap task failed: ${errorMsg}`, true);
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSendTokensToBot = async () => {
    if (hasSentToBotForJob) {
      pushMessage({
        role: 'agent',
        content: 'You need to initialize a new job if you want me to trade for you again.'
      });
      return;
    }

    setIsSendingToBot(true);
    try {
      await sendTokensToBot({
        token: 'EGLD',
        nonce: 0,
        amount: egldAmountToBot
      });
      pushMessage({
        role: 'system',
        content: `${egldAmountToBot} EGLD sent to bot. Check your wallet for the transaction.`
      });
      pushMessage({
        role: 'system',
        content: 'Bot is swapping your tokens…',
        isStatus: true
      });
      setIsSwapping(true);
      await triggerSwapAndReturn();
      setHasSentToBotForJob(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '';
      pushMessage({
        role: 'system',
        content: `Send to bot failed: ${errorMsg}`,
        isError: true
      });
    } finally {
      setIsSendingToBot(false);
    }
  };

  return (
    <div id={ItemsIdentifiersEnum.createJob} className={styles.container}>
      {/* Configuration Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.glassCard}
      >
        <div className={styles.header}>
          <div className='flex items-center gap-4'>
            <div>
              <h2 className='text-xl font-black text-white tracking-tight uppercase'>
                Agent Orchestrator
              </h2>
              <p className='text-white/40 text-xs font-mono uppercase tracking-widest'>
                Core Configuration Matrix
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3 flex-wrap'>
            {jobId && (
              <>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='text-[10px] font-black text-white/40 uppercase tracking-widest'>
                    EGLD amount to send to bot:
                  </span>
                  <input
                    type='text'
                    value={egldAmountToBot}
                    onChange={(e) => setEgldAmountToBot(e.target.value)}
                    placeholder='Amount'
                    className='bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm w-24 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30'
                  />
                </div>
                <button
                  disabled={isCreating || isPrompting || isSendingToBot || isSwapping}
                  onClick={handleSendTokensToBot}
                  className={`${styles.actionButton} bg-violet-600 hover:bg-violet-500 min-w-[180px] h-[52px] ring-2 ring-violet-500/40 ring-offset-2 ring-offset-black/80`}
                >
                  {isSendingToBot ? (
                    <div className='flex items-center justify-center gap-2'>
                      <FontAwesomeIcon icon={faSpinner} spin /> SENDING...
                    </div>
                  ) : isSwapping ? (
                    <div className='flex items-center justify-center gap-2'>
                      <FontAwesomeIcon icon={faSpinner} spin /> SWAPPING...
                    </div>
                  ) : (
                    <div className='flex items-center justify-center gap-2'>
                      <FontAwesomeIcon icon={faWallet} /> SEND TO BOT
                    </div>
                  )}
                </button>
                <button
                  disabled={isCreating || isPrompting}
                  onClick={handleFinishJob}
                  className={`${styles.actionButton} bg-emerald-600 hover:bg-emerald-500 min-w-[200px] h-[52px] ring-2 ring-emerald-500/40 ring-offset-2 ring-offset-black/80`}
                >
                  <div className='flex items-center justify-center gap-2'>
                    <FontAwesomeIcon icon={faCheckCircle} /> MARK AS FINISHED
                  </div>
                </button>
              </>
            )}
            {!jobId && (
              <button
                disabled={isCreating}
                onClick={handleCreateJob}
                className={`${styles.actionButton} min-w-[200px] h-[52px] ring-2 ring-interactive/40 ring-offset-2 ring-offset-black/80`}
              >
                {isCreating ? (
                  <div className='flex items-center justify-center gap-2'>
                    <FontAwesomeIcon icon={faSpinner} spin /> INITIALIZING
                  </div>
                ) : (
                  <div className='flex items-center justify-center gap-2'>
                    <FontAwesomeIcon icon={faBolt} /> INITIALIZE JOB
                  </div>
                )}
              </button>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <label className='text-[10px] font-black text-white/30 uppercase tracking-widest'>
              Agent Nonce
            </label>
            <input
              type='text'
              value={agentNonce}
              onChange={(e) =>
                setAgentNonce(Number(e.target.value.replace(/\D/g, '')))
              }
              className='bg-transparent border-none p-0 text-white font-mono text-lg focus:ring-0 w-full'
            />
          </div>
          <div className={styles.statItem}>
            <label className='text-[10px] font-black text-white/30 uppercase tracking-widest'>
              Service ID
            </label>
            <input
              type='text'
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className='bg-transparent border-none p-0 text-white font-mono text-lg focus:ring-0 w-full'
            />
          </div>
          <div className={styles.statItem}>
            <label className='text-[10px] font-black text-white/30 uppercase tracking-widest'>
              Payment Token
            </label>
            <input
              type='text'
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className='bg-transparent border-none p-0 text-white font-mono text-lg focus:ring-0 w-full'
            />
          </div>
          <div className={styles.statItem}>
            <label className='text-[10px] font-black text-white/30 uppercase tracking-widest'>
              Token Nonce
            </label>
            <input
              type='text'
              value={nonce}
              onChange={(e) =>
                setNonce(Number(e.target.value.replace(/\D/g, '')))
              }
              className='bg-transparent border-none p-0 text-white font-mono text-lg focus:ring-0 w-full'
            />
          </div>
          <div className={styles.statItem}>
            <label className='text-[10px] font-black text-white/30 uppercase tracking-widest'>
              Amount
            </label>
            <input
              type='text'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className='bg-transparent border-none p-0 text-white font-mono text-lg focus:ring-0 w-full'
            />
          </div>
        </div>
      </motion.div>

      {/* Chat Arena */}
      <AnimatePresence mode='wait'>
        {jobId ? (
          <motion.div
            key='chat-active'
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            className={`${styles.glassCard} flex flex-col`}
            style={{ minHeight: '520px' }}
          >
            {/* Chat header */}
            <div className='px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400'>
                  <FontAwesomeIcon icon={faRobot} />
                </div>
                <div>
                  <h3 className='font-bold text-white uppercase tracking-tight text-sm'>
                    Agent Chat
                  </h3>
                  <div className='font-mono text-[9px] text-white/30 truncate max-w-[260px]'>
                    JOB: {jobId}
                  </div>
                </div>
              </div>

              {/* Status badge */}
              <div>
                {(verificationStatus === 'verifying' ||
                  verificationStatus === 'processing') && (
                  <div
                    className={`${styles.badge} bg-amber-500/10 text-amber-400 border border-amber-500/20`}
                  >
                    <FontAwesomeIcon icon={faSpinner} spin />
                    {verificationStatus === 'verifying'
                      ? 'Syncing'
                      : 'Processing'}
                  </div>
                )}
                {verificationStatus === 'verified' && (
                  <div
                    className={`${styles.badge} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`}
                  >
                    <FontAwesomeIcon icon={faCheckCircle} /> Ready
                  </div>
                )}
                {verificationStatus === 'failed' && (
                  <div
                    className={`${styles.badge} bg-red-500/10 text-red-400 border border-red-500/20`}
                  >
                    <FontAwesomeIcon icon={faTimesCircle} /> Failed
                  </div>
                )}
              </div>
            </div>

            {/* Message list */}
            <div className='flex-1 overflow-y-auto custom-scrollbar px-6 py-4 flex flex-col gap-4'>
              {messages.length === 0 && (
                <div className='flex-1 flex flex-col items-center justify-center gap-3 py-16'>
                  <FontAwesomeIcon
                    icon={faRobot}
                    className='text-5xl text-white/80'
                  />
                  <span className='text-[10px] font-black tracking-[0.2em] uppercase text-white/40'>
                    Send a message to start the conversation
                  </span>
                </div>
              )}

              {messages.map((msg) => {
                if (msg.role === 'user') {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className='flex justify-end gap-3'
                    >
                      <div className='max-w-[75%] bg-white/10 border border-white/15 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed'>
                        {msg.content}
                      </div>
                      <div className='w-7 h-7 shrink-0 mt-1 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs'>
                        <FontAwesomeIcon icon={faUser} />
                      </div>
                    </motion.div>
                  );
                }

                if (msg.role === 'agent') {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className='flex justify-start gap-3'
                    >
                      <div className='w-7 h-7 shrink-0 mt-1 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs'>
                        <FontAwesomeIcon icon={faRobot} />
                      </div>
                      <div className='max-w-[75%] bg-white/5 border border-white/10 text-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap'>
                        {msg.content}
                      </div>
                    </motion.div>
                  );
                }

                // system / status messages
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='flex justify-center'
                  >
                    <div
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border ${
                        msg.isError
                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : 'bg-white/5 border-white/10 text-white/40'
                      }`}
                    >
                      {msg.isStatus && (
                        <FontAwesomeIcon
                          icon={faSpinner}
                          spin
                          className='text-[9px]'
                        />
                      )}
                      {msg.isError && (
                        <FontAwesomeIcon
                          icon={faTimesCircle}
                          className='text-[9px]'
                        />
                      )}
                      {msg.content}
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing indicator */}
              {isPrompting && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className='flex justify-start gap-3'
                >
                  <div className='w-7 h-7 shrink-0 mt-1 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs'>
                    <FontAwesomeIcon icon={faRobot} />
                  </div>
                  <div className='bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1'>
                    <span className='w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0ms]' />
                    <span className='w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:150ms]' />
                    <span className='w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:300ms]' />
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className='px-6 pb-6 pt-3'>
              <div className='flex items-center gap-3 bg-black/30 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-interactive/40 focus-within:ring-1 focus-within:ring-interactive/20 transition-all'>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className='flex-1 bg-transparent border-none p-0 text-white placeholder:text-white/20 focus:outline-none focus:ring-0 resize-none text-sm leading-relaxed max-h-32 overflow-y-auto custom-scrollbar'
                  placeholder='Type a message… (Enter to send, Shift+Enter for newline)'
                />
                <button
                  disabled={isPrompting || !prompt.trim()}
                  onClick={handleSendPrompt}
                  className='shrink-0 w-10 h-10 bg-interactive hover:bg-interactive/90 text-white rounded-xl shadow-lg shadow-interactive/30 flex items-center justify-center transition-all hover:scale-105 active:scale-90 disabled:opacity-20 disabled:scale-100 disabled:shadow-none'
                >
                  {isPrompting ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faPaperPlane} />
                  )}
                </button>
              </div>
              <p className='text-white/20 text-[10px] text-right mt-1.5 font-mono'>
                Enter ↵ to send · Shift+Enter for newline
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key='execution-idle'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='flex-1 py-12 flex flex-col items-center justify-center text-center gap-6'
          >
            <div className='w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 mb-2 shadow-inner shadow-white/5'>
              <FontAwesomeIcon icon={faRobot} className='text-4xl' />
            </div>
            <div>
              <h3 className='text-2xl font-black text-white uppercase tracking-tight'>
                System Inactive
              </h3>
              <p className='text-white/40 max-w-sm mx-auto mt-2'>
                Initialize a job configuration to establish a secure uplink with
                the AI agent.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback modal: rate 1–5 stars (half stars allowed), then submit to reputation registry */}
      {showFeedbackModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${styles.glassCard} max-w-md w-full p-8 flex flex-col gap-6`}
          >
            <h3 className='text-lg font-black text-white uppercase tracking-tight'>
              Rate the bot
            </h3>
            <p className='text-white/60 text-sm'>
              How was your experience? Each star = 20 (half stars allowed). Your rating is sent on-chain to the reputation registry.
            </p>
            <div className='flex items-center gap-0.5'>
              {[0, 1, 2, 3, 4].map((starIndex) => {
                const halfValue = starIndex * 20 + 10;
                const fullValue = (starIndex + 1) * 20;
                const showFull = feedbackRating >= fullValue;
                const showHalf = feedbackRating >= halfValue && !showFull;
                const filled = showFull || showHalf;
                return (
                  <div key={starIndex} className='relative flex w-10'>
                    <span className={`pointer-events-none text-2xl transition-colors ${filled ? 'text-amber-400' : 'text-white/20'}`}>
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
                      aria-label={`${starIndex + 0.5} stars`}
                    />
                    <button
                      type='button'
                      onClick={() => setFeedbackRating(fullValue)}
                      className='absolute left-1/2 top-0 w-1/2 h-full cursor-pointer'
                      aria-label={`${starIndex + 1} stars`}
                    />
                  </div>
                );
              })}
            </div>
            <p className='text-white/50 text-xs font-mono'>
              {feedbackRating > 0 ? `${feedbackRating / 20} star(s) (rating: ${feedbackRating})` : 'Tap stars to rate (each star = 20)'}
            </p>
            {feedbackError && (
              <p className='text-red-400 text-sm'>{feedbackError}</p>
            )}
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={handleCloseFeedbackModal}
                className='flex-1 px-4 py-3 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 transition-colors text-sm font-bold'
              >
                Skip
              </button>
              <button
                type='button'
                disabled={feedbackRating <= 0 || isSubmittingFeedback}
                onClick={handleSubmitFeedback}
                className={`flex-1 ${styles.actionButton} bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {isSubmittingFeedback ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Submitting…
                  </>
                ) : (
                  <>Submit feedback</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};
