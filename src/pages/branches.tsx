import { CONFIG } from 'src/config-global';

import { BranchesView } from 'src/sections/branches/view/branches-view';

export default function Page() {
  return (
    <>
      <title>{`Branches & Locations - ${CONFIG.appName}`}</title>
      <BranchesView />
    </>
  );
}
