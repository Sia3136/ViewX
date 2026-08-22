export const suggestedQuestions = [
  "Show me today's critical alerts",
  "Which room has the highest risk?",
  "Summarize the current examination",
  "Generate an incident report",
];

const responses: Record<string, string> = {
  "show me today's critical alerts":
    "There is 1 critical alert today: a prolonged absence flagged for Kabir Singh (#059) in Room C at 09:58 am, escalated to the on-site invigilator. All other open alerts are medium or high severity and remain under review.",
  "which room has the highest risk?":
    "Room B currently has the highest composite risk score at 78/100, driven by a high-confidence phone detection at 10:38 am. Room A follows at 62/100 due to a multiple-face detection and an unusual head-movement pattern.",
  "summarize the current examination":
    "Advanced Mathematics is live across 12 rooms with 482 students being monitored. Monitoring accuracy is holding at 97.4% and system health is at 99.8%. There are 3 active alerts — 1 high and 2 medium — none of which have been confirmed as violations yet.",
  "generate an incident report":
    "Drafting an incident report for the current session. It will include all 6 logged alerts, evidence timestamps, AI confidence scores, and invigilator actions taken so far. You'll be able to export it as PDF or CSV from the Reports page once ready.",
};

export function getMockAIResponse(question: string): string {
  const key = question.trim().toLowerCase();
  if (responses[key]) return responses[key];
  return "Based on current monitoring data, everything is operating within expected parameters. I'll keep watching the live feeds and let you know immediately if anything needs your attention.";
}
