import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { logIntegration } from "@/lib/integrations/logging";
import {
  searchAndStoreMarketplaceCapacity,
  postLoadToMarketplaces,
} from "@/lib/marketplace/marketplace-workflow";

const xaiApiKey = process.env.XAI_API_KEY;
const xaiModel = process.env.XAI_MODEL ?? "grok-4.3";

export async function POST(request: Request) {
  const formData = await request.formData();
  const provider = (formData.get("provider") as string) || "XAI";

  let result: { ok: boolean; message: string; error?: string };

  if (provider === "XAI" || provider === "xAI (Grok)") {
    if (!xaiApiKey) {
      result = { ok: false, message: "XAI not configured (missing XAI_API_KEY)", error: "missing_key" };
      await logIntegration({
        provider: "XAI",
        action: "HEALTH_CHECK",
        status: "SKIPPED",
        message: "Health check skipped - no API key",
      });
      return NextResponse.json(result);
    }

    try {
      // Minimal ping: very small, cheap completion
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey: xaiApiKey, baseURL: "https://api.x.ai/v1" });

      const resp = await client.chat.completions.create({
        model: xaiModel,
        messages: [
          { role: "system", content: "You are a health check responder. Reply with exactly one word: OK" },
          { role: "user", content: "ping" },
        ],
        max_tokens: 5,
        temperature: 0,
      });

      const text = resp.choices[0]?.message?.content?.trim() || "";
      const ok = /ok/i.test(text) || text.length > 0;

      result = {
        ok,
        message: ok ? "xAI responded successfully to minimal health check." : "xAI responded but with unexpected content.",
      };

      await logIntegration({
        provider: "XAI",
        action: "HEALTH_CHECK",
        status: "SUCCESS",
        message: result.message,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "unknown error";
      result = {
        ok: false,
        message: "xAI health check failed.",
        error: message,
      };
      await logIntegration({
        provider: "XAI",
        action: "HEALTH_CHECK",
        status: "FAILED",
        error: message,
      });
    }
  } else if ((provider === "DAT" || provider === "TRUCKSTOP") && formData.get("action")) {
    const action = formData.get("action") as string;
    const loadId = formData.get("loadId") as string | null;

    if (!loadId) {
      result = { ok: false, message: "loadId is required for marketplace retry" };
      return NextResponse.json(result);
    }

    try {
      if (action === "retry-capacity") {
        await searchAndStoreMarketplaceCapacity(loadId);
        result = { ok: true, message: `Retried capacity search for load ${loadId} (new logs created)` };
      } else if (action === "retry-post") {
        await postLoadToMarketplaces(loadId);
        result = { ok: true, message: `Retried load post for load ${loadId} (new logs created)` };
      } else {
        result = { ok: false, message: `Unknown action ${action}` };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "retry failed";
      result = { ok: false, message, error: message };
      await logIntegration({
        provider: provider.toUpperCase(),
        action: "LOAD_POST", // or CAPACITY_SEARCH, but generic
        status: "FAILED",
        loadId,
        error: message,
      });
    }
  } else {
    // For other providers in 6.2 we just acknowledge configured state.
    // Real pings can be added per-provider when adapters are hardened.
    const configured = !!process.env[
      provider === "Twilio" ? "TWILIO_ACCOUNT_SID" :
      provider === "Resend" ? "RESEND_API_KEY" :
      provider === "FMCSA" ? "FMCSA_WEB_KEY" : "XAI_API_KEY"
    ];
    result = {
      ok: configured,
      message: configured
        ? `${provider} appears configured (no deep ping implemented in this phase).`
        : `${provider} missing representative env key.`,
    };
    await logIntegration({
      provider: provider.toUpperCase().replace(/[^A-Z]/g, ""),
      action: "HEALTH_CHECK",
      status: configured ? "SUCCESS" : "SKIPPED",
      message: result.message,
    });
  }

  revalidatePath("/integrations");
  return NextResponse.json(result);
}
