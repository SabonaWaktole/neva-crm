import { NextFunction, Request, Response } from 'express';

/**
 * Terminal error handler.
 *
 * Logs the full error (message, stack, cause) to the server log, and returns a
 * fixed generic body to the client. Error messages and stack traces disclose
 * absolute file paths, dependency versions, query fragments and internal
 * structure — all useful to an attacker and useless to a legitimate caller.
 *
 * Express identifies error handlers by arity, so all four parameters must stay
 * in the signature even though `next` is unused.
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  console.error('GLOBAL ERROR:', err);

  if (res.headersSent) {
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
};
