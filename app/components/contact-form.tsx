"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type FormStatus = "idle" | "sending" | "success" | "error";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: "dark";
      action: "contact";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export default function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const captchaContainer = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !captchaContainer.current) return;

    let active = true;
    let script = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile-script="true"]',
    );
    const renderCaptcha = () => {
      if (!active || !captchaContainer.current || !window.turnstile) return;
      if (captchaWidgetId.current) return;
      captchaWidgetId.current = window.turnstile.render(captchaContainer.current, {
        sitekey: siteKey,
        theme: "dark",
        action: "contact",
        callback: (token) => {
          setCaptchaToken(token);
          setCaptchaError("");
        },
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => {
          setCaptchaToken("");
          setCaptchaError("Captcha failed to load. Refresh the page and try again.");
        },
      });
    };
    const onError = () =>
      setCaptchaError("Captcha failed to load. Refresh the page and try again.");

    if (window.turnstile) {
      renderCaptcha();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstileScript = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderCaptcha);
      script.addEventListener("error", onError);
      if (window.turnstile) renderCaptcha();
    }

    return () => {
      active = false;
      script?.removeEventListener("load", renderCaptcha);
      script?.removeEventListener("error", onError);
      if (captchaWidgetId.current && window.turnstile) {
        window.turnstile.remove(captchaWidgetId.current);
        captchaWidgetId.current = null;
      }
    };
  }, [siteKey]);

  function resetCaptcha() {
    setCaptchaToken("");
    if (captchaWidgetId.current && window.turnstile) {
      window.turnstile.reset(captchaWidgetId.current);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!captchaToken) {
      setStatus("error");
      setFeedback("Please complete the captcha before sending your message.");
      return;
    }
    setStatus("sending");
    setFeedback("");

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          captchaToken,
          website: data.get("website"),
        }),
      });
      const result: { error?: string } = await response.json();

      if (!response.ok) {
        resetCaptcha();
        setStatus("error");
        setFeedback(result.error || "Something went wrong. Please try again.");
        return;
      }

      form.reset();
      resetCaptcha();
      setStatus("success");
      setFeedback("Message sent. Dre will be in touch soon.");
    } catch {
      resetCaptcha();
      setStatus("error");
      setFeedback("Could not send your message. Check your connection and try again.");
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <span>01 / SAY HELLO</span>
        <span className="form-heading-mark" aria-hidden="true">✳</span>
      </div>
      <label htmlFor="name">YOUR NAME</label>
      <input id="name" name="name" type="text" autoComplete="name" placeholder="Enter first name" minLength={2} maxLength={80} required />
      <label htmlFor="email">EMAIL ADDRESS</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required />
      <label htmlFor="message">WHAT ARE YOU WORKING TOWARD?</label>
      <textarea id="message" name="message" placeholder="Tell me about your goals..." minLength={15} maxLength={2000} rows={4} required />
      {siteKey ? (
        <div className="captcha-wrap">
          <div ref={captchaContainer} />
          {captchaError && <p className="captcha-error" role="alert">{captchaError}</p>}
        </div>
      ) : (
        <p className="captcha-error" role="alert">
          Captcha is not configured yet. Please email Dre directly.
        </p>
      )}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <button className="submit-button" type="submit" disabled={!siteKey || status === "sending"}>
        {status === "sending" ? "SENDING..." : "SEND YOUR MESSAGE"}
        <span aria-hidden="true">↗</span>
      </button>
      <p className={`form-feedback ${status}`} role="status" aria-live="polite">
        {feedback || "Your message goes directly to Dre. No spam, ever."}
      </p>
    </form>
  );
}
