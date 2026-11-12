import { getCurrentUser } from "@/lib/auth";
import { logout } from "./login/actions";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      {user ? (
        <p>
          Logged in as <strong>{user.full_name}</strong> ({user.role})
        </p>
      ) : (
        <p>No profile found for this account.</p>
      )}

      <form action={logout}>
        <button
          type="submit"
          className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
        >
          Log out
        </button>
      </form>
    </main>
  );
}
