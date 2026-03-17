import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video_url } = await req.json();
    if (!video_url) {
      return new Response(JSON.stringify({ error: "video_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a social media content strategist for a digital agency. Given a video URL, analyze what the video is likely about based on the URL, title cues, and platform. Then:
1. Write a concise summary of what the video covers (2-3 sentences).
2. Draft exactly 3 engaging Instagram captions based on the video content. Each caption should be different in tone: one professional, one casual/fun, one inspirational. Include relevant hashtags.

Respond in this exact JSON format:
{
  "summary": "...",
  "caption_1": "...",
  "caption_2": "...",
  "caption_3": "..."
}`
            },
            {
              role: "user",
              content: `Analyze this craft video and generate a summary and 3 Instagram captions: ${video_url}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_video_content",
                description:
                  "Generate a summary and 3 Instagram captions for a craft video",
                parameters: {
                  type: "object",
                  properties: {
                    summary: {
                      type: "string",
                      description: "2-3 sentence summary of the video",
                    },
                    caption_1: {
                      type: "string",
                      description:
                        "Professional tone Instagram caption with hashtags",
                    },
                    caption_2: {
                      type: "string",
                      description:
                        "Casual/fun tone Instagram caption with hashtags",
                    },
                    caption_3: {
                      type: "string",
                      description:
                        "Inspirational tone Instagram caption with hashtags",
                    },
                  },
                  required: [
                    "summary",
                    "caption_1",
                    "caption_2",
                    "caption_3",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_video_content" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured output from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
