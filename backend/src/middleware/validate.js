import { HttpError } from '../utils/httpError.js';

/** Validate and coerce req.params / req.query / req.body with zod schemas. */
export function validate(schemas) {
  return (req, res, next) => {
    for (const key of ['params', 'query', 'body']) {
      if (!schemas[key]) continue;
      const result = schemas[key].safeParse(req[key] ?? {});
      if (!result.success) {
        const details = result.error.issues.map((i) => ({ path: [key, ...i.path].join('.'), message: i.message }));
        return next(new HttpError(400, 'Yanlış sorğu məlumatları', details));
      }
      req[key] = result.data;
    }
    return next();
  };
}

/** Forward rejected promises from async handlers to the error middleware (Express 4). */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
