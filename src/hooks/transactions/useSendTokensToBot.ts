import { ProxyNetworkProvider } from '@multiversx/sdk-core/out';
import { BOT_ADDRESS } from 'config';
import { signAndSendTransactions } from 'helpers';
import {
  Address,
  GAS_PRICE,
  parseAmount,
  Transaction,
  useGetAccount,
  useGetNetworkConfig
} from 'lib';

const SEND_TO_BOT_TRANSACTION_INFO = {
  processingMessage: 'Sending tokens to Max',
  errorMessage: 'Couldn\u2019t send tokens to Max',
  successMessage: 'Tokens sent to Max'
};

export interface SendToBotParams {
  token: string;
  nonce: number;
  amount: string;
}

export const useSendTokensToBot = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const sendTokensToBot = async (params: SendToBotParams) => {
    if (!BOT_ADDRESS) {
      throw new Error(
        'BOT_ADDRESS is not configured. Set VITE_BOT_ADDRESS (or NEXT_PUBLIC_BOT_ADDRESS) to the bot wallet address.'
      );
    }

    const { token, nonce, amount } = params;
    const paymentAmount = parseAmount(amount);
    const botReceiver = new Address(BOT_ADDRESS);

    let transaction: Transaction;

    if (token === 'EGLD') {
      transaction = new Transaction({
        value: BigInt(paymentAmount),
        data: new Uint8Array(0),
        receiver: botReceiver,
        gasLimit: BigInt(50000),
        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 2
      });
    } else {
      const tokenHex = Buffer.from(token).toString('hex');
      const amountHex = BigInt(paymentAmount).toString(16);
      const paddedAmountHex =
        amountHex.length % 2 === 0 ? amountHex : '0' + amountHex;

      let esdtData: string;
      if (nonce > 0) {
        const receiverHex = Buffer.from(
          botReceiver.getPublicKey() as Uint8Array
        ).toString('hex');
        const nonceHex = nonce.toString(16).padStart(2, '0');
        esdtData = `MultiESDTNFTTransfer@${receiverHex}@01@${tokenHex}@${nonceHex}@${paddedAmountHex}`;
      } else {
        esdtData = `ESDTTransfer@${tokenHex}@${paddedAmountHex}`;
      }

      transaction = new Transaction({
        value: BigInt(0),
        data: new Uint8Array(Buffer.from(esdtData)),
        receiver: botReceiver,
        gasLimit: BigInt(500000),
        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 2
      });
    }

    const networkProvider = new ProxyNetworkProvider(network.apiAddress);
    const account = await networkProvider.getAccount(new Address(address));
    transaction.nonce = account.nonce;

    const { sessionId, transactions } = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: SEND_TO_BOT_TRANSACTION_INFO
    });

    const sentTx = Array.isArray(transactions) ? transactions[0] : transactions;
    const txHash =
      (sentTx as any).hash || (sentTx as any).getHash?.()?.toString?.();

    // Wait for on-chain confirmation
    const MAX_POLL_ATTEMPTS = 20; // 20 × 3s = 60 seconds
    let txOnChain: any = null;
    let attempts = 0;

    while (!txOnChain || !txOnChain.status.isCompleted()) {
      if (++attempts > MAX_POLL_ATTEMPTS) {
        throw new Error(
          'Token transfer timed out. Check your wallet for confirmation.'
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      try {
        txOnChain = await networkProvider.getTransaction(txHash);
      } catch {
        // Transaction not yet propagated, retrying
      }
    }

    if (!txOnChain.status.isSuccessful()) {
      throw new Error(
        `Token transfer failed on-chain: ${txOnChain.status.toString()}`
      );
    }

    return { sessionId, txHash };
  };

  return { sendTokensToBot };
};
