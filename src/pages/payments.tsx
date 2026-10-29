import { CONFIG } from 'src/config-global';

import { PaymentsView } from 'src/sections/payments/view/payments-view';

export default function Page() {
  return (
    <>
      <title>{`Payments Ledger - ${CONFIG.appName}`}</title>
      <PaymentsView />
    </>
  );
}
