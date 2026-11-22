export interface EnquiryValues {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export type EnquiryErrors = Partial<Record<keyof EnquiryValues, string>>;

/**
 * Quick checks before sending, so customers get instant feedback. The API validates
 * again and is the authority; the messages match the API's so the wording never changes.
 */
export function validateEnquiry(values: EnquiryValues): EnquiryErrors {
  const errors: EnquiryErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();

  if (name === '') errors.name = 'Enter your name.';
  else if (name.length > 100) errors.name = 'Name can be at most 100 characters.';

  if (email === '') errors.email = 'Enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';

  if (phone !== '' && !/^[0-9+()\-.\s]{6,30}$/.test(phone)) errors.phone = 'Enter a valid phone number.';

  if (values.message.trim().length > 2000) errors.message = 'Message can be at most 2000 characters.';

  return errors;
}
