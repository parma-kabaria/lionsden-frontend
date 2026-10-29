import { CONFIG } from 'src/config-global';

import { AvailabilityView } from 'src/sections/availability/view/availability-view';

export default function Page() {
  return (
    <>
      <title>{`Availability & Booking - ${CONFIG.appName}`}</title>
      <AvailabilityView />
    </>
  );
}
