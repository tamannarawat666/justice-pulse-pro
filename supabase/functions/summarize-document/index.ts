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
    const { documentText, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing document:", fileName);

    // First, check if it's a legal document
    const validationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a legal document classifier. Respond with ONLY 'YES' if the document is a valid legal document (examples: agreements, contracts, court orders, petitions, notices, affidavits, judgments) or 'NO' if it is not." 
          },
          { 
            role: "user", 
            content: `Is this a legal document? Analyze the following text and respond with ONLY 'YES' or 'NO':\n\n${documentText.substring(0, 2000)}` 
          }
        ],
      }),
    });

    if (!validationResponse.ok) {
      if (validationResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (validationResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI validation failed");
    }

    const validationData = await validationResponse.json();
    const isLegal = validationData.choices[0].message.content.trim().toUpperCase().includes("YES");

    console.log("Document validation result:", isLegal ? "Legal" : "Not Legal");

    if (!isLegal) {
      return new Response(
        JSON.stringify({ 
          error: "⚠️ This does not appear to be a valid legal document. Please upload a legal document to continue.",
          isLegal: false 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate summary in easy language
    const summaryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are the Legal Document Summarizer for Justice Hub.
Summarize legal documents in clear, simple terms so a non-lawyer can understand.
Include:
• Type of document (e.g., contract, agreement, judgment)
• Who the parties are
• Main issues or claims
• Key obligations, deadlines, or rulings
• Any important next steps the user should know

Always end with:
"✅ This is a simplified summary. For detailed legal advice, please consult a qualified lawyer."` 
          },
          { 
            role: "user", 
            content: `Please summarize this legal document:\n\n${documentText}` 
          }
        ],
      }),
    });

    if (!summaryResponse.ok) {
      throw new Error("AI summarization failed");
    }

    const summaryData = await summaryResponse.json();
    const summary = summaryData.choices[0].message.content;

    console.log("Summary generated successfully");

    return new Response(
      JSON.stringify({ summary, isLegal: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in summarize-document:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process document";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
