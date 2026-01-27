declare module "https://deno.land/std/http/server.ts" {
  export interface ServeInit {
    port?: number;
    hostname?: string;
    onListen?: (params: { hostname: string; port: number }) => void;
  }

  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: ServeInit,
  ): void;
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

