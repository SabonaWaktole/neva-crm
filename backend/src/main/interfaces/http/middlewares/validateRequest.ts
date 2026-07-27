import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Validate `req.body` against a Zod schema and **replace it with the parsed
 * result**.
 *
 * The assignment is the point. This middleware previously called
 * `schema.parseAsync(req.body)` and threw the result away, leaving the raw body
 * in place. That had two consequences:
 *
 * 1. **A mass-assignment gap (the reason this matters today).** `z.object()`
 *    strips keys the schema does not declare. Discarding the parsed object
 *    meant undeclared fields survived into the handlers — and three of them
 *    pass the body wholesale into a use case
 *    (`registerUseCase.execute(req.body)`, likewise acceptInvitation and
 *    resetPassword). Any extra property a client invented travelled all the way
 *    in. Assigning the parsed value closes that: what reaches a handler is now
 *    exactly the declared shape and nothing else.
 *
 * 2. **A loaded trap for later.** Every `.default()`, `.transform()` and
 *    `z.coerce` would be inert on these routes. None of the current auth
 *    schemas uses one, so nothing was silently wrong — but the first schema to
 *    gain a default would have done nothing at all, with no error to notice.
 *
 * The 400 body is `{ error, details }` to match what every controller in this
 * codebase already returns. It used to be `res.json(error)` on the raw
 * ZodError, so clients saw two different error shapes depending on which
 * validation path a route happened to use. See TD-011.
 */
export const validateRequest = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      return next(error);
    }
  };
