import { motion } from 'motion/react';
import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

// ── Constants ──────────────────────────────────────────────────────

const LOW_BALANCE_THRESHOLD = BigInt('50000000000000000'); // 0.05 EGLD

const isBalanceLow = (balance: string) => {
  try {
    return BigInt(balance) < LOW_BALANCE_THRESHOLD;
  } catch {
    return true;
  }
};

// ── Component ──────────────────────────────────────────────────────

export const CreateJob = () => {
  // ── Config state ────────────────────────────────────────────────
  const [agentNonce, setAgentNonce] = useState(111);
  const [serviceId] = useState('1');
  const [token] = useState('EGLD');
  const [nonce] = useState(0);
  const [amount] = useState('0.05');

  // ── Core state machine ──────────────────────────────────────────
  const [phase, setPhase] = useState<JobPhase>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [hasSentTokens, setHasSentTokens] = useState(false);

  // ── Chat ────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState('');

  // ── UI toggles ──────────────────────────────────────────────────
  const [showFaucetPanel, setShowFaucetPanel] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(
    () => localStorage.getItem('mx_disclaimer_dismissed') === '1'
  );

  // ── Refs ────────────────────────────────────────────────────────
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── SDK hooks ───────────────────────────────────────────────────
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

  // ── Derived ─────────────────────────────────────────────────────
  const isBusy =
    phase === 'creating' ||
    phase === 'prompting' ||
    phase === 'sending_tokens' ||
    phase === 'swapping';

  const isDevnet = environment === EnvironmentsEnum.devnet;
  const needsFunds = isBalanceLow(balance);

  // ── Custom hooks ────────────────────────────────────────────────
  const chat = useChatMessages();
  const txTracking = useTransactionTracking();

  const resetAll = useCallback(() => {
    clearPersistedJob();
    setJobId(null);
    setPhase('idle');
    chat.clearMessages();
    setPrompt('');
    setAgentNonce(110);
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

  // ── Persistence ─────────────────────────────────────────────────
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

  // ── Auto-scroll chat ────────────────────────────────────────────
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [chat.messages, phase]);

  // ── Auto-resize textarea ────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [prompt]);

  // ── Escape key for faucet panel ─────────────────────────────────
  useEffect(() => {
    if (!showFaucetPanel) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFaucetPanel(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showFaucetPanel]);

  // ── Wallet handlers ─────────────────────────────────────────────
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

  // ── Job action wrappers ─────────────────────────────────────────
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

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div id={ItemsIdentifiersEnum.createJob} className={styles.container}>
      <div className='relative'>
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
            disclaimerDismissed={disclaimerDismissed}
            toasts={txTracking.toasts}
            trackedTransactions={txTracking.trackedTransactions}
            explorerAddress={network.explorerAddress}
            previousSessionsTotal={previousSessionsTotal}
            onConnect={handleConnect}
            onCreateJob={handleCreateJob}
            onShowFaucet={() => setShowFaucetPanel(true)}
            onDismissToast={txTracking.dismissToast}
            onDismissDisclaimer={() => {
              localStorage.setItem('mx_disclaimer_dismissed', '1');
              setDisclaimerDismissed(true);
            }}
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
      </div>

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

      {/* Disclaimer — iOS-style card, bottom of viewport */}
      {isLoggedIn && !jobId && !disclaimerDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{
            opacity: 1,
            y: 0,
            rotate: [0, -3, 3, -2, 1.5, -0.5, 0],
            boxShadow: [
              '0 8px 60px 20px rgba(9,9,11,0.9)',
              '0 8px 60px 20px rgba(9,9,11,0.9), 0 0 25px 6px rgba(251,191,36,0.3)',
              '0 8px 60px 20px rgba(9,9,11,0.9), 0 0 25px 6px rgba(251,191,36,0.3)',
              '0 8px 60px 20px rgba(9,9,11,0.9), 0 0 15px 3px rgba(251,191,36,0.15)',
              '0 8px 60px 20px rgba(9,9,11,0.9), 0 0 10px 2px rgba(251,191,36,0.08)',
              '0 8px 60px 20px rgba(9,9,11,0.9), 0 0 5px 1px rgba(251,191,36,0.04)',
              '0 8px 60px 20px rgba(9,9,11,0.9)'
            ]
          }}
          exit={{ opacity: 0, y: 60 }}
          transition={{
            opacity: { duration: 0.35, delay: 0.3 },
            y: { duration: 0.35, delay: 0.3, ease: [0.32, 0.72, 0, 1] },
            rotate: {
              delay: 2,
              duration: 0.6,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 5
            },
            boxShadow: {
              delay: 2,
              duration: 0.6,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 5
            }
          }}
          className='fixed left-3 right-3 sm:left-auto sm:right-4 sm:w-[320px] z-[100] rounded-2xl bg-zinc-900 border border-zinc-700/50 overflow-hidden'
          style={{ bottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
        >
          <img
            src='/disclaimer.webp'
            alt='Max holding a disclaimer sign'
            className='w-full aspect-video object-cover'
          />
          <div className='px-5 pt-4 pb-5 flex flex-col gap-4'>
            <div>
              <p className='text-lg font-medium text-zinc-100 leading-snug'>
                Max is an early demo
              </p>
              <p className='text-base text-zinc-400 leading-snug mt-1.5'>
                Not security-hardened, will make mistakes, and learn from them.
                Do not use him for any sensitive operations.
              </p>
            </div>
            <button
              type='button'
              onClick={() => {
                localStorage.setItem('mx_disclaimer_dismissed', '1');
                setDisclaimerDismissed(true);
              }}
              className='w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-750 text-base font-medium text-zinc-100 transition-colors duration-150 cursor-pointer'
            >
              Ok, I get it
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
