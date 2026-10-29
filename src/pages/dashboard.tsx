import { CONFIG } from 'src/config-global';

import { OverviewAnalyticsView as DashboardView } from 'src/sections/overview/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Dashboard - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="LionsDen Resort Management System - Unified dashboard for Ahmedabad and Dhari branches"
      />
      <DashboardView />
    </>
  );
}
