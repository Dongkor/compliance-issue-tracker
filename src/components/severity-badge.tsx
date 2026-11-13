import type { IssueSeverity } from "@/lib/issues";

// Dot colour for each severity.
const dotColors: Record<IssueSeverity, string> = {
  critical: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-500",
  low: "bg-gray-400",
};

// A small pill with a coloured dot, for example "● critical".
export default function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-line px-2.5 py-0.5 text-xs">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColors[severity]}`} />
      {severity}
    </span>
  );
}
