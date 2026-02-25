import { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { RouteNamesEnum } from 'localConstants';
import styles from './homeHero.styles';

export const HomeHero = () => {
  const navigate = useNavigate();

  const handleLogIn = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate(RouteNamesEnum.unlock);
  };

  return (
    <div className={styles.heroContainer}>
      <div className={styles.heroSectionTop}>
        <div className={styles.heroSectionTopContent}>
          <span className='text-base font-mono font-normal text-zinc-500 uppercase tracking-wider'>
            Autonomous Agent on MultiversX
          </span>
          <h1 className={styles.heroTitle}>MultiversX Bot</h1>
          <p className={styles.heroDescription}>
            Give an AI a wallet. See what happens.
          </p>
          <p className='text-base text-zinc-500 max-w-md'>
            MultiversX Bot listens, decides, and executes on-chain — swaps,
            transfers, contract calls. No hand-holding required.
          </p>
        </div>
        <div className={styles.heroSectionTopButtons}>
          <button
            onClick={handleLogIn}
            className='bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-medium text-base rounded-md px-4 py-2 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/20 cursor-pointer'
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
};
