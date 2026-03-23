import { authApp } from './auth-app';

const port = Number(process.env.AUTH_SERVICE_PORT ?? 3331);

authApp.listen(port, () => {
  console.log(`Auth service running on port ${port}`);
});
