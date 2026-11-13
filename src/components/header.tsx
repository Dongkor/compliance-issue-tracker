import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import NavLinks from "./nav-links";

// The top bar shown on every page. It shows nothing when nobody is logged in,
// so the login page has no header.
export default async function Header() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-6">
      <span className="font-semibold">Compliance Tracker</span>

      <NavLinks />

      <div className="flex items-center text-sm">
        <span>{user.full_name}</span>
        <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-violet-300 ml-1">
          {user.role}
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-line px-3 py-1 text-muted hover:text-white hover:bg-line cursor-pointer ml-2" 
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
