import {
  faArrowUp,
  faTrophy,
  faWandMagicSparkles,
  faWrench,
  IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMemo } from 'react';
import {
  CHANGELOG_ENTRIES,
  ChangelogEntry,
  ChangelogTag
} from 'data/changelog';

interface TagConfig {
  label: string;
  icon: IconDefinition;
  dot: string;
  badge: string;
}

const TAG_CONFIG: Record<ChangelogTag, TagConfig> = {
  feature: {
    label: 'Feature',
    icon: faWandMagicSparkles,
    dot: 'bg-teal',
    badge: 'bg-teal/10 text-teal'
  },
  improvement: {
    label: 'Improvement',
    icon: faArrowUp,
    dot: 'bg-blue-400',
    badge: 'bg-blue-400/10 text-blue-400'
  },
  fix: {
    label: 'Fix',
    icon: faWrench,
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-400'
  },
  milestone: {
    label: 'Milestone',
    icon: faTrophy,
    dot: 'bg-amber-400',
    badge: 'bg-amber-400/10 text-amber-400'
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatMonthYear = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
};

const groupByMonth = (
  entries: readonly ChangelogEntry[]
): Map<string, ChangelogEntry[]> => {
  const groups = new Map<string, ChangelogEntry[]>();

  for (const entry of entries) {
    const key = entry.date.slice(0, 7);
    const existing = groups.get(key) ?? [];
    groups.set(key, [...existing, entry]);
  }

  return groups;
};

// prettier-ignore
const styles = {
  container: 'mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 xs:py-12',
  header: 'mb-6 xs:mb-10',
  title: 'text-xl xs:text-2xl font-bold text-primary',
  subtitle: 'mt-2 text-sm text-secondary',
  monthLabel: 'mb-4 mt-8 first:mt-0 text-sm font-medium uppercase tracking-wider text-zinc-500',
  timeline: 'relative ml-3 border-l border-zinc-800',
  entry: 'relative pl-6 xs:pl-8 pb-6 xs:pb-8 last:pb-0',
  dot: 'absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-zinc-950',
  card: 'rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 xs:px-4 py-2.5 xs:py-3',
  cardHeader: 'flex flex-wrap items-center gap-2',
  badge: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium',
  badgeIcon: 'text-sm',
  date: 'text-sm tabular-nums text-zinc-500',
  cardTitle: 'mt-1.5 text-base font-medium text-primary',
  cardDescription: 'mt-1 text-base leading-relaxed text-secondary text-pretty'
} satisfies Record<string, string>;

export const WhatsNew = () => {
  const groups = useMemo(() => groupByMonth(CHANGELOG_ENTRIES), []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>What&rsquo;s New</h1>
        <p className={styles.subtitle}>
          Latest updates and improvements to Max.
        </p>
      </div>

      {Array.from(groups.entries()).map(([monthKey, entries]) => (
        <section key={monthKey}>
          <h2 className={styles.monthLabel}>
            {formatMonthYear(entries[0].date)}
          </h2>

          <div className={styles.timeline}>
            {entries.map((entry, index) => {
              const config = TAG_CONFIG[entry.tag];

              return (
                <article
                  key={`${entry.date}-${index}`}
                  className={styles.entry}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <span
                    className={`${styles.dot} ${config.dot}`}
                    aria-hidden='true'
                  />

                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <span className={`${styles.badge} ${config.badge}`}>
                        <FontAwesomeIcon
                          icon={config.icon}
                          className={styles.badgeIcon}
                        />
                        {config.label}
                      </span>
                      <span className={styles.date}>
                        {formatDate(entry.date)}
                      </span>
                    </div>

                    <h3 className={styles.cardTitle}>{entry.title}</h3>

                    {entry.description && (
                      <p className={styles.cardDescription}>
                        {entry.description}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
