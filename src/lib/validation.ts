import { z } from "zod";

// Checks the "New issue" form before anything is saved.
// Example of valid input:
// { title: "Former employee still has payroll access", description: "",
//   severity: "high", due_date: "2026-11-20" }
export const createIssueSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z.string().trim().max(2000, "Description is too long"),
  severity: z.enum(["low", "medium", "high", "critical"], {
    error: "Choose a severity",
  }),
  due_date: z.iso.date({ error: "Enter a valid due date" }),
});
