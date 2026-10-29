import { CONFIG } from 'src/config-global';

import { PricingView } from 'src/sections/pricing/view/pricing-view';

export default function Page() {
  return (
    <>
      <title>{`Peak Pricing Rules - ${CONFIG.appName}`}</title>
      <PricingView />
    </>
  );
}
