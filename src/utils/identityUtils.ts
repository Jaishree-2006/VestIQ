/**
 * CLIENT-SIDE UI PREVIEW ONLY — NON-AUTHORITATIVE
 *
 * Notice: This client-side module is provided solely for showing live UI hints / previews
 * before submitting form data.
 * Authoritative identity verification (name similarity matching & PAN verification)
 * is executed exclusively on the backend server in `server/identityEngine.js` during `/api/parse-cas`.
 */

export function normalizeName(name: string): string {
  if (!name) return '';
  return name
    .toString()
    .normalize('NFKD')
    .toUpperCase()
    .replace(/\p{P}|\p{S}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function tokenOverlap(a: string, b: string): number {
  const aTokens = a.split(' ').filter(Boolean);
  const bTokens = b.split(' ').filter(Boolean);
  if (!aTokens.length || !bTokens.length) return 0;
  const common = aTokens.filter((token) => bTokens.includes(token)).length;
  return (2 * common) / (aTokens.length + bTokens.length);
}

/**
 * Preview helper for live client-side UI feedback.
 * Authoritative enforcement is done server-side by `server/identityEngine.js`.
 */
export function nameSimilarityScore(a: string, b: string): number {
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  if (!normA || !normB) return 0;

  const overlap = tokenOverlap(normA, normB);
  const distance = levenshteinDistance(normA, normB);
  const ratio = 1 - distance / Math.max(normA.length, normB.length, 1);

  return Math.max(overlap, ratio);
}
