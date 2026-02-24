import classNames from 'classnames';
import { FunctionComponent, MouseEvent, SVGProps } from 'react';
import { useNavigate } from 'react-router-dom';

import { ReactComponent as HomeDarkThemeIcon } from 'assets/icons/home-dark-theme-icon.svg';
import { ReactComponent as HomeLightThemeIcon } from 'assets/img/bright-light-icon.svg';
import { ReactComponent as HomeVibeThemeIcon } from 'assets/img/vibe-mode-icon.svg';
import { Button } from 'components/Button';
import {
  ThemeOptionType,
  useHandleThemeManagement
} from 'hooks/useHandleThemeManagement';
import { RouteNamesEnum } from 'localConstants';
import styles from './homeHero.styles';

interface HomeThemeOptionType extends ThemeOptionType {
  icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  backgroundClass: string;
  title: string;
}

const themeExtraProperties: Record<
  string,
  Omit<HomeThemeOptionType, keyof ThemeOptionType>
> = {
  'mvx:dark-theme': {
    icon: HomeDarkThemeIcon,
    title: 'Customizable',
    backgroundClass: 'bg-dark-theme'
  },
  'mvx:vibe-theme': {
    icon: HomeVibeThemeIcon,
    title: 'Vibrant',
    backgroundClass: 'bg-vibe-theme'
  },
  'mvx:light-theme': {
    icon: HomeLightThemeIcon,
    title: 'Ownable',
    backgroundClass: 'bg-light-theme'
  }
};

export const HomeHero = () => {
  const navigate = useNavigate();

  const { activeTheme } = useHandleThemeManagement();

  const handleLogIn = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate(RouteNamesEnum.unlock);
  };

  const activeHomeTheme = activeTheme
    ? { ...activeTheme, ...themeExtraProperties[activeTheme.identifier] }
    : null;

  const heroContainerClasses = activeHomeTheme
    ? classNames(styles.heroContainer, activeHomeTheme.backgroundClass)
    : styles.heroContainer;

  return (
    <div className={heroContainerClasses}>
      <div className={styles.heroSectionTop}>
        <div className={styles.heroSectionTopContent}>
          <h1 className={styles.heroTitle}>MultiversX Bot</h1>

          <p className={styles.heroDescription}>
            A powerful MultiversX bot that can help you with many things.
          </p>
        </div>

        <div className={styles.heroSectionTopButtons}>
          <Button onClick={handleLogIn}>Connect Wallet</Button>


        </div>
      </div>

      {/* Hero section bottom removed as there is only one theme */}
    </div>
  );
};
