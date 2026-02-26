import axios from 'axios';
import { FACILITATOR_API_URL } from 'config';
import { signAndSendTransactions } from 'helpers';
import {
  Address,
  ApiNetworkProvider,
  GAS_PRICE,
  parseAmount,
  Transaction,
  TransactionWatcher,
  useGetAccount,
  useGetNetworkConfig
} from 'lib';

const CREATE_JOB_TRANSACTION_INFO = {
  processingMessage: 'Max is initializing\u2026',
  errorMessage: 'Couldn\u2019t start the chat',
  successMessage: 'Chat started'
};

export interface PrepareResponse {
  jobId: string;
  amount: string;
  token: string;
  pnonce: number;
  receiver: string;
  data: string;
  registryAddress: string;
}

export interface JobOverrides {
  token?: string;
  nonce?: number;
  amount?: string;
}

export const useCreateJob = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const createJob = async (
    agentNonce: number,
    serviceId: string,
    overrides?: JobOverrides
  ) => {
    try {
      // 1. Call Facilitator /prepare
      const { data: prepareData } = await axios.post<PrepareResponse>(
        `${FACILITATOR_API_URL}/prepare`,
        {
          agentNonce,
          serviceId,
          employerAddress: address
        }
      );

      // 2. Determine payment details
      const paymentToken = overrides?.token || prepareData.token;
      const paymentNonce =
        overrides?.nonce !== undefined ? overrides.nonce : prepareData.pnonce;

      let paymentAmount = prepareData.amount;
      if (overrides?.amount) {
        paymentAmount = parseAmount(overrides.amount);
      }

      // 3. Build Transaction
      let transaction: Transaction;

      if (paymentToken === 'EGLD') {
        transaction = new Transaction({
          value: BigInt(paymentAmount),
          data: new Uint8Array(Buffer.from(prepareData.data)),
          receiver: new Address(prepareData.registryAddress),
          gasLimit: BigInt(10000000),
          gasPrice: BigInt(GAS_PRICE),
          chainID: network.chainId,
          sender: new Address(address),
          version: 2
        });
      } else {
        // ESDT Payment
        const receiver = new Address(prepareData.registryAddress);
        const tokenHex = Buffer.from(paymentToken).toString('hex');
        const nonceHex = paymentNonce.toString(16).padStart(2, '0');
        const amountHex = BigInt(paymentAmount).toString(16);
        const paddedAmountHex =
          amountHex.length % 2 === 0 ? amountHex : '0' + amountHex;

        const funcHex = Buffer.from('init_job').toString('hex');
        // prepareData.data is "init_job@arg1@arg2..."
        const args = prepareData.data.split('@').slice(1);

        let esdtData: string;
        if (paymentNonce > 0) {
          const receiverHex = Buffer.from(
            receiver.getPublicKey() as Uint8Array
          ).toString('hex');
          esdtData = `MultiESDTNFTTransfer@${receiverHex}@01@${tokenHex}@${nonceHex}@${paddedAmountHex}@${funcHex}${
            args.length > 0 ? '@' + args.join('@') : ''
          }`;
        } else {
          esdtData = `ESDTTransfer@${tokenHex}@${paddedAmountHex}@${funcHex}${
            args.length > 0 ? '@' + args.join('@') : ''
          }`;
        }

        transaction = new Transaction({
          value: BigInt(0),
          data: new Uint8Array(Buffer.from(esdtData)),
          receiver: receiver,
          gasLimit: BigInt(15000000),
          gasPrice: BigInt(GAS_PRICE),
          chainID: network.chainId,
          sender: new Address(address),
          version: 2
        });
      }

      const networkProvider = new ApiNetworkProvider(network.apiAddress);
      const account = await networkProvider.getAccount(new Address(address));
      transaction.nonce = account.nonce;
      transaction.gasLimit = BigInt(20000000);

      const { sessionId, transactions } = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: CREATE_JOB_TRANSACTION_INFO
      });

      const sentTx = Array.isArray(transactions)
        ? transactions[0]
        : transactions;

      // 4. Wait for the transaction to be processed on-chain
      const txHash =
        (sentTx as any).hash || (sentTx as any).getHash().toString();

      const watcher = new TransactionWatcher(networkProvider, {
        timeoutMilliseconds: 180_000, // 3 minutes (devnet can be slow)
        pollingIntervalMilliseconds: 3_000
      });
      const txOnChain = await watcher.awaitCompleted(txHash);

      // 5. Check the final status
      if (!txOnChain.status.isSuccessful()) {
        throw new Error(
          `Transaction failed with status: ${txOnChain.status.toString()}`
        );
      }

      return { sessionId, jobId: prepareData.jobId, txHash };
    } catch (err) {
      throw err;
    }
  };

  return { createJob };
};
