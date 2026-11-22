export interface EmailMessage {
  to: string;
  from: string;
  /** Lets the sales team reply straight to the customer. */
  replyTo: { name: string; address: string };
  subject: string;
  /** Plain text only, so customer input can never become HTML. */
  text: string;
}

/**
 * How the app sends email. Replacing the provider (e.g. the Amazon SES API)
 * means writing one new implementation. Implementations throw EmailDeliveryError on failure.
 */
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
