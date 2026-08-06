import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Admin cookie 認証付き SSE。
 * サーバー側で Supabase Realtime（service role）を購読し、
 * INSERT/UPDATE をブラウザへ転送する。
 */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let channel: ReturnType<ReturnType<typeof createSupabaseAdmin>["channel"]> | null =
    null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      send("ready", { ok: true });

      const supabase = createSupabaseAdmin();
      channel = supabase
        .channel(`admin-notifications-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "admin_notifications",
          },
          (payload) => {
            send("change", {
              eventType: payload.eventType,
              at: new Date().toISOString(),
            });
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            send("subscribed", { ok: true });
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            send("error", { status });
          }
        });

      heartbeat = setInterval(() => {
        send("ping", { at: new Date().toISOString() });
      }, 25_000);

      request.signal.addEventListener("abort", () => {
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        if (channel) {
          void supabase.removeChannel(channel);
        }
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      });
    },
    cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      if (channel) {
        const supabase = createSupabaseAdmin();
        void supabase.removeChannel(channel);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
