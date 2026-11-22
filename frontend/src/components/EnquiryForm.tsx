import { useState, type FormEvent } from 'react';
import { ApiError, apiPost } from '../api/client';
import { validateEnquiry, type EnquiryErrors, type EnquiryValues } from './validateEnquiry';

const fieldOrder: (keyof EnquiryValues)[] = ['name', 'email', 'phone', 'message'];
const fieldId = (field: keyof EnquiryValues) => `enquiry-${field}`;
const isField = (field: string): field is keyof EnquiryValues => (fieldOrder as string[]).includes(field);

const sendFailed = 'We couldn’t send your enquiry. Please try again.';

export function EnquiryForm({ productId, onSent }: { productId: string; onSent: () => void }) {
  const [values, setValues] = useState<EnquiryValues>({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function showFieldErrors(found: EnquiryErrors) {
    setErrors(found);
    const first = fieldOrder.find((field) => found[field]);
    if (first) document.getElementById(fieldId(first))?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const found = validateEnquiry(values);
    showFieldErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      await apiPost('/enquiries', {
        productId,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        message: values.message.trim() || undefined,
      });
      // Only now, after the API confirmed the email was accepted, do we say thank you.
      onSent();
    } catch (error) {
      setSending(false);
      if (error instanceof ApiError && error.status === 400) {
        const fromServer: EnquiryErrors = {};
        for (const detail of error.details) if (isField(detail.field)) fromServer[detail.field] = detail.message;
        if (Object.keys(fromServer).length > 0) return showFieldErrors(fromServer);
      }
      setFormError(error instanceof ApiError && error.status === 422 ? error.message : sendFailed);
    }
  }

  function field(name: keyof EnquiryValues, label: string, input: { type?: string; autoComplete?: string; required?: boolean }) {
    const error = errors[name];
    const props = {
      id: fieldId(name),
      name,
      value: values[name],
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `${fieldId(name)}-error` : undefined,
      'aria-required': input.required || undefined,
      onChange: (event: { target: { value: string } }) => setValues((v) => ({ ...v, [name]: event.target.value })),
    };
    return (
      <div className="form-field">
        <label htmlFor={fieldId(name)}>{label}</label>
        {name === 'message' ? (
          <textarea {...props} rows={5} maxLength={2000} />
        ) : (
          <input {...props} type={input.type ?? 'text'} autoComplete={input.autoComplete} />
        )}
        {error && (
          <p id={`${fieldId(name)}-error`} className="field-error">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form className="enquiry-form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <p role="alert" className="error-text">
          {formError}
        </p>
      )}
      {field('name', 'Name', { autoComplete: 'name', required: true })}
      {field('email', 'Email', { type: 'email', autoComplete: 'email', required: true })}
      {field('phone', 'Phone (optional)', { type: 'tel', autoComplete: 'tel' })}
      {field('message', 'Message (optional)', {})}
      <button type="submit" className="button" disabled={sending}>
        {sending ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  );
}
