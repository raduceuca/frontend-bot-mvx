import { Outlet } from 'react-router-dom';
import { HomeCapabilities } from './components/HomeCapabilities';
import { HomeHero } from './components/HomeHero';

const styles = {
  container:
    'flex flex-col items-center gap-8 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-16'
} satisfies Record<string, string>;

export const Home = () => (
  <div className={styles.container}>
    <HomeHero />
    <HomeCapabilities />
    <Outlet />
  </div>
);
