import { crmApp } from './crm-app';
import { startCadenceScheduler } from '../infra/queue/cadence-scheduler';

const port = Number(process.env.CRM_SERVICE_PORT ?? 3332);

crmApp.listen(port, () => {
  console.log(`CRM service running on port ${port}`);
  startCadenceScheduler();
});
