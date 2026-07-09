import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-12 bg-zinc-50 dark:bg-zinc-950/20">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
