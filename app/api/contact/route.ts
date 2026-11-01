import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  message: z.string().trim().min(15).max(2000),
  website: z.string().max(0).optional(),
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

export async function POST(request: Request) {
  let origin: string | null;
  try {
    origin = request.headers.get("origin");
    if (!origin || new URL(origin).origin !== new URL(request.url).origin) {
      return Response.json({ error: "Request could not be verified." }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Request could not be verified." }, { status: 403 });
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 12_000) {
      return Response.json({ error: "Message is too large." }, { status: 413 });
    }
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Please submit a valid message." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Please check your name, email, and message." }, { status: 400 });
  }
  if (parsed.data.website) return Response.json({ ok: true });

  const requiredEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "CONTACT_FROM_EMAIL",
    "CONTACT_IP_HASH_SECRET",
  ] as const;
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length) {
    console.error("Contact form is missing server environment variables:", missingEnv.join(", "));
    return Response.json({ error: "The contact form is temporarily unavailable." }, { status: 503 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp =
    request.headers.get("x-real-ip") ||
    (forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown");
  const ipHash = createHmac("sha256", process.env.CONTACT_IP_HASH_SECRET!)
    .update(clientIp)
    .digest("hex");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: allowed, error: rateLimitError } = await supabase.rpc(
    "check_contact_rate_limit",
    { p_ip_hash: ipHash },
  );
  if (rateLimitError) {
    console.error("Contact rate-limit check failed:", rateLimitError.message);
    return Response.json({ error: "The contact form is temporarily unavailable." }, { status: 503 });
  }
  if (!allowed) {
    return Response.json(
      { error: "Please wait a little before sending another message." },
      { status: 429 },
    );
  }

  const { name, email, message } = parsed.data;
  const { error: insertError } = await supabase.from("contact_messages").insert({
    name,
    email,
    message,
    ip_hash: ipHash,
  });
  if (insertError) {
    console.error("Contact message could not be stored:", insertError.message);
    return Response.json({ error: "Your message could not be saved. Please try again." }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: emailError } = await resend.emails.send({
    from: process.env.CONTACT_FROM_EMAIL!,
    to: "dre.miller3489@gmail.com",
    replyTo: email,
    subject: `New coaching inquiry from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
  });
  if (emailError) {
    console.error("Contact message stored, but email delivery failed:", emailError.message);
    return Response.json(
      { error: "Your message was saved, but email delivery failed. Please email Dre directly." },
      { status: 503 },
    );
  }

  return Response.json({ ok: true });
}
