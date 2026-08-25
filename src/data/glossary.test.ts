import { describe, it, expect } from 'vitest';
import { GLOSSARY, getGlossaryEntry } from './glossary';

describe('Glossary Data & Lookup', () => {
  it('contains at least 15 core financial terms', () => {
    const keys = Object.keys(GLOSSARY);
    expect(keys.length).toBeGreaterThanOrEqual(15);
  });

  it('retrieves entries by exact or case-insensitive term', () => {
    const invit = getGlossaryEntry('InvIT');
    expect(invit).toBeDefined();
    expect(invit?.term).toContain('InvIT');
    expect(invit?.definition).toContain('infrastructure');

    const reit = getGlossaryEntry('reit');
    expect(reit).toBeDefined();
    expect(reit?.term).toContain('REIT');
    expect(reit?.definition).toContain('real estate');
  });

  it('retrieves entries via aliases', () => {
    const ter = getGlossaryEntry('TER');
    expect(ter).toBeDefined();
    expect(ter?.term).toContain('Expense Ratio');

    const lockIn = getGlossaryEntry('lock in');
    expect(lockIn).toBeDefined();
    expect(lockIn?.term).toBe('Lock-in Period');

    const scores = getGlossaryEntry('sebi scores');
    expect(scores).toBeDefined();
    expect(scores?.term).toBe('SEBI SCORES');
  });

  it('returns undefined for non-existent terms', () => {
    const unknown = getGlossaryEntry('nonExistentTerm123');
    expect(unknown).toBeUndefined();
  });
});
