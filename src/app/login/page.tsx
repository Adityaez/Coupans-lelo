import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-12 bg-zinc-50/50 dark:bg-zinc-950/30">
      <div className="w-full flex justify-center items-center">
        <LoginForm />
      </div>
    </main>
  );
}
