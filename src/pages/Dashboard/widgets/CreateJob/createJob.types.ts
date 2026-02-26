export type TxStatus = 'pending' | 'confirmed' | 'failed';

export interface TrackedTransaction {
  id: string;
  txHash: string;
  label: string;
  amount: string;
  token: string;
  status: TxStatus;
  timestamp: number;
}
