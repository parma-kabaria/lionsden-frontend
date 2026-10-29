import { CONFIG } from 'src/config-global';

import { UsersView } from 'src/sections/users/view/users-view';

export default function Page() {
  return (
    <>
      <title>{`Staff & Roles - ${CONFIG.appName}`}</title>
      <UsersView />
    </>
  );
}
