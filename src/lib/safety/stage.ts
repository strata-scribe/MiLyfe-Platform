export type CapabilityStage = 'Crawling' | 'Walking' | 'Running' | 'Driving';

export interface StageThreshold {
  stage: CapabilityStage;
  minAgeDays: number;
  minStanding: number;
}

// Defining the stage thresholds in descending order for easier evaluation
export const STAGE_THRESHOLDS: StageThreshold[] = [
  { stage: 'Driving', minAgeDays: 30, minStanding: 20 },
  { stage: 'Running', minAgeDays: 7, minStanding: 5 },
  { stage: 'Walking', minAgeDays: 1, minStanding: 1 },
  { stage: 'Crawling', minAgeDays: 0, minStanding: 0 },
];

export type Action = 'post' | 'vote' | 'propose' | 'moderate';

// Required stages for actions
export const ACTION_REQUIREMENTS: Record<Action, CapabilityStage> = {
  post: 'Crawling',
  vote: 'Walking',
  propose: 'Running',
  moderate: 'Driving',
};

/**
 * Calculates account age in days based on the createdAt timestamp
 */
function getAgeInDays(createdAt: string | Date, now: Date = new Date()): number {
  const createdDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Determines a user's capability stage based on their account age and overall standing.
 */
export function getCapabilityStage(createdAt: string | Date, standing: number, now?: Date): CapabilityStage {
  const ageDays = getAgeInDays(createdAt, now);

  for (const threshold of STAGE_THRESHOLDS) {
    if (ageDays >= threshold.minAgeDays && standing >= threshold.minStanding) {
      return threshold.stage;
    }
  }

  return 'Crawling'; // Default fallback
}

/**
 * Checks if a user can perform a specific action based on their capability stage.
 */
export function canPerformAction(action: Action, createdAt: string | Date, standing: number, now?: Date): boolean {
  const currentStage = getCapabilityStage(createdAt, standing, now);
  const requiredStage = ACTION_REQUIREMENTS[action];

  // Mapping stages to numbers for easier comparison
  const stageValues: Record<CapabilityStage, number> = {
    'Crawling': 0,
    'Walking': 1,
    'Running': 2,
    'Driving': 3,
  };

  return stageValues[currentStage] >= stageValues[requiredStage];
}
