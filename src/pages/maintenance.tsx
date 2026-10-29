import { CONFIG } from 'src/config-global';

import { MaintenanceView } from 'src/sections/maintenance/view/maintenance-view';

export default function Page() {
  return (
    <>
      <title>{`Maintenance - ${CONFIG.appName}`}</title>
      <MaintenanceView />
    </>
  );
}
