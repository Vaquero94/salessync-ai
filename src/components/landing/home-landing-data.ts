export const stats = [
  "5hrs saved weekly",
  "30s review time",
  "8x cheaper than Gong",
  "100% rep-controlled",
];

export const steps = [
  "Connect your CRM and calendar in under 2 minutes.",
  "Zero Entry AI listens to calls, emails, and meetings.",
  "AI extracts contacts, deal changes, tasks, and risks.",
  "Rep approves in one click before anything syncs.",
];

export type PainItem = {
  pain: string;
  context: string;
  fix: string;
};

export const pains: PainItem[] = [
  {
    pain: "Manual CRM updates after every call",
    context: "Notes pile up until someone finds time to type them in.",
    fix: "Auto-captured data appears instantly for approval.",
  },
  {
    pain: "Inconsistent deal notes and missing context",
    context: "Every rep writes updates differently—or skips them entirely.",
    fix: "Standardized summaries and structured fields every time.",
  },
  {
    pain: "Reps lose selling time to admin work",
    context: "Evenings disappear into CRM chores instead of pipeline work.",
    fix: "Admin shrinks from hours to minutes each week.",
  },
  {
    pain: "Leaders cannot trust pipeline hygiene",
    context: "Forecast reviews expose gaps nobody can explain.",
    fix: "Rep-controlled reviews keep every update accurate.",
  },
];

export const features = [
  "CRM-ready contact and deal extraction",
  "Action item detection with owner + due date",
  "Call summary and sentiment tagging",
  "One-click approve, edit, or dismiss",
  "Duplicate-safe waitlist and onboarding flow",
  "Built for teams that value data quality",
];
