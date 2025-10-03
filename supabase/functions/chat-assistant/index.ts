import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing chat message:", message);

    const messages = [
      { 
        role: "system", 
        content: `You are the Legal Guidance AI for Justice Hub.
A user will describe their legal issue in plain words.
Your tasks:
1. Understand the case clearly.
2. Suggest practical next steps (filing a case, sending a notice, collecting evidence, contacting authorities, consulting a lawyer, etc.).
3. Identify which area of Indian law it falls under (family, criminal, consumer, labor, property, contract, etc.).
4. Mention which laws or rights might apply.
5. If the case has weak/no legal grounds, explain why and suggest alternatives.
6. Keep your answer **simple and easy-to-understand** (avoid jargon).
7. Always end with this disclaimer:
"⚖️ This is general guidance only. For exact legal advice, please consult a qualified lawyer."` 
      },
      ...conversationHistory,
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI chat failed");
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    console.log("Chat response generated successfully");

    return new Response(
      JSON.stringify({ reply }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in chat-assistant:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process chat message";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
