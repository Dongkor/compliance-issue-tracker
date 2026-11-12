import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 p-6"
      >
        <h1 className="text-xl font-semibold">Compliance Issue Tracker</h1>

        {error && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700">
            Invalid email or password.
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded border border-gray-300 p-2"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded border border-gray-300 p-2"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-blue-600 p-2 font-medium text-white hover:bg-blue-700"
        >
          Log in
        </button>
      </form>
    </main>
  );
}
