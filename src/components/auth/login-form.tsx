"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setMessage({
        type: "success",
        text: "Magic link sent! Check your inbox.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[420px] border-0 shadow-xl ring-1 ring-foreground/[0.06] dark:ring-foreground/[0.08] bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-2 pt-8 px-8">
        <h1 className="text-2xl font-bold tracking-tight text-center">
          Welcome Back
        </h1>
        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          Sign in to continue to CouponSwap
        </p>
      </CardHeader>

      <CardContent className="px-8 pt-4 pb-2 space-y-5">
        {/* ── Google OAuth — Primary CTA ── */}
        <Button
          id="google-sign-in"
          type="button"
          variant="outline"
          size="lg"
          className="w-full h-11 text-sm font-semibold gap-3 cursor-pointer border-border/60 hover:bg-muted/80 dark:border-input dark:hover:bg-input/50"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          aria-label="Continue with Google"
        >
          {isGoogleLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Continue with Google
        </Button>

        {/* ── OR Divider ── */}
        <div className="relative flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium select-none">
            or
          </span>
          <Separator className="flex-1" />
        </div>

        {/* ── Email Magic Link ── */}
        {message?.type === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-center size-12 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20">
              <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">{message.text}</p>
              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive it? Check your spam folder.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-xs font-medium">
                Email Address
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                disabled={isLoading}
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="h-10"
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Error banner */}
            {message?.type === "error" && (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive dark:border-destructive/40 dark:bg-destructive/10"
                role="alert"
              >
                {message.text}
              </div>
            )}

            <Button
              id="send-magic-link"
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full h-10 text-sm font-semibold gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending link…
                </>
              ) : (
                <>
                  <Mail className="size-4" />
                  Send Magic Link
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="px-8 pb-6 pt-4 bg-transparent border-0">
        <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed w-full">
          By continuing, you agree to our{" "}
          <span className="underline underline-offset-2 hover:text-foreground cursor-pointer transition-colors">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="underline underline-offset-2 hover:text-foreground cursor-pointer transition-colors">
            Privacy Policy
          </span>
          .
        </p>
      </CardFooter>
    </Card>
  );
}
