import { CONFIG } from 'src/config-global';

import { AuditLogsView } from 'src/sections/audit-logs/view/audit-logs-view';

export default function Page() {
  return (
    <>
      <title>{`Audit Logs - ${CONFIG.appName}`}</title>
      <AuditLogsView />
    </>
  );
}
