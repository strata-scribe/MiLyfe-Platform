/**
 * Checks if a user is a minor based on their age.
 * @param age The age of the user.
 * @returns True if the user is under 18, false otherwise.
 */
export function isMinor(age: number): boolean {
  return age < 18;
}

/**
 * Checks if a user can access specific content based on maturity rules.
 * @param isMature Whether the content is marked as mature.
 * @param age The age of the user.
 * @returns True if the user can access the content, false otherwise.
 */
export function canAccessContent(isMature: boolean, age: number): boolean {
  if (isMature && isMinor(age)) {
    return false;
  }
  return true;
}

/**
 * Checks if an action has been authorized by a guardian.
 * @param action The specific action to check.
 * @param authorizedScopes An array of scopes the guardian has consented to.
 * @returns True if the action is in the scopes or 'all' is included, false otherwise.
 */
export function hasGuardianConsent(action: string, authorizedScopes: string[]): boolean {
  return authorizedScopes.includes(action) || authorizedScopes.includes('all');
}
