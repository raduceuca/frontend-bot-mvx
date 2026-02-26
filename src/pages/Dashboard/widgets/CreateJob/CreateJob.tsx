import {
  faBolt,
  faChartLine,
  faCheckCircle,
  faChevronDown,
  faChevronUp,
  faComments,
  faLeaf,
  faPaperPlane,
  faRobot,
  faSpinner,
  faStar,
  faStarHalfStroke,
  faTimesCircle,
  faWallet
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { TASK_SERVICE_API_URL } from 'config';
import {
  useCreateJob,
  useGiveFeedback,
  useSendTokensToBot
} from 'hooks/transactions';
import { parseAmount, useGetAccount, useGetLoginInfo } from 'lib';
import { ItemsIdentifiersEnum } from 'pages/Dashboard/dashboard.types';

type MessageRole = 'user' | 'agent' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  isStatus?: boolean;
  isError?: boolean;
}

const styles = {
  container: 'create-job-container flex flex-col gap-4 w-full mx-auto flex-1',
  glassCard: 'bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden',
  header:
    'px-5 py-4 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-3',
  actionButton:
    'px-4 py-2.5 rounded-md font-medium text-base transition-colors duration-100 disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/20',
  badge: 'flex items-center gap-1.5 px-2 py-0.5 rounded text-base font-mono'
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
    if (typeof data?.jobId !== 'string' || typeof data?.agentNonce !== 'number')
      return null;
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
      messages: last.map((m) => ({
        role: m.role,
        content: m.content,
        isStatus: m.isStatus,
        isError: m.isError
      })),
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
  const [agentNonce, setAgentNonce] = useState(110);
  const [serviceId, setServiceId] = useState('1');
  const [token, setToken] = useState('EGLD');
  const [nonce, setNonce] = useState(0);
  const [amount, setAmount] = useState('0.05');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [jobId, setJobId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'verifying' | 'processing' | 'verified' | 'failed'
  >('idle');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isPrompting, setIsPrompting] = useState(false);

  const [isSendingToBot, setIsSendingToBot] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [egldAmountToBot, setEgldAmountToBot] = useState('1');
  const [hasSentToBotForJob, setHasSentToBotForJob] = useState(false);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<{
    jobId: string;
    agentNonce: number;
  } | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { address: userAddress } = useGetAccount();
  const { createJob } = useCreateJob();
  const { sendTokensToBot } = useSendTokensToBot();
  const { giveFeedback } = useGiveFeedback();
  const { tokenLogin } = useGetLoginInfo();

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

  useEffect(() => {
    if (jobId) {
      savePersistedJob(jobId, agentNonce, messages, hasSentToBotForJob);
    }
  }, [jobId, agentNonce, messages, hasSentToBotForJob]);

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
        content: `Couldn't start the job: ${errorMsg}`,
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
        content: 'Sending your request to the agent\u2026',
        isStatus: true
      });

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
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60;

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
            `Confirming payment on-chain\u2026 (attempt ${attempts})`
          );
        } else if (task.status === 'processing') {
          setVerificationStatus('processing');
          replaceLastSystemStatus('Agent is working\u2026');
        } else if (task.status === 'completed') {
          setVerificationStatus('verified');
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
            `Something went wrong: ${task.error || 'Unknown error'}`,
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
          'The agent took too long to respond. Try again?',
          true
        );
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '';
      replaceLastSystemStatus(`Connection lost: ${errorMsg}`, true);
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
      await giveFeedback(
        pendingFeedback.jobId,
        pendingFeedback.agentNonce,
        feedbackRating
      );
      handleCloseFeedbackModal();
    } catch (err: any) {
      setFeedbackError(
        err?.message ||
          err?.response?.data?.message ||
          "Couldn't submit your rating. Try again?"
      );
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
      const maxAttempts = 60;
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
            `Swap didn't go through: ${task.error || 'Unknown error'}`,
            true
          );
          completed = true;
        } else {
          replaceLastSystemStatus(
            `Agent is swapping your tokens\u2026 (${attempts})`
          );
        }
        if (!completed) {
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }
      }
      if (!completed) {
        replaceLastSystemStatus('The swap took too long. Try again?', true);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '';
      replaceLastSystemStatus(`Swap didn't go through: ${errorMsg}`, true);
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSendTokensToBot = async () => {
    if (hasSentToBotForJob) {
      pushMessage({
        role: 'agent',
        content:
          'You need to start a new job if you want me to trade for you again.'
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
        content: 'Agent is swapping your tokens\u2026',
        isStatus: true
      });
      setIsSwapping(true);
      await triggerSwapAndReturn();
      setHasSentToBotForJob(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '';
      pushMessage({
        role: 'system',
        content: `Couldn't send tokens to the bot: ${errorMsg}`,
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className={styles.glassCard}
      >
        <div className={styles.header}>
          <div>
            <h2 className='text-lg font-semibold text-zinc-50 tracking-tight'>
              MultiversX Bot
            </h2>
            <p className='text-base text-zinc-500'>Launch a new job</p>
          </div>

          <div className='flex items-center gap-3 flex-wrap'>
            {jobId && (
              <>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='text-base font-mono font-normal text-zinc-500 uppercase tracking-wider'>
                    EGLD:
                  </span>
                  <input
                    type='text'
                    value={egldAmountToBot}
                    onChange={(e) => setEgldAmountToBot(e.target.value)}
                    placeholder='Amount'
                    className='bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-50 font-mono text-base w-24 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors duration-100'
                  />
                </div>
                <button
                  disabled={
                    isCreating || isPrompting || isSendingToBot || isSwapping
                  }
                  onClick={handleSendTokensToBot}
                  className={`${styles.actionButton} bg-violet-600 hover:bg-violet-500 text-white min-w-[160px]`}
                >
                  {isSendingToBot ? (
                    <div className='flex items-center justify-center gap-2'>
                      <FontAwesomeIcon icon={faSpinner} spin /> SENDING\u2026
                    </div>
                  ) : isSwapping ? (
                    <div className='flex items-center justify-center gap-2'>
                      <FontAwesomeIcon icon={faSpinner} spin /> SWAPPING\u2026
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
                  className={`${styles.actionButton} bg-zinc-800 hover:bg-zinc-700 text-zinc-50 border border-zinc-700 min-w-[140px]`}
                >
                  <div className='flex items-center justify-center gap-2'>
                    <FontAwesomeIcon icon={faCheckCircle} /> FINISH JOB
                  </div>
                </button>
              </>
            )}
            {!jobId && (
              <button
                disabled={isCreating}
                onClick={handleCreateJob}
                className={`${styles.actionButton} bg-emerald-500 hover:bg-emerald-400 text-emerald-950 min-w-[160px]`}
              >
                {isCreating ? (
                  <div className='flex items-center justify-center gap-2'>
                    <FontAwesomeIcon icon={faSpinner} spin /> STARTING\u2026
                  </div>
                ) : (
                  <div className='flex items-center justify-center gap-2'>
                    <FontAwesomeIcon icon={faBolt} /> START JOB
                  </div>
                )}
              </button>
            )}
          </div>
        </div>

        <div className='px-5 py-3 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <span className='text-base font-mono font-normal text-zinc-500 uppercase tracking-wider'>
                Token
              </span>
              <span className='text-base font-mono text-zinc-50'>{token}</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-base font-mono font-normal text-zinc-500 uppercase tracking-wider'>
                Cost
              </span>
              <span className='text-base font-mono text-zinc-50'>
                {amount} EGLD
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowAdvanced((prev) => !prev)}
            className='text-base text-zinc-500 hover:text-zinc-50 transition-colors duration-100 flex items-center gap-1 cursor-pointer'
          >
            Advanced
            <FontAwesomeIcon
              icon={showAdvanced ? faChevronUp : faChevronDown}
            />
          </button>
        </div>

        {showAdvanced && (
          <div className='px-5 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-zinc-800 pt-3'>
            <div className='flex flex-col gap-1'>
              <span className='text-base font-mono font-normal text-zinc-500 uppercase tracking-wider'>
                Agent Nonce
              </span>
              <input
                type='number'
                value={agentNonce}
                onChange={(e) => setAgentNonce(Number(e.target.value))}
                className='bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-50 font-mono text-base focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors duration-100'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-base font-mono font-normal text-zinc-500 uppercase tracking-wider'>
                Service ID
              </span>
              <input
                type='text'
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className='bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-50 font-mono text-base focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors duration-100'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-base font-mono font-normal text-zinc-500 uppercase tracking-wider'>
                Token Nonce
              </span>
              <input
                type='number'
                value={nonce}
                onChange={(e) => setNonce(Number(e.target.value))}
                className='bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-50 font-mono text-base focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors duration-100'
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Chat */}
      <AnimatePresence mode='wait'>
        {jobId ? (
          <motion.div
            key='chat-active'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`${styles.glassCard} flex flex-col`}
            style={{ minHeight: '520px' }}
          >
            {/* Chat header */}
            <div className='px-5 py-3 border-b border-zinc-800 flex items-center justify-between'>
              <div className='flex items-center gap-2.5'>
                <div className='w-8 h-8 rounded-md bg-zinc-800 text-emerald-400 flex items-center justify-center'>
                  <FontAwesomeIcon icon={faRobot} />
                </div>
                <div>
                  <div className='text-base font-medium text-zinc-50'>
                    Agent Chat
                  </div>
                  <div className='text-base font-mono text-zinc-500 truncate max-w-[260px]'>
                    Job: {jobId}
                  </div>
                </div>
              </div>

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
            <div className='flex-1 overflow-y-auto custom-scrollbar px-5 py-4 flex flex-col gap-3'>
              {messages.length === 0 && (
                <div className='flex-1 flex flex-col items-center justify-center gap-3 py-16'>
                  <FontAwesomeIcon
                    icon={faRobot}
                    className='text-3xl text-zinc-600'
                  />
                  <span className='text-base text-zinc-500'>
                    Your agent is standing by
                  </span>
                  <div className='flex flex-wrap gap-2 mt-4 justify-center'>
                    <button
                      onClick={() =>
                        setPrompt(
                          'Start a Token Safari \u2014 explore trending tokens'
                        )
                      }
                      className='px-3 py-1.5 text-base text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 hover:text-zinc-50 hover:border-zinc-700 transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/20'
                    >
                      <FontAwesomeIcon
                        icon={faLeaf}
                        className='mr-1.5 text-emerald-400'
                      />{' '}
                      Token Safari
                    </button>
                    <button
                      onClick={() => setPrompt('What can you do?')}
                      className='px-3 py-1.5 text-base text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 hover:text-zinc-50 hover:border-zinc-700 transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/20'
                    >
                      <FontAwesomeIcon
                        icon={faComments}
                        className='mr-1.5 text-zinc-500'
                      />{' '}
                      What can you do?
                    </button>
                    <button
                      onClick={() =>
                        setPrompt('Show me trending tokens on devnet')
                      }
                      className='px-3 py-1.5 text-base text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 hover:text-zinc-50 hover:border-zinc-700 transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/20'
                    >
                      <FontAwesomeIcon
                        icon={faChartLine}
                        className='mr-1.5 text-zinc-500'
                      />{' '}
                      Trending tokens
                    </button>
                  </div>
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
                      className='flex justify-end'
                    >
                      <div className='max-w-[75%] bg-zinc-800 text-zinc-50 rounded-lg rounded-br-sm px-3 py-2.5 text-base'>
                        {msg.content}
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
                      className='flex justify-start gap-2.5'
                    >
                      <div className='w-7 h-7 shrink-0 mt-0.5 rounded-md bg-zinc-800 flex items-center justify-center text-emerald-400'>
                        <FontAwesomeIcon icon={faRobot} />
                      </div>
                      <div className='max-w-[75%] bg-zinc-900 border border-zinc-800 text-zinc-50 rounded-lg rounded-bl-sm px-3 py-2.5 text-base whitespace-pre-wrap'>
                        {msg.content}
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className='flex justify-center'
                  >
                    <div
                      className={`flex items-center gap-2 text-base ${
                        msg.isError
                          ? 'text-red-400'
                          : msg.isStatus
                          ? 'text-zinc-500'
                          : 'text-zinc-400'
                      }`}
                    >
                      {msg.isStatus && (
                        <div className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
                      )}
                      {msg.isError && <span>&times;</span>}
                      {msg.content}
                    </div>
                  </motion.div>
                );
              })}

              {isPrompting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className='flex justify-start gap-2.5'
                >
                  <div className='w-7 h-7 shrink-0 mt-0.5 rounded-md bg-zinc-800 flex items-center justify-center text-emerald-400'>
                    <FontAwesomeIcon icon={faRobot} />
                  </div>
                  <div className='bg-zinc-900 border border-zinc-800 rounded-lg rounded-bl-sm px-3 py-2.5 flex items-center gap-1.5'>
                    <span className='w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse' />
                    <span className='w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse [animation-delay:150ms]' />
                    <span className='w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse [animation-delay:300ms]' />
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className='px-5 pb-5 pt-3'>
              <div className='flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-colors duration-100'>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className='flex-1 bg-transparent border-none p-0 text-base text-zinc-50 placeholder:text-zinc-600 focus:outline-none focus:ring-0 resize-none leading-relaxed max-h-32 overflow-y-auto custom-scrollbar'
                  placeholder='Tell the agent what to do\u2026'
                />
                <button
                  disabled={isPrompting || !prompt.trim()}
                  onClick={handleSendPrompt}
                  className='shrink-0 w-9 h-9 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-md flex items-center justify-center transition-colors duration-100 disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/20'
                >
                  {isPrompting ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faPaperPlane} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key='execution-idle'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className='flex-1 py-12 flex flex-col items-center justify-center text-center gap-4'
          >
            <div className='w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600'>
              <FontAwesomeIcon icon={faRobot} className='text-3xl' />
            </div>
            <div>
              <p className='text-base font-medium text-zinc-50'>Agent Idle</p>
              <p className='text-base text-zinc-500 max-w-sm mx-auto mt-1'>
                Hit &ldquo;Start Job&rdquo; above to put the agent to work.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback modal */}
      {showFeedbackModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className='bg-zinc-900 border border-zinc-800 rounded-lg max-w-sm w-full p-6 flex flex-col gap-4'
          >
            <h3 className='text-lg font-semibold text-zinc-50 tracking-tight'>
              Rate your experience
            </h3>
            <p className='text-base text-zinc-500 leading-relaxed'>
              How did the agent do? Your rating goes on-chain.
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
                    <span
                      className={`pointer-events-none text-2xl transition-colors ${
                        filled ? 'text-amber-400' : 'text-zinc-700'
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
            <p className='text-base text-zinc-500 font-mono'>
              {feedbackRating > 0
                ? `${feedbackRating / 20} star(s) (rating: ${feedbackRating})`
                : 'Tap stars to rate (each star = 20)'}
            </p>
            {feedbackError && (
              <p className='text-red-400 text-base'>{feedbackError}</p>
            )}
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={handleCloseFeedbackModal}
                className='flex-1 px-3 py-2 rounded-md text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors duration-100 text-base font-medium cursor-pointer'
              >
                Skip
              </button>
              <button
                type='button'
                disabled={feedbackRating <= 0 || isSubmittingFeedback}
                onClick={handleSubmitFeedback}
                className='flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-md font-medium text-base transition-colors duration-100 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer'
              >
                {isSubmittingFeedback ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Submitting\u2026
                  </>
                ) : (
                  <>Submit</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
