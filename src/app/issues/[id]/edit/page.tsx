import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { canEditIssue, type IssueSeverity, type IssueStatus } from "@/lib/issues";
import EditIssueForm from "@/components/edit-issue-form";

// The issue fields the edit page needs.
type EditableIssue = {
  id: number;
  title: string;
  description: string;
  status: IssueStatus;
  severity: IssueSeverity;
  due_date: string;
  owner_id: string | null;
  reported_by: string;
};

type EditIssuePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditIssuePage({ params }: EditIssuePageProps) {
  const { id } = await params;

  const issueId = Number(id);
  if (!Number.isInteger(issueId)) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    notFound();
  }

  const supabase = await createClient();

  const { data } = await supabase
    .from("issues")
    .select("id, title, description, status, severity, due_date, owner_id, reported_by")
    .eq("id", issueId)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const issue = data as EditableIssue;

  const backLink = (
    <Link href={`/issues/${issue.id}`} className="text-sm text-muted hover:text-white">
      ← <span className="hover:underline hover:underline-offset-2">Issue #{issue.id}</span>
    </Link>
  );

  if (!canEditIssue(user, issue)) {
    return (
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <div>{backLink}</div>
        <p className="text-muted">You can&apos;t edit this issue.</p>
      </main>
    );
  }

  // Only admins choose an owner, so only they need the list of people.
  let people: { id: string; full_name: string }[] = [];
  if (user.role === "admin") {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");
    people = profiles ?? [];
  }

  return (
    <main className="flex-1 p-4 sm:p-6">
      {/* A centred column, as wide as the form card */}
      <div className="mb-4">{backLink}</div>
      <div className="mx-auto max-w-xl space-y-4">
        
        <h1 className="text-center text-2xl font-semibold">Edit issue #{issue.id}</h1>
        <EditIssueForm issue={issue} people={people} isAdmin={user.role === "admin"} />
      </div>
    </main>
  );
}
