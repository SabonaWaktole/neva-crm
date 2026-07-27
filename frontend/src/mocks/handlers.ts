
import { clientHandlers } from './clientHandlers';
import { teamHandlers, notificationHandlers } from './teamHandlers';

export const handlers = [
  ...clientHandlers,
  ...teamHandlers,
  ...notificationHandlers,
];
