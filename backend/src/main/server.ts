import { assertRequiredEnv } from './config/env';
import { createApp } from './app';

const PORT = process.env.PORT || 3000;

// Validate configuration before anything else: fail loudly at boot rather than
// after the port is bound and traffic is already arriving.
try {
  assertRequiredEnv();
} catch (err) {
  console.error(`FATAL: ${(err as Error).message}`);
  process.exit(1);
}

const app = createApp();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
