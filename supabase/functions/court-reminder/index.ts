import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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
      parsedDate = new Date(courtDate);
      
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

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          status: "error",
          message: "Authorization required. Please log in."
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          status: "error",
          message: "Invalid authentication token"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert the new hearing
    const { error: insertError } = await supabase
      .from('court_hearings')
      .insert({
        user_id: user.id,
        case_name: caseName.trim(),
        court_date: parsedDate.toISOString(),
        user_email: userEmail.trim()
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ 
          status: "error",
          message: "Failed to add hearing to database"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch all hearings for this user from 2023-2027
    const { data: allHearings, error: fetchError } = await supabase
      .from('court_hearings')
      .select('case_name, court_date')
      .eq('user_id', user.id)
      .gte('court_date', '2023-01-01T00:00:00Z')
      .lte('court_date', '2027-12-31T23:59:59Z')
      .order('court_date', { ascending: true });

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ 
          status: "error",
          message: "Failed to fetch hearings schedule"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build calendar by year
    const calendar: Record<string, Array<{ case_name: string; court_date: string }>> = {
      '2023': [],
      '2024': [],
      '2025': [],
      '2026': [],
      '2027': []
    };

    const upcomingSchedule = allHearings?.map(h => ({
      case_name: h.case_name,
      court_date: h.court_date
    })) || [];

    upcomingSchedule.forEach(hearing => {
      const year = new Date(hearing.court_date).getFullYear().toString();
      if (calendar[year]) {
        calendar[year].push(hearing);
      }
    });

    console.log("Court reminder added successfully");

    return new Response(
      JSON.stringify({ 
        status: "success",
        message: "Hearing added successfully.",
        hearing: {
          case_name: caseName.trim(),
          court_date: parsedDate.toISOString(),
          user_email: userEmail.trim()
        },
        upcoming_schedule: upcomingSchedule,
        calendar: calendar
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
