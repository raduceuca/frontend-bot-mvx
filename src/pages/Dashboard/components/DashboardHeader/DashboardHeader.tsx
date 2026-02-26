const styles = {
  container:
    'flex flex-col pt-0 pb-6 lg:pt-0 lg:pb-8 justify-center items-center gap-2 self-stretch',
  statusLine: 'flex items-center gap-2',
  statusDot: 'w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse',
  statusText:
    'text-base font-mono font-normal text-zinc-500 uppercase tracking-wider',
  title: 'text-2xl font-semibold text-zinc-50 tracking-tight'
} satisfies Record<string, string>;

export const DashboardHeader = () => (
  <div className={styles.container}>
    <div className={styles.statusLine}>
      <span className={styles.statusDot} />
      <span className={styles.statusText}>Your agent is ready</span>
    </div>
    <h1 className={styles.title}>What do you want it to do?</h1>
  </div>
);
