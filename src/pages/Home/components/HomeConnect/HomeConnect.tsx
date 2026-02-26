import { ReactComponent as LedgerIcon } from 'assets/img/ledger-icon.svg';
import { ReactComponent as MetamaskIcon } from 'assets/img/metamask-icon.svg';
import { ReactComponent as PasskeyIcon } from 'assets/img/passkey-icon.svg';
import { ReactComponent as WebWalletIcon } from 'assets/img/web-wallet-icon.svg';
import { ReactComponent as XPortalIcon } from 'assets/img/xportal-icon.svg';
import { BrowserEnum, getDetectedBrowser, getNetworkConfig } from 'lib';
import {
  CHROME_METAMASK_EXTENSION_LINK,
  FIREFOX_METAMASK_ADDON_LINK,
  GET_LEDGER,
  GET_XPORTAL
} from 'localConstants';
import { ConnectCard, ExtensionConnect } from './components';

// prettier-ignore
const styles = {
  howToConnectContainer: 'how-to-connect-container flex flex-col items-center w-full justify-center gap-10 lg:gap-14 pt-10 lg:pt-16 transition-all duration-200 ease-out',
  howToConnectHeader: 'how-to-connect-header flex flex-col gap-2 items-center justify-center text-center',
  howToConnectTitle: 'how-to-connect-title text-zinc-50 text-2xl sm:text-3xl font-semibold leading-[1.1] tracking-tight transition-all duration-200 ease-out',
  howToConnectDescription: 'how-to-connect-description text-zinc-400 text-base leading-relaxed transition-all duration-200 ease-out',
  howToConnectContent: 'how-to-connect-content flex flex-col gap-4 items-center justify-center w-full',
  howToConnectContentCards: 'how-to-connect-content-cards grid grid-cols-1 items-stretch justify-center sm:grid-cols-2 lg:grid-cols-3 gap-3'
} satisfies Record<string, string>;

export const HomeConnect = () => {
  const walletAddress = getNetworkConfig().network.walletAddress;

  const detectedBrowser = getDetectedBrowser();
  const isFirefox = detectedBrowser === BrowserEnum.Firefox;

  const connectCards = [
    {
      icon: MetamaskIcon,
      title: 'Metamask Snap',
      description:
        'Explore the entire MultiversX ecosystem with Metamask! Securely manage, swap and transfer your assets.',
      linkTitle: 'Get Metamask',
      linkDownloadAddress: isFirefox
        ? FIREFOX_METAMASK_ADDON_LINK
        : CHROME_METAMASK_EXTENSION_LINK
    },
    {
      icon: PasskeyIcon,
      title: 'Passkey',
      description:
        'Passkeys offer a more secure and user-friendly way to authenticate and sign transactions.',
      linkTitle: 'Get Passkey',
      linkDownloadAddress: walletAddress
    },
    {
      icon: XPortalIcon,
      title: 'xPortal Wallet',
      description:
        'The easiest way to invest, spend globally with a crypto card and earn yield across DeFi and stablecoins.',
      linkTitle: 'Get xPortal',
      linkDownloadAddress: GET_XPORTAL
    },
    {
      icon: LedgerIcon,
      title: 'Ledger',
      description:
        'You can safely store your xEGLD by installing the MultiversX xEGLD app on your Ledger Nano S or Ledger Nano X device',
      linkTitle: 'Get Started',
      linkDownloadAddress: GET_LEDGER
    },
    {
      icon: WebWalletIcon,
      title: 'MultiversX Web Wallet',
      description:
        'Store, swap, and transfer tokens or NFTs. Connect to Web3 apps on MultiversX blockchain.',
      linkTitle: 'Get MultiversX Wallet',
      linkDownloadAddress: walletAddress
    }
  ];

  return (
    <div className={styles.howToConnectContainer}>
      <div className={styles.howToConnectHeader}>
        <h1 className={styles.howToConnectTitle}>How can you connect</h1>

        <p className={styles.howToConnectDescription}>
          Choose your path, you must.
        </p>
      </div>

      <div className={styles.howToConnectContent}>
        <ExtensionConnect />

        <div className={styles.howToConnectContentCards}>
          {connectCards.map((card, index) => (
            <ConnectCard
              key={index}
              icon={card.icon}
              title={card.title}
              description={card.description}
              linkTitle={card.linkTitle}
              linkDownloadAddress={card.linkDownloadAddress}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
