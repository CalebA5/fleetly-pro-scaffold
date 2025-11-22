import { db } from './db';
import { users } from '@shared/schema';
import { sql, eq } from 'drizzle-orm';

/**
 * Normalize email for comparison
 * - Convert to lowercase
 * - Remove dots before @ in Gmail addresses
 * - Remove +alias in email addresses
 */
export function normalizeEmail(email: string): string {
  const [localPart, domain] = email.toLowerCase().split('@');
  
  if (!domain) return email.toLowerCase();
  
  // Remove +alias (e.g., john+spam@gmail.com → john@gmail.com)
  let normalizedLocal = localPart.split('+')[0];
  
  // For Gmail, remove dots (Gmail ignores dots in addresses)
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    normalizedLocal = normalizedLocal.replace(/\./g, '');
  }
  
  return `${normalizedLocal}@${domain}`;
}

/**
 * Normalize name for comparison (lowercase + trim)
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Calculate Levenshtein distance between two strings
 * Used to detect similar names (typos, slight variations)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  // Create a 2D array for dynamic programming
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calculate similarity percentage between two names
 * Returns a value between 0 and 1 (1 = identical, 0 = completely different)
 */
export function nameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  
  if (n1 === n2) return 1.0;
  
  const maxLength = Math.max(n1.length, n2.length);
  const distance = levenshteinDistance(n1, n2);
  
  return 1 - (distance / maxLength);
}

/**
 * Check if email is similar to any existing emails in the database
 * Uses indexed SQL lookups for O(1) performance
 * Returns: { isDuplicate: boolean, matchedEmail?: string, message?: string }
 */
export async function checkEmailDuplicate(email: string): Promise<{
  isDuplicate: boolean;
  matchedEmail?: string;
  message?: string;
}> {
  // Normalize the email for comparison
  const normalizedEmail = normalizeEmail(email);
  
  // Use indexed SQL query instead of table scan - O(1) lookup
  const existingUser = await db.query.users.findFirst({
    where: eq(users.emailNormalized, normalizedEmail)
  });
  
  if (existingUser) {
    return {
      isDuplicate: true,
      matchedEmail: existingUser.email,
      message: existingUser.email.toLowerCase() === email.toLowerCase()
        ? 'This email is already registered. Please sign in instead.'
        : `This email is too similar to an existing account (${existingUser.email}). Please use a different email address.`
    };
  }
  
  return { isDuplicate: false };
}

/**
 * Check if name is duplicate or very similar to existing names
 * Uses indexed SQL lookups for fast performance
 * Returns: { isDuplicate: boolean, matchedName?: string, message?: string }
 */
export async function checkNameDuplicate(name: string, email: string): Promise<{
  isDuplicate: boolean;
  matchedName?: string;
  message?: string;
}> {
  const normalizedName = normalizeName(name);
  const normalizedEmail = normalizeEmail(email);
  
  // First check: exact name match (using index) - O(1) lookup
  const exactMatch = await db.query.users.findFirst({
    where: sql`${users.nameLower} = ${normalizedName} AND ${users.emailNormalized} != ${normalizedEmail}`
  });
  
  if (exactMatch) {
    return {
      isDuplicate: true,
      matchedName: exactMatch.name,
      message: `The name "${name}" is already registered. If this is you, please sign in instead. Otherwise, please add additional information to distinguish your account.`
    };
  }
  
  // For now, skip the expensive fuzzy matching since we can't efficiently do it in SQL
  // Only block exact matches to prevent DOS. Similarity checking can be added with trigram indexes later.
  
  return { isDuplicate: false };
}

/**
 * Comprehensive verification check for new user signup
 * Checks both email and name for duplicates/similarities
 */
export async function verifyNewUser(name: string, email: string): Promise<{
  isValid: boolean;
  errors: {
    email?: string;
    name?: string;
  };
}> {
  const errors: { email?: string; name?: string } = {};
  
  // Check email (uses indexed lookup)
  const emailCheck = await checkEmailDuplicate(email);
  if (emailCheck.isDuplicate) {
    errors.email = emailCheck.message;
  }
  
  // Check name (uses indexed lookup for exact matches)
  const nameCheck = await checkNameDuplicate(name, email);
  if (nameCheck.isDuplicate) {
    errors.name = nameCheck.message;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
