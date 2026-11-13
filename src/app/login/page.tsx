import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="glow-background relative flex flex-1 items-center justify-center overflow-hidden p-4">
      <div className="grid-overlay pointer-events-none absolute inset-10" />

      <div className="relative w-full max-w-sm">
        {/* Blurred violet glow behind the card */}
        <div className="absolute -inset-5 rounded-[30px] bg-accent/30 blur-3xl" />

        <form
          action={login}
          className="relative space-y-4 rounded-2xl border border-line bg-card p-6"
        >
          <h1 className="text-xl font-semibold">Compliance Issue Tracker</h1>

          {error && (
            <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">
              Invalid email or password.
            </p>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-line bg-page p-2"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm text-muted">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-line bg-page p-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-accent p-2 font-medium text-white hover:bg-accent-hover"
          >
            Log in
          </button>
        </form>
      </div>
    </main>
  );
}
