export const BATCH_TRANSACTIONS_SC = {
  egld_wEGLD: {
    contract: 'erd1qqqqqqqqqqqqqpgqpv09kfzry5y4sj05udcngesat07umyj70n4sa2c0rp',
    data: 'wrapEgld'
  },
  wEGLD_USDC: {
    contract: 'erd1qqqqqqqqqqqqqpgqtqfhy99su9xzjjrq59kpzpp25udtc9eq0n4sr90ax6',
    data: 'ESDTTransfer@5745474C442D613238633539@06f05b59d3b20000@73776170546f6b656e734669786564496e707574@555344432D333530633465@01'
  },
  wEGLD_MEX: {
    contract: 'erd1qqqqqqqqqqqqqpgqzw0d0tj25qme9e4ukverjjjqle6xamay0n4s5r0v9g',
    data: 'ESDTTransfer@5745474C442D613238633539@06f05b59d3b20000@73776170546f6b656e734669786564496e707574@4D45582D613635396430@01'
  },
  lock_MEX: {
    contract: 'erd1qqqqqqqqqqqqqpgq2l97gw2j4wnlem4y2rx7dudqlssjtwpu0n4sd0u3w2',
    data: 'ESDTTransfer@4D45582D613635396430@0de0b6b3a7640000@6c6f636b546f6b656e73@05a0'
  },
  multiTransfer_wEGLD_USDC: {
    data: 'MultiESDTNFTTransfer@address@02@5745474C442D613238633539@00@06f05b59d3b20000@555344432D333530633465@00@0f4240'
  }
};

export const GITHUB_REPO_URL = 'https://github.com/multiversx/mx-template-dapp';
export const apiTimeout = 6000;
export const nativeAuth = true;
export const transactionSize = 10;

// Generate your own WalletConnect 2 ProjectId here: https://cloud.walletconnect.com/app
export const walletConnectV2ProjectId = '9b1a9564f91cb659ffe21b73d5c4e2d8';

export const FACILITATOR_API_URL = 'https://x402-facilitator.elrond.ro';
export const TASK_SERVICE_API_URL = 'https://mx-bot-api.elrond.ro';
export const TASKCLAW_API_URL = 'https://devnet-taskclaw-api.multiversx.com';

/** Bot address that receives tokens (OpenClaw multiversx skill wallet). Override via env NEXT_PUBLIC_BOT_ADDRESS or VITE_BOT_ADDRESS. */
export const BOT_ADDRESS =
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BOT_ADDRESS
    ? process.env.NEXT_PUBLIC_BOT_ADDRESS
    : typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_BOT_ADDRESS
    ? (import.meta as any).env.VITE_BOT_ADDRESS
      : 'erd1px7l2nck0nk3j0c0dsftagvwhpdmmymac7rt0092j3vy9lef7q3qtzfs5z';

/** Reputation registry SC for giveFeedbackSimple. Override via NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS or VITE_REPUTATION_REGISTRY_ADDRESS. */
export const REPUTATION_REGISTRY_ADDRESS =
  typeof process !== 'undefined' &&
  process.env?.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS
    ? process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS
    : typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_REPUTATION_REGISTRY_ADDRESS
    ? (import.meta as any).env.VITE_REPUTATION_REGISTRY_ADDRESS
    : 'erd1qqqqqqqqqqqqqpgq5x2d2fnz5rt42k3ht8sq2el6992s4nv3d8ssqpg6de';
