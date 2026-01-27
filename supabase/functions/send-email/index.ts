import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 string
    contentType?: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    // Create Supabase client to verify JWT and log emails
    const supabaseClient = createClient(
      (Deno as any).env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // 2. Parse Request Body
    const { to, subject, text, html, attachments }: EmailRequest = await req.json();

    if (!to || !subject || (!text && !html)) {
      throw new Error("Missing required fields: to, subject, and body (text or html)");
    }

    // 3. Configure SMTP Transporter
    const transporter = nodemailer.createTransport({
      host: Deno.env.get("SMTP_HOST"),
      port: Number(Deno.env.get("SMTP_PORT") || 587),
      secure: Deno.env.get("SMTP_SECURE") === "true", // true for 465, false for other ports
      auth: {
        user: Deno.env.get("SMTP_USER"),
        pass: Deno.env.get("SMTP_PASS"),
      },
      // Connection pooling for performance
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    // 4. Prepare Mail Options
    const mailOptions = {
      from: Deno.env.get("SMTP_FROM") || '"Nepal Visuals" <no-reply@nepalvisuals.com>',
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      text,
      html,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        encoding: "base64",
        contentType: att.contentType,
      })),
    };

    // 5. Send Email
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);

    // 6. Log to Database (Audit Trail)
    await supabaseClient.from("email_logs").insert({
      user_id: user.id,
      recipient: Array.isArray(to) ? to.join(", ") : to,
      subject,
      status: "sent",
      message_id: info.messageId,
      provider_response: JSON.stringify(info),
    });

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);

    // Try to log failure if possible (and if we have a supabase client initialized)
    // In a real scenario, we might want to initialize a separate admin client for error logging if auth failed.

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500, // Return 500 for server errors
      }
    );
  }
});
