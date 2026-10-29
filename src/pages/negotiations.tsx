import { CONFIG } from 'src/config-global';

import { NegotiationsView } from 'src/sections/negotiations/view/negotiations-view';

export default function Page() {
  return (
    <>
      <title>{`Rent Negotiations - ${CONFIG.appName}`}</title>
      <NegotiationsView />
    </>
  );
}
