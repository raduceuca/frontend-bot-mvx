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

export interface TrackTransactionParams {
  txHash: string;
  label: string;
  amount: string;
  token: string;
  status?: TxStatus;
}

export type MessageRole = 'user' | 'agent' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  isStatus?: boolean;
  isError?: boolean;
}

export type JobPhase =
  | 'idle'
  | 'creating'
  | 'ready'
  | 'prompting'
  | 'sending_tokens'
  | 'swapping'
  | 'rating'
  | 'error';

export interface ToastData {
  id: string;
  txHash: string;
  label: string;
  amount: string;
  token: string;
  status: 'confirmed' | 'failed';
}
