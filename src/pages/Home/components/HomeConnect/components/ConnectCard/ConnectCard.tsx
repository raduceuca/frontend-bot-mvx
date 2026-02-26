import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FunctionComponent, SVGProps } from 'react';

// prettier-ignore
const styles = {
  connectCardContainer: 'connect-card-container bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col gap-6 rounded-xl hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-200 ease-out',
  connectCardText: 'connect-card-text flex flex-col gap-3 flex-1',
  connectCardTitle: 'connect-card-title text-xl text-zinc-50 font-medium tracking-tight leading-[1.1] transition-all duration-200 ease-out',
  connectCardDescription: 'connect-card-description text-zinc-400 text-base leading-relaxed transition-all duration-200 ease-out',
  connectCardLink: 'connect-card-link text-teal hover:text-teal/80 text-base font-semibold transition-all duration-200 ease-out flex items-center gap-2',
  connectCardLinkTitle: 'connect-card-link-title'
} satisfies Record<string, string>;

interface ConnectCardPropsType {
  icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  linkTitle: string;
  linkDownloadAddress: string;
}

export const ConnectCard = ({
  icon,
  title,
  description,
  linkTitle,
  linkDownloadAddress
}: ConnectCardPropsType) => {
  const IconComponent = icon;

  return (
    <div className={styles.connectCardContainer}>
      <IconComponent />

      <div className={styles.connectCardText}>
        <h2 className={styles.connectCardTitle}>{title}</h2>

        <p className={styles.connectCardDescription}>{description}</p>
      </div>

      <a
        href={linkDownloadAddress}
        target='_blank'
        rel='noopener noreferrer'
        className={styles.connectCardLink}
      >
        <span className={styles.connectCardLinkTitle}>{linkTitle}</span>

        <FontAwesomeIcon icon={faArrowRightLong} />
      </a>
    </div>
  );
};
