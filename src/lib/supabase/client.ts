import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { isDemoMode } from "@/lib/demo/demoMode";

export function createClient() {
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return isDemoMode() ? demoReadOnly(client) : client;
}

type Client = ReturnType<typeof createBrowserClient<Database>>;

// Mode démo (lib/demo/demoMode.ts) : mêmes lectures, aucune écriture.
// Chaque écriture renvoie un résultat vide « réussi », chaînable
// (.select().single(), .eq()…) et attendable.
function demoReadOnly(client: Client): Client {
  const ok = { data: null, error: null, count: null, status: 200, statusText: "OK" };
  const fakeWrite = (): unknown => {
    const chain: unknown = new Proxy(function () {}, {
      get(_t, prop) {
        if (prop === "then") return (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => Promise.resolve(ok).then(resolve, reject);
        return () => chain;
      },
      apply: () => chain,
    });
    return chain;
  };
  const WRITES = new Set(["insert", "update", "upsert", "delete"]);
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (table: string) => {
          const query = (target.from as (t: string) => object)(table);
          return new Proxy(query, {
            get(q, m) {
              if (typeof m === "string" && WRITES.has(m)) return fakeWrite;
              const v = Reflect.get(q, m);
              return typeof v === "function" ? v.bind(q) : v;
            },
          });
        };
      }
      if (prop === "rpc") return fakeWrite;
      if (prop === "storage") {
        return { from: () => ({ upload: async () => ({ data: { path: "demo" }, error: null }), remove: async () => ({ data: [], error: null }) }) };
      }
      const v = Reflect.get(target, prop, receiver);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}
