import { DateTime } from 'luxon';
import { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetNetworkConfig } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { version } from '../../../package.json';

// prettier-ignore
const styles = {
  footer: 'footer mx-auto w-full max-w-prose py-4 text-center',
  footerContainer: 'footer-container flex flex-col gap-1 font-medium items-center justify-center text-sm text-zinc-500',
  footerDisclaimerLink: 'footer-disclaimer-link cursor-pointer hover:underline hover:text-zinc-300 transition-colors duration-150 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 px-2 py-1.5 -mx-2',
  footerDescription: 'footer-description flex items-center justify-center gap-1 text-sm text-zinc-500',
  footerDescriptionNetwork: 'footer-description-network capitalize'
} satisfies Record<string, string>;

export const Footer = () => {
  const { network } = useGetNetworkConfig();
  const navigate = useNavigate();
  const currentYear = DateTime.now().year;

  const handleDisclaimerClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate(RouteNamesEnum.disclaimer);
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerDescription}>
          <button
            type='button'
            onClick={handleDisclaimerClick}
            className={styles.footerDisclaimerLink}
          >
            Disclaimer
          </button>
        </div>

        <div className={styles.footerDescription}>
          <span className={styles.footerDescriptionNetwork}>
            {network.id} Build
          </span>

          <span>{version}</span>
        </div>

        <div className={styles.footerDescription}>
          <span>&copy; MultiversX {currentYear}</span>
        </div>
      </div>
    </footer>
  );
};
