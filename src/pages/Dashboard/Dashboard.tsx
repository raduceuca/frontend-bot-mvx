import { useEffect, useMemo } from 'react';
import { environment } from 'config';
import { EnvironmentsEnum } from 'lib/sdkDapp/sdkDapp.types';
import { WidgetType } from 'types/widget.types';
import { DashboardHeader, Widget } from './components';
import styles from './dashboard.styles';
import { CreateJob, Faucet } from './widgets';

const defaultWidgets: WidgetType[] = [
  {
    title: 'Create Job',
    widget: CreateJob,
    description: 'Initialize a new job and start a task with a prompt',
    reference: '/create-job'
  }
];

export const Dashboard = () => {
  const activeWidgets = useMemo(() => {
    const widgets = [...defaultWidgets];

    // Show faucet for Devnet
    if (environment === EnvironmentsEnum.devnet) {
      widgets.push({
        title: 'Devnet Faucet',
        widget: Faucet,
        description: 'Request 5 Devnet xEGLD tokens to use the bot',
        reference: 'https://devnet-wallet.multiversx.com/faucet'
      });
    }

    return widgets;
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <div className='flex flex-col w-full min-h-screen'>
      <div
        style={{ backgroundImage: 'url(/background.svg)' }}
        className='flex flex-col gap-2 items-center flex-1 w-full overflow-auto pt-4 pb-4 lg:pt-8 lg:pb-12'
      >
        <DashboardHeader />

        <div className={styles.dashboardWidgets}>
          {activeWidgets.map((element: WidgetType) => (
            <Widget key={element.title} {...element} />
          ))}
        </div>
      </div>
    </div>
  );
};
