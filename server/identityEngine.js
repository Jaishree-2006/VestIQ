/**
 * Authoritative Server-Side Identity & Name Matching Engine for VestIQ
 *
 * Single source of truth for identity verification (PAN matching & name similarity).
 * Exclusively executed on the server.
 */

export function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .normalize('NFKD')
    .toUpperCase()
    .replace(/[\p{P}\p{S}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

export function tokenOverlap(a, b) {
  const aTokens = a.split(' ').filter(Boolean);
  const bTokens = b.split(' ').filter(Boolean);
  if (!aTokens.length || !bTokens.length) return 0;
  const common = aTokens.filter((token) => bTokens.includes(token)).length;
  return (2 * common) / (aTokens.length + bTokens.length);
}

export function nameSimilarityScore(a, b) {
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  if (!normA || !normB) return 0;
  const overlap = tokenOverlap(normA, normB);
  const distance = levenshteinDistance(normA, normB);
  const ratio = 1 - distance / Math.max(normA.length, normB.length, 1);
  return Math.max(overlap, ratio);
}
