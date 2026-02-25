import { Outlet } from 'react-router-dom';
import { HomeCapabilities } from './components/HomeCapabilities';
import { HomeHero } from './components/HomeHero';

const styles = {
  container:
    'flex flex-col items-center w-full max-w-3xl mx-auto px-4 pb-16 gap-12 lg:gap-16'
} satisfies Record<string, string>;

export const Home = () => (
  <div className={styles.container}>
    <HomeHero />
    <HomeCapabilities />
    <Outlet />
  </div>
);
