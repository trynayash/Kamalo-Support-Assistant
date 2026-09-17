import { ReplitConnectors } from "@replit/connectors-sdk";

type TicketEmail = {
  to: string;
  subject: string;
  ticketNumber: string;
  title: string;
  body: string;
  resolution?: string;
};

type FeedbackEmail = {
  messageId: string;
  rating: "helpful" | "not_helpful";
  score: number;
  feedback?: string | null;
};

function configuredSender(): string {
  const sender = process.env.RESEND_FROM_EMAIL?.trim();
  if (!sender) {
    throw new Error("RESEND_FROM_EMAIL is not configured");
  }
  return sender;
}

function configuredFeedbackRecipient(): string {
  const recipient = process.env.KAMALO_FEEDBACK_EMAIL?.trim() || process.env.RESEND_FROM_EMAIL?.trim();
  if (!recipient) {
    throw new Error("KAMALO_FEEDBACK_EMAIL or RESEND_FROM_EMAIL is not configured");
  }
  return recipient;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

export async function sendTicketEmail({ to, subject, ticketNumber, title, body, resolution }: TicketEmail): Promise<void> {
  const connectors = new ReplitConnectors();
  const html = [
    `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17343a;max-width:640px">`,
    `<p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#557277">KAMALO Support</p>`,
    `<h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(title)}</h1>`,
    `<p>${escapeHtml(body)}</p>`,
    `<p><strong>Ticket ID:</strong> ${escapeHtml(ticketNumber)}</p>`,
    resolution ? `<div style="margin-top:20px;padding:16px;border:1px solid #d7e0dc;border-radius:10px;background:#f6faf7"><strong>Resolution</strong><p>${escapeHtml(resolution)}</p></div>` : "",
    `<p style="font-size:12px;color:#6b7c7f;margin-top:28px">This is a support update from KAMALO.</p>`,
    `</div>`,
  ].join("");

  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: configuredSender(),
      to: [to],
      subject,
      html,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend rejected the ticket email (${response.status}): ${detail.slice(0, 240)}`);
  }
}

export async function sendFeedbackEmail({ messageId, rating, score, feedback }: FeedbackEmail): Promise<void> {
  const connectors = new ReplitConnectors();
  const label = rating === "helpful" ? "Helpful" : "Not helpful";
  const note = feedback?.trim() || "No written comment was provided.";
  const html = [
    `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17343a;max-width:640px">`,
    `<p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#557277">KAMALO Feedback</p>`,
    `<h1 style="font-size:22px;margin:0 0 12px">A customer reviewed an answer</h1>`,
    `<p><strong>Rating:</strong> ${escapeHtml(label)}</p>`,
    `<p><strong>Stars:</strong> ${score}/5</p>`,
    `<p><strong>Message ID:</strong> ${escapeHtml(messageId)}</p>`,
    `<div style="margin-top:20px;padding:16px;border:1px solid #d7e0dc;border-radius:10px;background:#f6faf7"><strong>Customer comment</strong><p>${escapeHtml(note)}</p></div>`,
    `<p style="font-size:12px;color:#6b7c7f;margin-top:28px">Review this response in the KAMALO admin workspace.</p>`,
    `</div>`,
  ].join("");

  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: configuredSender(),
      to: [configuredFeedbackRecipient()],
      subject: `KAMALO ${label.toLowerCase()} answer review (${score}/5)`,
      html,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend rejected the feedback email (${response.status}): ${detail.slice(0, 240)}`);
  }
}