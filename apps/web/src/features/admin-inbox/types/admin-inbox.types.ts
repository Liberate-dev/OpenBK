export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface InboxMessage {
  id: string;
  preview: string;
  authorNis: string;
  riskLevel: RiskLevel;
  riskScore: number;
  submittedAt: string;
  hasReplies: boolean;
}

