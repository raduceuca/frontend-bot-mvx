import { RouteNamesEnum } from 'localConstants';
import { Dashboard } from 'pages/Dashboard/Dashboard';
import { Home } from 'pages/Home/Home';
import { Unlock } from 'pages/Unlock/Unlock';
import { WhatsNew } from 'pages/WhatsNew/WhatsNew';
import { RouteType } from 'types';

interface RouteWithTitleType extends RouteType {
  title: string;
  authenticatedRoute?: boolean;
  children?: RouteWithTitleType[];
}

export const routes: RouteWithTitleType[] = [
  {
    path: RouteNamesEnum.home,
    title: 'Home',
    component: Home,
    children: [
      {
        path: RouteNamesEnum.unlock,
        title: 'Unlock',
        component: Unlock
      }
    ]
  },
  {
    path: RouteNamesEnum.dashboard,
    title: 'Dashboard',
    component: Dashboard,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.whatsNew,
    title: 'What\u2019s New',
    component: WhatsNew
  }
];
