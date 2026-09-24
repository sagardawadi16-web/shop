/**
 * Cloudflare Pages Functions global type declarations
 */
declare type PagesFunction<
  Env = unknown,
  Params extends string = any,
  Data extends Record<string, unknown> = Record<string, unknown>
> = (
  context: {
    request: Request;
    functionPath: string;
    waitUntil: (promise: Promise<any>) => void;
    next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
    env: Env;
    params: Record<Params, string | string[]>;
    data: Data;
  }
) => Response | Promise<Response>;
