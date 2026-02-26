import {
  faCheckCircle,
  faGift,
  faSpinner,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { TASK_SERVICE_API_URL } from 'config';
import { useCreateJob, useSendTokensToBot } from 'hooks/transactions';
import { parseAmount, useGetAccount, useGetLoginInfo } from 'lib';
import { ItemsIdentifiersEnum } from 'pages/Dashboard/dashboard.types';

type MysteryBoxStatus =
  | 'idle'
  | 'creating'
  | 'sending'
  | 'swapping'
  | 'complete'
  | 'failed';

interface SwapResult {
  content: string;
}

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

export const MysteryBox = () => {
  const [status, setStatus] = useState<MysteryBoxStatus>('idle');
  const [result, setResult] = useState<SwapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { address: userAddress } = useGetAccount();
  const { createJob } = useCreateJob();
  const { sendTokensToBot } = useSendTokensToBot();
  const { tokenLogin } = useGetLoginInfo();

  const handleOpenMysteryBox = async () => {
    if (!userAddress) return;

    setStatus('creating');
    setResult(null);
    setError(null);

    try {
      const { jobId } = await createJob(110, '1', {
        token: 'EGLD',
        nonce: 0,
        amount: '1'
      });

      setStatus('sending');
      await sendTokensToBot({
        token: 'EGLD',
        nonce: 0,
        amount: '1'
      });

      setStatus('swapping');
      const amountAtoms = parseAmount('1');
      const swapPrompt = `The user at address ${userAddress} just sent ${amountAtoms} atoms of EGLD to the bot. Use the mx-swap-and-return skill:

1. Save this amount: user address = ${userAddress}, received token = EGLD, amount = ${amountAtoms} atoms.
2. Call the DEX metadata API (GET the same API base URL as this task service + /dex/metadata, e.g. https://mx-bot-api.elrond.ro/dex/metadata) to get the list of available tradeable tokens.
3. From the response, pick between 1 and 4 output tokens with reasoning (e.g. liquidity, diversity; exclude the input token). State briefly why you chose each.
4. Run run_swap_and_return.py with: --user-address ${userAddress} --received-token EGLD --amount ${amountAtoms} --output-tokens <your selected tokens comma-separated>. Use default bot PEM.
5. The user at ${userAddress} must receive the swapped tokens.
6. In your final report you MUST include: (a) your reasoning for choosing each output token (why you picked them), and (b) a clear line telling the user to check their wallet for their newly swapped tokens. Report which tokens and amounts were sent.`;

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
          setResult({ content: parseAgentResponse(task.result) });
          setStatus('complete');
          completed = true;
        } else if (task.status === 'failed') {
          setError(task.error || 'Swap failed');
          setStatus('failed');
          completed = true;
        }

        if (!completed) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      if (!completed) {
        setError('The swap took too long. Try again?');
        setStatus('failed');
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Something went wrong';
      setError(errorMsg);
      setStatus('failed');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResult(null);
    setError(null);
  };

  const isProcessing =
    status === 'creating' || status === 'sending' || status === 'swapping';

  const statusMessages: Record<string, string> = {
    creating: 'Creating job\u2026',
    sending: 'Sending 1 EGLD to the agent\u2026',
    swapping: 'Agent is choosing tokens and swapping\u2026'
  };

  return (
    <div id={ItemsIdentifiersEnum.mysteryBox} className='flex flex-col gap-4'>
      <p className='text-base text-zinc-400 leading-relaxed'>
        Let the agent trade 1 EGLD on xExchange. See what comes back.
      </p>

      <AnimatePresence mode='wait'>
        {status === 'idle' && (
          <motion.div
            key='idle'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <button
              onClick={handleOpenMysteryBox}
              disabled={!userAddress}
              className='flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-medium text-base rounded-md transition-colors duration-100 disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/20'
            >
              <FontAwesomeIcon icon={faGift} />
              Open Mystery Box
            </button>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div
            key='processing'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className='flex items-center gap-3 text-zinc-400'
          >
            <div className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
            <span className='text-base text-zinc-500'>
              {statusMessages[status]}
            </span>
          </motion.div>
        )}

        {status === 'complete' && result && (
          <motion.div
            key='complete'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className='flex flex-col gap-4'
          >
            <div className='flex items-center gap-2 text-emerald-400 text-base'>
              <FontAwesomeIcon icon={faCheckCircle} />
              Mystery Box opened!
            </div>
            <div className='bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-base text-zinc-50 whitespace-pre-wrap leading-relaxed'>
              {result.content}
            </div>
            <button
              onClick={handleReset}
              className='self-start flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-medium text-base rounded-md transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/20'
            >
              <FontAwesomeIcon icon={faGift} />
              Open Another
            </button>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div
            key='failed'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className='flex flex-col gap-3'
          >
            <div className='flex items-center gap-2 text-red-400 text-base'>
              <FontAwesomeIcon icon={faTimesCircle} />
              {error}
            </div>
            <button
              onClick={handleReset}
              className='self-start px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-50 border border-zinc-700 rounded-md text-base font-medium transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/20'
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
