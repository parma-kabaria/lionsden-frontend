import { CONFIG } from 'src/config-global';

import { RolesView } from 'src/sections/roles/view/roles-view';

export default function Page() {
  return (
    <>
      <title>{`Roles & Permissions - ${CONFIG.appName}`}</title>
      <RolesView />
    </>
  );
}
