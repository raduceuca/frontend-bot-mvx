import axios from 'axios';
import { TASK_SERVICE_API_URL } from 'config';
import { parseAmount } from 'lib';
import { JobPhase, TrackTransactionParams } from '../createJob.types';
import { isUserCancellation } from '../createJob.utils';

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

// eslint-disable-next-line prettier/prettier
export const TASK_GREETING = 'Hello there! \u{1F44B} I\'m your helpful MultiversX devnet assistant. I can explain tokens and swaps in plain language, explore devnet data with my MultiversX tools, and help you understand and use features like the mystery box. Ask what you\'re curious about and I\'ll keep it clear and honest.';

const buildSwapPrompt = (userAddress: string, amountAtoms: string) =>
  `[MYSTERY_BOX_BUTTON_TRIGGERED] The user at address ${userAddress} just sent ${amountAtoms} atoms of EGLD to the bot. Use the mx-swap-and-return skill:

IMPORTANT: This feature is called "Mystery Box" in our UI. Always refer to it as "Mystery Box".

1. Save this amount: user address = ${userAddress}, received token = EGLD, amount = ${amountAtoms} atoms.
2. Call the DEX metadata API (GET the same API base URL as this task service + /dex/metadata, e.g. https://mx-bot-api.elrond.ro/dex/metadata) to get the list of available tradeable tokens.
3. From the response, pick between 1 and 4 output tokens with reasoning (e.g. liquidity, diversity; exclude the input token). State briefly why you chose each.
4. Run run_swap_and_return.py with: --user-address ${userAddress} --received-token EGLD --amount ${amountAtoms} --output-tokens <your selected tokens comma-separated>. Use default bot PEM.
5. The user at ${userAddress} must receive the swapped tokens.
6. In your final report you MUST include: (a) your reasoning for choosing each output token (why you picked them), and (b) a clear line telling the user to check their wallet for their newly swapped tokens. Report which tokens and amounts were sent.`;

interface ChatMessageHelpers {
  pushMessage: (msg: {
    role: 'user' | 'agent' | 'system';
    content: string;
    isStatus?: boolean;
    isError?: boolean;
  }) => void;
  replaceLastStatus: (content: string, isError?: boolean) => void;
  removeLastStatus: () => void;
  appendToLastAgentMessage: (chunk: string) => void;
}

interface UseJobActionsParams {
  jobId: string | null;
  agentNonce: number;
  serviceId: string;
  token: string;
  nonce: number;
  amount: string;
  userAddress: string;
  hasSentTokens: boolean;
  nativeAuthToken: string | undefined;
  chat: ChatMessageHelpers;
  setPhase: (phase: JobPhase) => void;
  setJobId: (id: string | null) => void;
  setHasSentTokens: (val: boolean) => void;
  trackTransaction: (params: TrackTransactionParams) => string;
  refetchSessions: () => void;
  createJob: (
    agentNonce: number,
    serviceId: string,
    payment: { token: string; nonce: number; amount: string }
  ) => Promise<{ jobId: string; txHash: string }>;
  sendTokensToBot: (params: {
    token: string;
    nonce: number;
    amount: string;
  }) => Promise<{ txHash: string }>;
}

