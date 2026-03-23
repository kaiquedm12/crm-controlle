import { app } from './app';
import { startCadenceScheduler } from '../infra/queue/cadence-scheduler';

const port = Number(process.env.PORT ?? 3333);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  startCadenceScheduler();
});
