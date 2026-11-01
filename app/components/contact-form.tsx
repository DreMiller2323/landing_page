"use client";

import { useState, type FormEvent } from "react";

type FormStatus = "idle" | "sending" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
          website: data.get("website"),
        }),
      });
      const result: { error?: string } = await response.json();

      if (!response.ok) {
        setStatus("error");
        setFeedback(result.error || "Something went wrong. Please try again.");
        return;
      }

      form.reset();
      setStatus("success");
      setFeedback("Message sent. Dre will be in touch soon.");
    } catch {
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
      <input id="name" name="name" type="text" autoComplete="name" placeholder="How should I call you?" minLength={2} maxLength={80} required />
      <label htmlFor="email">EMAIL ADDRESS</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required />
      <label htmlFor="message">WHAT ARE YOU WORKING TOWARD?</label>
      <textarea id="message" name="message" placeholder="Tell me about your goals..." minLength={15} maxLength={2000} rows={4} required />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <button className="submit-button" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "SENDING..." : "SEND YOUR MESSAGE"}
        <span aria-hidden="true">↗</span>
      </button>
      <p className={`form-feedback ${status}`} role="status" aria-live="polite">
        {feedback || "Your message goes directly to Dre. No spam, ever."}
      </p>
    </form>
  );
}
