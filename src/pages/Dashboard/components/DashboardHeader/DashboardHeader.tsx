// prettier-ignore
const styles = {
  dashboardHeaderContainer: 'dashboard-header-container flex flex-col pt-0 pb-6 lg:pt-0 lg:pb-8 justify-center items-center gap-1 self-stretch',
  dashboardHeaderTitle: 'dashboard-header-title text-primary transition-all duration-300 text-center text-3xl xs:text-5xl lg:text-6xl font-medium',
  dashboardHeaderWelcome: 'text-secondary text-lg lg:text-xl font-medium mb-1'
} satisfies Record<string, string>;

export const DashboardHeader = () => (
  <div className={styles.dashboardHeaderContainer}>
    <div className={styles.dashboardHeaderWelcome}>Welcome to</div>
    <div className={styles.dashboardHeaderTitle}>MultiversX Bot</div>
  </div>
);
