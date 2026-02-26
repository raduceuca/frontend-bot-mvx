export type ChangelogTag = 'feature' | 'improvement' | 'fix' | 'milestone';

export interface ChangelogEntry {
  date: string;
  tag: ChangelogTag;
  title: string;
  description?: string;
}

export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [
  {
    date: '2026-02-26',
    tag: 'feature',
    title: 'Job history',
    description:
      'You can now see your previous jobs, including ratings and session details. Pick up where you left off or review past conversations.'
  },
  {
    date: '2026-02-25',
    tag: 'improvement',
    title: 'Redesigned experience',
    description:
      'A cleaner, more focused interface for chatting with Max — refined layout, better readability, and a smoother flow from job creation to rating.'
  },
  {
    date: '2026-02-24',
    tag: 'milestone',
    title: 'Max goes live',
    description:
      'First version of the bot on devnet. Connect your wallet, open a job, and chat with Max to execute on-chain actions in plain English.'
  }
];
