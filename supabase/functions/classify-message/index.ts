import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const categories = [
  "sponsorship",
  "brand_deal",
  "collaboration",
  "business",
  "partnership",
  "question",
  "content_request",
  "feedback",
  "important",
  "relevant",
  "general",
  "spam",
];

const score = (value: unknown) =>
  Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    const authorization = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey) {
      return json({ error: "Supabase environment is not configured" }, 500);
    }
    if (!groqApiKey) return json({ error: "GROQ_API_KEY is not configured" }, 500);
    if (!authorization) return json({ error: "Authentication required" }, 401);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "Invalid authentication" }, 401);

    const { message, senderName, platform } = await req.json();
    if (!message || typeof message !== "string") {
      return json({ error: "message is required" }, 400);
    }

    const { data: priorities, error: priorityError } = await supabase
      .from("smart_priorities")
      .select("id,name,instruction,title,is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (priorityError) {
      return json({ error: `Unable to load Smart Priorities: ${priorityError.message}` }, 500);
    }

    const priorityText = (priorities || []).length
      ? (priorities || []).map((p, index) =>
          `${index + 1}. ID: ${p.id}\nName: ${p.name || "Untitled"}\nTitle: ${p.title || ""}\nInstruction: ${p.instruction || ""}`
        ).join("\n\n")
      : "No custom Smart Priorities are configured for this user.";

    const prompt = `You are Kai, an AI communication intelligence system for social-media creators.

Analyze the incoming message and return ONLY valid JSON.

Return exactly these fields:
category, priority_score, priority_level, relevance_score, is_spam, needs_reply, smart_priority_id, smart_priority_name

Allowed category values:
${categories.join(", ")}

Classification rules:
- Explicit paid sponsorships, sponsored campaigns, paid promotions, brand offers, collaborations, partnerships and serious commercial/business proposals must NEVER be classified as general.
- priority_score is an integer from 0 to 100.
- priority_level is high for 75-100, medium for 45-74, low for 0-44.
- Consider the user's Smart Priorities as explicit personalization rules. A strong match should substantially increase priority_score.
- If a message matches one or more Smart Priorities, choose the single strongest match and return its exact database ID in smart_priority_id and exact name in smart_priority_name.
- If no Smart Priority matches, return null for both smart_priority_id and smart_priority_name.
- Do not claim a match merely because the message is generally important; the content must actually satisfy the user's instruction.

USER'S ACTIVE SMART PRIORITIES:
${priorityText}

Platform: ${platform || "unknown"}
Sender: ${senderName || "unknown"}
Message: ${message}`;

    const model = "openai/gpt-oss-20b";
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a precise communication classification engine. Follow the user's Smart Priorities and output JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
        reasoning_effort: "low",
        include_reasoning: false,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return json({ error: data?.error?.message || `Groq request failed using model ${model}` }, response.status);
    }

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(data?.choices?.[0]?.message?.content || "{}");
    } catch {
      return json({ error: "Groq returned invalid JSON" }, 502);
    }

    const text = message.toLowerCase();
    let detected: string | null = null;
    if (/\bsponsor(ship|ed)?\b|\bpaid\s+(campaign|promotion|sponsorship)\b/.test(text)) detected = "sponsorship";
    else if (/\bbrand\s+deal\b|\bambassador\b|\bbrand\s+(partnership|campaign)\b/.test(text)) detected = "brand_deal";
    else if (/\bcollaborat(e|ion|ing)\b|\bcollab\b/.test(text)) detected = "collaboration";
    else if (/\bpartnership\b|\bpartner\s+with\b/.test(text)) detected = "partnership";
    else if (/\bcommercial\b|\bbusiness\s+(enquir|inquir)|\bproposal\b|\bcontract\b/.test(text)) detected = "business";

    let category = categories.includes(String(result.category)) ? String(result.category) : "general";
    if (detected && category === "general") category = detected;

    let priorityScore = score(result.priority_score);
    const matchedPriorityId = result.smart_priority_id == null ? null : String(result.smart_priority_id);
    const matchedPriority = (priorities || []).find((p) => String(p.id) === matchedPriorityId);

    if (matchedPriority) priorityScore = Math.max(priorityScore, 80);
    if (detected === "sponsorship") priorityScore = Math.max(priorityScore, 85);
    else if (detected === "brand_deal" || detected === "business" || detected === "partnership") priorityScore = Math.max(priorityScore, 80);
    else if (detected === "collaboration") priorityScore = Math.max(priorityScore, 75);

    const normalized = {
      category,
      priority_score: priorityScore,
      priority_level: priorityScore >= 75 ? "high" : priorityScore >= 45 ? "medium" : "low",
      relevance_score: Math.max(score(result.relevance_score), matchedPriority ? 80 : detected ? 80 : 0),
      is_spam: detected || matchedPriority ? false : typeof result.is_spam === "boolean" ? result.is_spam : category === "spam",
      needs_reply: detected || matchedPriority ? true : typeof result.needs_reply === "boolean" ? result.needs_reply : true,
      smart_priority_id: matchedPriority?.id ?? null,
      smart_priority_name: matchedPriority?.name ?? null,
    };

    if (normalized.category === "spam") {
      normalized.priority_score = 0;
      normalized.priority_level = "low";
      normalized.smart_priority_id = null;
      normalized.smart_priority_name = null;
    }

    return json(normalized);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Classification failed" }, 500);
  }
});
