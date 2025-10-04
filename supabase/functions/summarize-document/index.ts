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
            content: `You are a legal document summarizer. You MUST respond ONLY in valid JSON format with no additional text.

For valid legal documents (contracts, agreements, court filings, legal notices, laws, regulations), respond:
{
  "status": "success",
  "summary": [
    "Bullet point 1 about document type and parties",
    "Bullet point 2 about main issues or claims",
    "Bullet point 3 about key obligations or deadlines",
    "Bullet point 4 about important next steps (if applicable)",
    "Bullet point 5 about relevant laws or rights (if applicable)"
  ]
}

Provide 3-5 concise bullet points highlighting:
- Type of document and involved parties
- Main legal points and claims
- Key obligations and deadlines
- Important next steps

Do NOT include any text outside the JSON structure.` 
          },
          { 
            role: "user", 
            content: `Summarize this legal document:\n\n${documentText}` 
          }
        ],
      }),
    });

    if (!summaryResponse.ok) {
      throw new Error("AI summarization failed");
    }

    const summaryData = await summaryResponse.json();
    const summaryContent = summaryData.choices[0].message.content;

    console.log("Summary generated successfully");

    // Parse the JSON response from AI
    let parsedSummary;
    try {
      parsedSummary = JSON.parse(summaryContent);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", summaryContent);
      return new Response(
        JSON.stringify({ 
          status: "error",
          message: "Failed to generate summary in proper format"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify(parsedSummary),
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
