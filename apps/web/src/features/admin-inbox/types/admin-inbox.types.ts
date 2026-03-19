export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface InboxMessage {
  id: string;
  preview: string;
  authorNis: string;
  authorLabel: string;
  sourceType: "student" | "public_report";
  riskLevel: RiskLevel;
  riskScore: number;
  submittedAt: string;
  hasReplies: boolean;
  canReply: boolean;
}
