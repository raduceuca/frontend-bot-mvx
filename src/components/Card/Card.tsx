import { PropsWithChildren } from 'react';
import { WithClassnameType } from 'types';

// prettier-ignore
const styles = {
  container: 'bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col gap-4 flex-1 p-4 lg:p-6 justify-center transition-colors duration-100',
  title: 'flex justify-between items-center text-lg font-semibold text-zinc-50 tracking-tight',
  description: 'text-zinc-400 mb-4 text-base'
} satisfies Record<string, string>;

interface CardPropsType extends PropsWithChildren, WithClassnameType {
  title: string;
  description?: string;
  reference: string;
  anchor?: string;
}

export const Card = ({
  title,
  children,
  description,
  anchor,
  'data-testid': dataTestId
}: CardPropsType) => (
  <div id={anchor} className={styles.container} data-testid={dataTestId}>
    <h2 className={styles.title}>{title}</h2>
    {description && <p className={styles.description}>{description}</p>}
    {children}
  </div>
);
