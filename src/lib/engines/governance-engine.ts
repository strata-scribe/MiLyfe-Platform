/**
 * Governance Engine (Web) — Proposal lifecycle for Next.js
 * Stages: Idea → Talk → Try it first → Decide → What happened
 */

export type ProposalStage = "idea" | "talk" | "try-it-first" | "decide" | "what-happened";

export interface Proposal {
  id: string;
  title: string;
  description: string;
  authorId: string;
  stage: ProposalStage;
  circleId: string;
  sunsetDate: string;
  yesVotes: number;
  noVotes: number;
  quorumRequired: number;
  constitutionallyCompliant: boolean;
  createdAt: string;
}

export const governanceEngine = {
  async createProposal(params: {
    title: string;
    description: string;
    authorId: string;
    circleId: string;
    sunsetDate: string;
    quorumRequired: number;
    constitutionallyCompliant: boolean;
  }): Promise<Proposal> {
    return {
      id: `prop_${Date.now()}`,
      ...params,
      stage: "idea",
      yesVotes: 0,
      noVotes: 0,
      createdAt: new Date().toISOString(),
    };
  },

  async advanceStage(proposalId: string, currentStage: ProposalStage): Promise<ProposalStage> {
    const next: Record<ProposalStage, ProposalStage> = {
      idea: "talk",
      talk: "try-it-first",
      "try-it-first": "decide",
      decide: "what-happened",
      "what-happened": "what-happened",
    };
    return next[currentStage];
  },

  async castVote(params: { proposalId: string; userId: string; choice: "yes" | "no" }): Promise<void> {},

  async getProposals(circleId?: string): Promise<Proposal[]> {
    return [];
  },
};
