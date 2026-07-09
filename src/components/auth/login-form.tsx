"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
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
    defaultValues: {
      email: "",
    },
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

      if (error) {
        throw error;
      }

      setMessage({
        type: "success",
        text: "Check your email for the login link.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md bg-card/90">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          Sign In
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Enter your email to receive a passwordless magic login link
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              disabled={isLoading}
              className="w-full"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm text-center font-medium ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full h-10 font-medium cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending link...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
