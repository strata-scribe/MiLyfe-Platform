/**
 * Safety Engine (Web) — Crisis response for Next.js
 * Leave-now, walking-home timer, rights card, witness mode, freeze pocket.
 */

export interface SafetyState {
  leaveNowActive: boolean;
  walkingHomeActive: boolean;
  walkingHomeExpiry: string | null;
  walkingHomeContacts: string[];
  pocketFrozen: boolean;
  locationHidden: boolean;
}

export const safetyEngine = {
  async activateLeaveNow(userId: string): Promise<SafetyState> {
    // In production: freezes jars, hides location, invalidates sessions
    return {
      leaveNowActive: true,
      walkingHomeActive: false,
      walkingHomeExpiry: null,
      walkingHomeContacts: [],
      pocketFrozen: true,
      locationHidden: true,
    };
  },

  async startWalkingHome(params: {
    userId: string;
    contacts: string[];
    durationMinutes: number;
  }): Promise<SafetyState> {
    const expiry = new Date(Date.now() + params.durationMinutes * 60 * 1000).toISOString();
    return {
      leaveNowActive: false,
      walkingHomeActive: true,
      walkingHomeExpiry: expiry,
      walkingHomeContacts: params.contacts,
      pocketFrozen: false,
      locationHidden: false,
    };
  },

  async arrivedSafely(userId: string): Promise<SafetyState> {
    return {
      leaveNowActive: false,
      walkingHomeActive: false,
      walkingHomeExpiry: null,
      walkingHomeContacts: [],
      pocketFrozen: false,
      locationHidden: false,
    };
  },

  async getSafetyState(userId: string): Promise<SafetyState> {
    return {
      leaveNowActive: false,
      walkingHomeActive: false,
      walkingHomeExpiry: null,
      walkingHomeContacts: [],
      pocketFrozen: false,
      locationHidden: false,
    };
  },
};
