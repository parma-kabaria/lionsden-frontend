import { CONFIG } from 'src/config-global';

import { BungalowsView } from 'src/sections/bungalows/view/bungalows-view';

export default function Page() {
  return (
    <>
      <title>{`Bungalows Inventory - ${CONFIG.appName}`}</title>
      <BungalowsView />
    </>
  );
}
