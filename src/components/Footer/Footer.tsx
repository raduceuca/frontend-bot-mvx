import { DateTime } from 'luxon';
import { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetNetworkConfig } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { version } from '../../../package.json';

// prettier-ignore
const styles = {
  footer: 'footer mx-auto w-full max-w-4xl px-4 sm:px-6 py-4 xs:py-6 border-t border-zinc-800/50',
  footerContainer: 'footer-container flex flex-col sm:flex-row gap-2 sm:gap-0 font-medium items-center justify-between text-sm text-zinc-500',
  footerLinks: 'footer-links flex items-center gap-2',
  footerLink: 'footer-link cursor-pointer hover:underline hover:text-zinc-300 transition-colors duration-150 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 px-2 py-1.5 -mx-2',
  footerDescription: 'footer-description flex items-center justify-center gap-1 text-sm text-zinc-500',
  footerDescriptionNetwork: 'footer-description-network capitalize'
} satisfies Record<string, string>;

export const Footer = () => {
  const { network } = useGetNetworkConfig();
  const navigate = useNavigate();
  const currentYear = DateTime.now().year;

  const handleWhatsNewClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate(RouteNamesEnum.whatsNew);
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerDescription}>
          <span>&copy; MultiversX {currentYear}</span>
          <span className='text-zinc-600 hidden sm:inline'>&middot;</span>
          <span className={styles.footerDescriptionNetwork}>{network.id}</span>
          <span>{version}</span>
        </div>

        <div className={styles.footerLinks}>
          <button
            type='button'
            onClick={handleWhatsNewClick}
            className={styles.footerLink}
          >
            What&rsquo;s New
          </button>
        </div>
      </div>
    </footer>
  );
};
