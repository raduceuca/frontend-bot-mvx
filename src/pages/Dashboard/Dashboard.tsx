import { useEffect } from 'react';
import { HomeCapabilities } from 'pages/Home/components/HomeCapabilities';
import { DashboardHeader, Widget } from './components';
import styles from './dashboard.styles';
import { CreateJob } from './widgets';

const widgets = [
  {
    title: 'New Chat',
    widget: CreateJob,
    description: 'Give Max something to do',
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
    <div className='flex flex-col w-full'>
      <div className='flex flex-col gap-4 items-center w-full pt-4 pb-6 lg:pt-6 lg:pb-10'>
        <DashboardHeader />

        <div className={styles.dashboardWidgets}>
          {widgets.map((element) => (
            <Widget key={element.title} {...element} />
          ))}

          <HomeCapabilities />
        </div>
      </div>
    </div>
  );
};
