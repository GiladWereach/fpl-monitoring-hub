import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertPayload {
  type: 'error' | 'warning' | 'critical';
  message: string;
  details: {
    metric: string;
    value: number;
    threshold: number;
    timestamp: string;
  };
  recipients: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Processing monitoring alert request');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const alertPayload: AlertPayload = await req.json();
    
    console.log('Alert payload:', alertPayload);

    // Generate email HTML
    const emailHtml = `
      <h2>Monitoring Alert: ${alertPayload.type.toUpperCase()}</h2>
      <p>${alertPayload.message}</p>
      <h3>Details:</h3>
      <ul>
        <li>Metric: ${alertPayload.details.metric}</li>
        <li>Current Value: ${alertPayload.details.value}</li>
        <li>Threshold: ${alertPayload.details.threshold}</li>
        <li>Time: ${new Date(alertPayload.details.timestamp).toLocaleString()}</li>
      </ul>
    `;

    // Send email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Monitoring System <alerts@yourdomain.com>',
        to: alertPayload.recipients,
        subject: `[${alertPayload.type.toUpperCase()}] Monitoring Alert: ${alertPayload.details.metric}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to send email: ${await res.text()}`);
    }

    // Log the alert
    const { error: logError } = await supabase
      .from('api_error_logs')
      .insert({
        error_type: 'MONITORING_ALERT',
        endpoint: alertPayload.details.metric,
        error_details: alertPayload.message,
        request_params: alertPayload.details
      });

    if (logError) {
      console.error('Error logging alert:', logError);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing alert:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);