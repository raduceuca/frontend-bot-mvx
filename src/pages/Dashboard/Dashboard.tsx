import { useEffect } from 'react';
import { WidgetType } from 'types/widget.types';
import { DashboardHeader, Widget } from './components';
import styles from './dashboard.styles';
import { CreateJob } from './widgets';

const dashboardWidgets: WidgetType[] = [
  {
    title: 'Create Job',
    widget: CreateJob,
    description: 'Initialize a new job and start a task with a prompt',
    reference: '/create-job'
  }
];

export const Dashboard = () => {
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
          {dashboardWidgets.map((element) => (
            <Widget key={element.title} {...element} />
          ))}
        </div>
      </div>
    </div>
  );
};
