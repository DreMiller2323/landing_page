import { Resend } from "resend";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  message: z.string().trim().min(15).max(2000),
  captchaToken: z.string().min(1).max(2048),
  website: z.string().max(0).optional(),
});

const turnstileResultSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
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
    "RESEND_API_KEY",
    "CONTACT_FROM_EMAIL",
    "TURNSTILE_SECRET_KEY",
  ] as const;
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length) {
    console.error("Contact form is missing server environment variables:", missingEnv.join(", "));
    return Response.json({ error: "The contact form is temporarily unavailable." }, { status: 503 });
  }

  let turnstileResponse: Response;
  try {
    turnstileResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY!,
          response: parsed.data.captchaToken,
        }),
        signal: AbortSignal.timeout(5000),
      },
    );
  } catch (error) {
    console.error(
      "Captcha verification request failed:",
      error instanceof Error ? error.message : "Unknown verification error",
    );
    return Response.json(
      { error: "Captcha verification is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  if (!turnstileResponse.ok) {
    console.error("Captcha verification returned HTTP", turnstileResponse.status);
    return Response.json(
      { error: "Captcha verification is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  let verificationBody: unknown;
  try {
    verificationBody = await turnstileResponse.json();
  } catch {
    console.error("Captcha verification returned invalid JSON.");
    return Response.json(
      { error: "Captcha verification is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  const verification = turnstileResultSchema.safeParse(verificationBody);
  if (!verification.success) {
    console.error("Captcha verification returned an unexpected response.");
    return Response.json(
      { error: "Captcha verification is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  if (
    !verification.data.success ||
    verification.data.action !== "contact" ||
    verification.data.hostname !== new URL(origin).hostname
  ) {
    return Response.json(
      { error: "Captcha verification failed. Please complete it again." },
      { status: 400 },
    );
  }

  const { name, email, message } = parsed.data;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL!,
      to: "dre.miller3489@gmail.com",
      replyTo: email,
      subject: `New coaching inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    });
    if (error) {
      console.error("Contact email delivery failed:", error.message);
      return Response.json(
        { error: "Your message could not be sent. Please email Dre directly." },
        { status: 503 },
      );
    }
  } catch (error) {
    console.error(
      "Contact email delivery failed:",
      error instanceof Error ? error.message : "Unknown Resend error",
    );
    return Response.json(
      { error: "Your message could not be sent. Please email Dre directly." },
      { status: 503 },
    );
  }

  return Response.json({ ok: true });
}
