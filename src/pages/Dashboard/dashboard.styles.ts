// prettier-ignore
export default {
  dashboardContainer: 'dashboard-container flex w-screen min-h-screen relative border-t border-b border-secondary transition-colors duration-100',
  mobilePanelContainer: 'mobile-panel-container fixed bottom-0 left-0 right-0 z-50 max-h-full overflow-y-auto lg:static lg:max-h-none lg:overflow-visible',
  desktopPanelContainer: 'desktop-panel-container lg:flex',
  dashboardContent: 'dashboard-content flex flex-col gap-4 justify-center items-center flex-1 w-full overflow-auto border-l border-secondary pt-0 pb-4 lg:pt-0 lg:pb-6 transition-colors duration-100',
  dashboardContentMobilePanelOpen: 'dashboard-content-mobile-panel-open opacity-20 lg:opacity-100 pointer-events-none',
  dashboardWidgets: 'dashboard-widgets flex flex-col gap-6 w-full max-w-3xl mx-auto px-4 flex-1'
} satisfies Record<string, string>;