export const useJobActions = ({
  jobId,
  agentNonce,
  serviceId,
  token,
  nonce,
  amount,
  userAddress,
  hasSentTokens,
  nativeAuthToken,
  chat,
  setPhase,
  setJobId,
  setHasSentTokens,
  trackTransaction,
  refetchSessions,
  createJob,
  sendTokensToBot
}: UseJobActionsParams) => {
  /** SSE streaming: connect to /tasks/:taskId/stream for real-time events. */
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
            Authorization: `Bearer ${nativeAuthToken}`,
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
        if (done) break;

        const { value } = readResult;
        if (!value) continue;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          const match = chunk.match(/^data: (.+)$/m);
          if (!match) continue;

          let data: Record<string, unknown>;
          try {
            data = JSON.parse(match[1]);
          } catch {
            continue;
          }

          if (data.event === 'delta' && data.content) {
            chat.appendToLastAgentMessage(String(data.content));
          } else if (data.event === 'line' && data.line) {
            chat.appendToLastAgentMessage(`${String(data.line)}\n`);
          } else if (data.event === 'status') {
            onStatus(
              data.status as 'completed' | 'failed',
              data.result as string | undefined,
              data.error as string | undefined
            );
            return;
          }
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Stream connection failed';
      onStatus('failed', undefined, message);
    }
  };

  const handleCreateJob = async () => {
    try {
      setPhase('creating');
      setJobId(null);

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
      chat.pushMessage({
        role: 'agent',
        content: TASK_GREETING
      });
      refetchSessions();
    } catch (err: unknown) {
      if (isUserCancellation(err)) {
        setPhase('idle');
        return;
      }
      const errorMsg = err instanceof Error ? err.message : String(err ?? '');
      chat.pushMessage({
        role: 'system',
        content: `Couldn't start the chat: ${errorMsg}`,
        isError: true
      });
      setPhase('error');
    }
  };

  const handleSendPrompt = async (promptText: string) => {
    if (!jobId || !promptText.trim()) return;

    chat.pushMessage({ role: 'user', content: promptText });
    setPhase('prompting');
    chat.pushMessage({
      role: 'system',
      content: 'Sending to Max\u2026',
      isStatus: true
    });

    try {
      const { data: initData } = await axios.post(
        `${TASK_SERVICE_API_URL}/start-task`,
        { jobId, prompt: promptText },
        {
          headers: {
            Authorization: `Bearer ${nativeAuthToken}`
          }
        }
      );

      await streamTaskEvents(initData.taskId, (status, result, error) => {
        chat.removeLastStatus();
        if (status === 'completed') {
          if (result) {
            chat.pushMessage({
              role: 'agent',
              content: parseAgentResponse(result)
            });
          }
          setPhase('ready');
        } else {
          chat.replaceLastStatus(
            `Something went wrong: ${error || 'Unknown error'}`,
            true
          );
          setPhase('error');
        }
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err ?? '');
      chat.replaceLastStatus(`Connection lost: ${errorMsg}`, true);
      setPhase('error');
    }
  };

  const handleMysteryBox = async (sendAmount = '1') => {
    if (!userAddress || !jobId) return;
    if (hasSentTokens) {
      chat.pushMessage({
        role: 'agent',
        content: 'Start a new chat if you want me to trade for you again.'
      });
      return;
    }

    chat.pushMessage({
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

      chat.pushMessage({
        role: 'system',
        content: `${sendAmount} xEGLD sent to Max. Transaction confirmed.`
      });
      chat.pushMessage({
        role: 'system',
        content: 'Max is crawling through tokens\u2026',
        isStatus: true
      });
    } catch (err: unknown) {
      if (isUserCancellation(err)) {
        chat.replaceLastStatus(
          'Token transfer cancelled. Your job is still active \u2014 you can retry.',
          false
        );
      } else {
        const errorMsg = err instanceof Error ? err.message : String(err ?? '');
        chat.replaceLastStatus(`Token transfer failed: ${errorMsg}`, true);
      }
      setPhase('ready');
      return;
    }

    // Step 2: Trigger the swap (no signing, just API + streaming)
    try {
      setPhase('swapping');
      const amountAtoms = parseAmount(sendAmount);
      const swapPrompt = buildSwapPrompt(userAddress, amountAtoms);

      const { data: initData } = await axios.post(
        `${TASK_SERVICE_API_URL}/start-task`,
        { jobId, prompt: swapPrompt },
        {
          headers: {
            Authorization: `Bearer ${nativeAuthToken}`
          }
        }
      );

      await streamTaskEvents(initData.taskId, (status, _result, error) => {
        chat.removeLastStatus();
        if (status === 'completed') {
          setHasSentTokens(true);
          setPhase('ready');
        } else {
          chat.replaceLastStatus(
            `Couldn't complete the swap: ${error || 'Unknown error'}`,
            true
          );
          setHasSentTokens(true);
          setPhase('error');
        }
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err ?? '');
      chat.replaceLastStatus(`Couldn't complete the swap: ${errorMsg}`, true);
      setHasSentTokens(true);
      setPhase('error');
    }
  };

  return { handleCreateJob, handleSendPrompt, handleMysteryBox };
};
