import { ProxyNetworkProvider } from '@multiversx/sdk-core/out';
import { REPUTATION_REGISTRY_ADDRESS } from 'config';
import { signAndSendTransactions } from 'helpers';
import {
  Address,
  GAS_PRICE,
  Transaction,
  useGetAccount,
  useGetNetworkConfig
} from 'lib';

const GIVE_FEEDBACK_TRANSACTION_INFO = {
  processingMessage: 'Submitting feedback',
  errorMessage: 'Failed to submit feedback',
  successMessage: 'Feedback submitted successfully'
};

/**
 * Builds and sends giveFeedbackSimple(job_id, agent_nonce, rating) to the reputation registry.
 * @param jobId - Job ID (64-char hex string from facilitator).
 * @param agentNonce - Agent nonce (u64).
 * @param rating - Score 10–100 (each star = 20, half stars allowed; 10, 20, …, 100).
 */
export const useGiveFeedback = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const giveFeedback = async (
    jobId: string,
    agentNonce: number,
    rating: number
  ) => {
    if (!REPUTATION_REGISTRY_ADDRESS) {
      throw new Error(
        'REPUTATION_REGISTRY_ADDRESS is not configured. Set VITE_REPUTATION_REGISTRY_ADDRESS (or NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS).'
      );
    }

    // Match init_job: job_id is the hex encoding of the job id string (UTF-8 bytes)
    const jobIdHex = Buffer.from(jobId, 'utf8').toString('hex');
    const agentNonceHex = BigInt(agentNonce).toString(16).padStart(16, '0');
    const ratingHex = BigInt(rating).toString(16);

    const dataStr = `giveFeedbackSimple@${jobIdHex}@${agentNonceHex}@${ratingHex}`;

    const transaction = new Transaction({
      value: BigInt(0),
      data: new Uint8Array(Buffer.from(dataStr)),
      receiver: new Address(REPUTATION_REGISTRY_ADDRESS),
      gasLimit: BigInt(5_000_000),
      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 2
    });

    const networkProvider = new ProxyNetworkProvider(network.apiAddress);
    const account = await networkProvider.getAccount(new Address(address));
    transaction.nonce = account.nonce;

    const { sessionId, transactions } = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: GIVE_FEEDBACK_TRANSACTION_INFO
    });

    const sentTx = Array.isArray(transactions) ? transactions[0] : transactions;
    const txHash =
      (sentTx as any).hash || (sentTx as any).getHash?.()?.toString?.();

    return { sessionId, txHash };
  };

  return { giveFeedback };
};
