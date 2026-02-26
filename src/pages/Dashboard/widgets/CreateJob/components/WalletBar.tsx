import {
  faBell,
  faClone,
  faCoins,
  faExternalLink,
  faPowerOff
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { truncateAddress } from '../createJob.utils';
import { NetworkBadge } from './NetworkBadge';

interface WalletBarProps {
  userAddress: string;
  addressCopied: boolean;
  networkId: string;
  isDevnet: boolean;
  needsFunds: boolean;
  onCopyAddress: () => void;
  onOpenExplorer: () => void;
  onShowFaucet: () => void;
  onNotifications: (e: React.MouseEvent) => void;
  onLogout: (e: React.MouseEvent) => void;
}

const walletBtn =
  'flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 cursor-pointer rounded-md px-2.5 py-1.5 hover:bg-zinc-800/50';

export const WalletBar = ({
  userAddress,
  addressCopied,
  networkId,
  isDevnet,
  needsFunds,
  onCopyAddress,
  onOpenExplorer,
  onShowFaucet,
  onNotifications,
  onLogout
}: WalletBarProps) => (
  <div className='px-3 xs:px-4 sm:px-5 pb-2.5 xs:pb-3 sm:pb-4 flex flex-wrap items-center justify-between gap-x-2 xs:gap-x-3 gap-y-1.5 border-t border-zinc-800/50 pt-2 xs:pt-2.5 sm:pt-3'>
    <div className='flex items-center gap-1.5 min-w-0'>
      <span className='text-sm font-mono text-zinc-500 truncate min-w-0 max-w-[100px] xs:max-w-[120px] sm:max-w-none'>
        {truncateAddress(userAddress)}
      </span>
      <button
        onClick={onCopyAddress}
        className={`${walletBtn} whitespace-nowrap ${
          addressCopied ? 'text-teal hover:text-teal' : ''
        }`}
      >
        <FontAwesomeIcon icon={faClone} className='text-sm' />
        <span>{addressCopied ? 'Copied' : 'Copy'}</span>
      </button>
      <button
        onClick={onOpenExplorer}
        className={`${walletBtn} whitespace-nowrap`}
      >
        <FontAwesomeIcon icon={faExternalLink} className='text-sm' />
        <span>Explorer</span>
      </button>
    </div>

    <div className='flex items-center gap-1.5'>
      {isDevnet && (
        <button
          onClick={onShowFaucet}
          className={`${walletBtn} ${
            needsFunds ? 'text-warning hover:text-warning' : ''
          }`}
        >
          <FontAwesomeIcon icon={faCoins} className='text-sm' />
          <span>Faucet</span>
        </button>
      )}
      <button onClick={onNotifications} className={walletBtn}>
        <FontAwesomeIcon icon={faBell} className='text-sm' />
        <span>Alerts</span>
      </button>
      <NetworkBadge networkId={networkId} />
      <button
        onClick={onLogout}
        className={`${walletBtn} hover:text-error/80 hover:bg-error/5`}
      >
        <FontAwesomeIcon icon={faPowerOff} className='text-sm' />
        <span>Disconnect</span>
      </button>
    </div>
  </div>
);
