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
    const { caseName, courtDate, userEmail } = await req.json();

    // Validate inputs
    if (!caseName || typeof caseName !== 'string' || caseName.trim() === '') {
      return new Response(
        JSON.stringify({ 
          status: "error",
          message: "Case name is required and must be a non-empty string"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!userEmail || typeof userEmail !== 'string') {
      return new Response(
        JSON.stringify({ 
          status: "error",
          message: "User email is required"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return new Response(
        JSON.stringify({ 
          status: "error",
          message: "Invalid email format"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!courtDate) {
      return new Response(
        JSON.stringify({ 
          status: "error",
          message: "Court date is required"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse various date formats
    let parsedDate: Date;
    try {
      // Try to parse the date
      parsedDate = new Date(courtDate);
      
      // Check if date is valid
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date");
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ 
          status: "error",
          message: "Invalid court date format. Please use YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Court reminder created:", { caseName, courtDate: parsedDate.toISOString(), userEmail });

    return new Response(
      JSON.stringify({ 
        status: "success",
        case_name: caseName.trim(),
        court_date: parsedDate.toISOString(),
        user_email: userEmail.trim()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in court-reminder:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process reminder";
    return new Response(
      JSON.stringify({ 
        status: "error",
        message: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
