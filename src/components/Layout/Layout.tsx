import { PropsWithChildren } from 'react';
import { AuthRedirectWrapper } from 'wrappers';
import { BuildYourAgent } from '../BuildYourAgent';
import { Footer } from '../Footer';

// prettier-ignore
const styles = {
  layoutContainer: 'layout-container flex min-h-dvh flex-col bg-accent transition-all duration-200 ease-out',
  mainContainer: 'main-container flex-grow flex justify-center'
} satisfies Record<string, string>;

export const Layout = ({ children }: PropsWithChildren) => {
  return (
    <div className={styles.layoutContainer}>
      <main className={styles.mainContainer}>
        <AuthRedirectWrapper>{children}</AuthRedirectWrapper>
      </main>

      <BuildYourAgent />
      <Footer />
    </div>
  );
};
