import { describe, it, expect } from 'vitest';

describe('Broker Lead Capture Validation Logic', () => {
  const validateLeadInput = (institutionName, workEmail, honeypot) => {
    if (honeypot && String(honeypot).trim() !== '') {
      return { status: 'spam_blocked' };
    }

    const instName = String(institutionName || '').trim();
    const email = String(workEmail || '').trim().toLowerCase();

    const errors = {};
    if (!instName) {
      errors.institutionName = 'Brokerage / Institution Name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.workEmail = 'Work Email is required.';
    } else if (!emailRegex.test(email)) {
      errors.workEmail = 'Please enter a valid work email address.';
    }

    if (Object.keys(errors).length > 0) {
      return { status: 'validation_error', errors };
    }

    return { status: 'valid', data: { institution_name: instName, work_email: email } };
  };

  it('rejects empty inputs with inline validation errors', () => {
    const res = validateLeadInput('', '');
    expect(res.status).toBe('validation_error');
    expect(res.errors.institutionName).toBeDefined();
    expect(res.errors.workEmail).toBeDefined();
  });

  it('rejects invalid email formats', () => {
    const res = validateLeadInput('Zerodha Broking Ltd', 'notanemail');
    expect(res.status).toBe('validation_error');
    expect(res.errors.workEmail).toContain('valid work email');
  });

  it('accepts valid institution and email', () => {
    const res = validateLeadInput('Zerodha Broking Ltd', 'compliance@zerodha.com');
    expect(res.status).toBe('valid');
    expect(res.data.institution_name).toBe('Zerodha Broking Ltd');
    expect(res.data.work_email).toBe('compliance@zerodha.com');
  });

  it('silently blocks honeypot spam submissions', () => {
    const res = validateLeadInput('Spam Bot Ltd', 'bot@spam.com', 'http://spambot.com');
    expect(res.status).toBe('spam_blocked');
  });
});
