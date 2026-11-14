import { z } from "zod";

// Field rules shared by the "New issue" and "Edit issue" forms.
const title = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters")
  .max(200, "Title must be at most 200 characters");

const description = z.string().trim().max(2000, "Description is too long");

const severity = z.enum(["low", "medium", "high", "critical"], {
  error: "Choose a severity",
});

const dueDate = z.iso.date({ error: "Enter a valid due date" });

// Checks the "New issue" form before anything is saved.
// Example of valid input:
// { title: "Old employee can still log in to payroll", description: "",
//   severity: "high", due_date: "2026-11-20" }
export const createIssueSchema = z.object({
  title: title,
  description: description,
  severity: severity,
  due_date: dueDate,
});

// Checks the "Edit issue" form before anything is saved.
// owner_id is "" for "Unassigned", otherwise a person's id.
// Example of valid input:
// { title: "...", description: "", status: "in_progress", severity: "high",
//   due_date: "2026-11-20", owner_id: "" }
export const updateIssueSchema = z.object({
  title: title,
  description: description,
  status: z.enum(["open", "in_progress", "resolved", "closed"], {
    error: "Choose a status",
  }),
  severity: severity,
  due_date: dueDate,
  owner_id: z.string(),
});

// Checks an uploaded evidence file: at most 4 MB, and only PDF, PNG, JPEG or
// plain text. The storage bucket has the same limits, so this is checked twice.
// Example of a valid file: "disabled-account.png", 250 KB, type "image/png".
export const addFileSchema = z
  .file({ error: "Choose a file to upload" })
  .max(4 * 1024 * 1024, { error: "File must be 4 MB or smaller" })
  .mime(["application/pdf", "image/png", "image/jpeg", "text/plain"], {
    error: "Only PDF, PNG, JPEG or text files are allowed",
  });

// Checks the "Add link" evidence form.
// Only http and https links are accepted, so a link like "javascript:alert(1)"
// (which would run code when clicked) is rejected.
// Example of valid input: { name: "IT ticket #482", url: "https://it.example.com/482" }
export const addLinkSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a label for the link")
    .max(200, "Label must be at most 200 characters"),
  url: z.url({
    protocol: /^https?$/,
    error: "Enter a full link starting with https://",
  }),
});
