import { CONFIG } from 'src/config-global';

import { BookingsView } from 'src/sections/bookings/view/bookings-view';

export default function Page() {
  return (
    <>
      <title>{`Bookings - ${CONFIG.appName}`}</title>
      <BookingsView />
    </>
  );
}
