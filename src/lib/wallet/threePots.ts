export interface ThreePotsConfig {
  spending: number;
  savings: number;
  community: number;
}

export function validateThreePotsConfig(config: ThreePotsConfig): boolean {
  if (config.spending < 0 || config.savings < 0 || config.community < 0) {
    return false;
  }
  return (config.spending + config.savings + config.community) === 100;
}

export interface ThreePotsSplitResult {
  spending: number;
  savings: number;
  community: number;
}

export function calculateSplit(amount: number, config: ThreePotsConfig): ThreePotsSplitResult {
  if (!validateThreePotsConfig(config)) {
    throw new Error('Invalid ThreePotsConfig: percentages must sum to 100 and be non-negative.');
  }

  // Calculate rough split
  let spending = amount * (config.spending / 100);
  let savings = amount * (config.savings / 100);
  let community = amount * (config.community / 100);

  // Rounding down to 2 decimals to prevent precision issues creating money out of nowhere
  spending = Math.floor(spending * 100) / 100;
  savings = Math.floor(savings * 100) / 100;
  community = Math.floor(community * 100) / 100;

  // We add up the floored amounts, and any remainder goes to the largest pot
  const sum = spending + savings + community;
  const remainder = Math.round((amount - sum) * 100) / 100;

  if (remainder > 0) {
      if (config.spending >= config.savings && config.spending >= config.community) {
          spending += remainder;
      } else if (config.savings >= config.spending && config.savings >= config.community) {
          savings += remainder;
      } else {
          community += remainder;
      }

      // Fix floating point math on the assignment
      spending = Math.round(spending * 100) / 100;
      savings = Math.round(savings * 100) / 100;
      community = Math.round(community * 100) / 100;
  }

  return {
    spending,
    savings,
    community
  };
}
