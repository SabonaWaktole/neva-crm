
import { clientHandlers } from './clientHandlers';
import { teamHandlers } from './teamHandlers';

export const handlers = [
  ...clientHandlers,
  ...teamHandlers,
];
