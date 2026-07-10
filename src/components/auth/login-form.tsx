"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Loader2, Mail, Sparkles, Tag, CheckCircle2 } from "lucide-react";

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

  return (
    <div className="login-card">
      {/* ── Illustration panel ── */}
      <div className="login-card__hero">
        <div className="login-card__hero-blob" />
        {/* Coupon illustration */}
        <div className="login-card__coupon">
          <div className="coupon-ticket">
            <div className="coupon-ticket__left">
              <Tag className="coupon-icon" strokeWidth={1.5} />
            </div>
            <div className="coupon-ticket__body">
              <span className="coupon-ticket__label">SAVE</span>
              <span className="coupon-ticket__value">50%</span>
              <span className="coupon-ticket__sub">on your next order</span>
            </div>
            <div className="coupon-ticket__notch coupon-ticket__notch--top" />
            <div className="coupon-ticket__notch coupon-ticket__notch--bottom" />
          </div>
        </div>
        <p className="login-card__hero-title">Coupan Lelo</p>
        <p className="login-card__hero-sub">
          Discover exclusive deals & save more every day
        </p>
      </div>

      {/* ── Divider ── */}
      <div className="login-card__divider-line" />

      {/* ── Form panel ── */}
      <div className="login-card__body">
        <h1 className="login-card__heading">Sign In</h1>
        <p className="login-card__desc">
          We&apos;ll send a magic link to your inbox — no password needed.
        </p>

        {message?.type === "success" ? (
          <div className="login-success">
            <CheckCircle2 className="login-success__icon" />
            <p className="login-success__text">{message.text}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="login-card__form">
            {/* Email field */}
            <div className="login-field">
              <div className={`login-input-wrap ${errors.email ? "login-input-wrap--error" : ""}`}>
                <Mail className="login-input-icon" strokeWidth={1.8} />
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  disabled={isLoading}
                  className="login-input"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="login-field__error">{errors.email.message}</p>
              )}
            </div>

            {/* Error message */}
            {message?.type === "error" && (
              <p className="login-error-banner">{message.text}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-btn login-btn--primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="login-btn__spinner" />
                  Sending link…
                </>
              ) : (
                <>
                  <Sparkles className="login-btn__icon" />
                  Continue with Email
                </>
              )}
            </button>
          </form>
        )}

        {/* ── Divider "or" ── */}
        {!message?.type && (
          <>
            <div className="login-or">
              <span className="login-or__line" />
              <span className="login-or__label">or</span>
              <span className="login-or__line" />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${window.location.origin}/auth/callback` },
                });
              }}
              className="login-btn login-btn--social"
            >
              {/* Google coloured "G" */}
              <svg className="login-btn__social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </>
        )}
      </div>

      {/* ── Card styles ── */}
      <style>{`
        /* ---------- Card shell ---------- */
        .login-card {
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 28px;
          box-shadow:
            0 2px 4px rgba(0,0,0,.04),
            0 8px 24px rgba(0,0,0,.08),
            0 0 0 1px rgba(0,0,0,.06);
          overflow: hidden;
          font-family: inherit;
        }

        /* ---------- Hero panel ---------- */
        .login-card__hero {
          position: relative;
          background: #f6faf3;
          padding: 36px 24px 28px;
          text-align: center;
          overflow: hidden;
        }
        .login-card__hero-blob {
          position: absolute;
          inset: -60px;
          background: radial-gradient(circle at 60% 40%, #c8f0b0 0%, transparent 60%),
                      radial-gradient(circle at 20% 80%, #b0e8c8 0%, transparent 55%);
          opacity: .55;
          pointer-events: none;
        }

        /* -- coupon ticket -- */
        .login-card__coupon {
          position: relative;
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }
        .coupon-ticket {
          position: relative;
          display: flex;
          align-items: center;
          background: #ffffff;
          border-radius: 14px;
          padding: 14px 20px 14px 16px;
          gap: 14px;
          box-shadow: 0 4px 16px rgba(0,0,0,.10);
          border: 1.5px dashed #a8d89b;
          width: 220px;
        }
        .coupon-ticket__left {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e8f8df;
          border-radius: 10px;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
        }
        .coupon-icon { width: 22px; height: 22px; color: #3a9e4f; }
        .coupon-ticket__body {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
        .coupon-ticket__label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .12em;
          color: #6aaa58;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .coupon-ticket__value {
          font-size: 26px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.1;
        }
        .coupon-ticket__sub {
          font-size: 11px;
          color: #888;
          margin-top: 3px;
        }
        /* punch-out notches */
        .coupon-ticket__notch {
          position: absolute;
          left: calc(44px + 16px + 7px);
          width: 16px;
          height: 16px;
          background: #f6faf3;
          border-radius: 50%;
        }
        .coupon-ticket__notch--top  { top: -8px;  }
        .coupon-ticket__notch--bottom { bottom: -8px; }

        /* hero text */
        .login-card__hero-title {
          position: relative;
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 4px;
        }
        .login-card__hero-sub {
          position: relative;
          font-size: 12.5px;
          color: #666;
          margin: 0;
          line-height: 1.5;
        }

        /* ---------- Divider line ---------- */
        .login-card__divider-line {
          height: 1px;
          background: #ebebeb;
        }

        /* ---------- Body / form ---------- */
        .login-card__body {
          padding: 28px 28px 32px;
        }
        .login-card__heading {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 6px;
          text-align: center;
        }
        .login-card__desc {
          font-size: 13px;
          color: #777;
          text-align: center;
          margin: 0 0 22px;
          line-height: 1.5;
        }

        /* ---------- Form ---------- */
        .login-card__form { display: flex; flex-direction: column; gap: 14px; }

        /* -- Input wrap -- */
        .login-field { display: flex; flex-direction: column; gap: 5px; }
        .login-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f7f7f7;
          border: 1.5px solid #e5e5e5;
          border-radius: 12px;
          padding: 0 14px;
          transition: border-color .18s, box-shadow .18s;
        }
        .login-input-wrap:focus-within {
          border-color: #4aae3f;
          box-shadow: 0 0 0 3px rgba(74,174,63,.12);
          background: #fff;
        }
        .login-input-wrap--error { border-color: #e25c5c !important; }
        .login-input-icon { width: 16px; height: 16px; color: #aaa; flex-shrink: 0; }
        .login-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          height: 48px;
          font-size: 14px;
          color: #1a1a1a;
        }
        .login-input::placeholder { color: #bbb; }
        .login-field__error { font-size: 12px; color: #e25c5c; margin: 0; }

        /* -- Error banner -- */
        .login-error-banner {
          font-size: 13px;
          color: #c0392b;
          background: #fef0f0;
          border: 1px solid #fad0d0;
          border-radius: 10px;
          padding: 10px 14px;
          text-align: center;
          margin: 0;
        }

        /* ---------- Buttons ---------- */
        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          height: 50px;
          border: none;
          border-radius: 14px;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          transition: transform .15s, box-shadow .15s, filter .15s;
        }
        .login-btn:active { transform: scale(.97); }
        .login-btn:disabled { opacity: .65; cursor: not-allowed; }

        .login-btn--primary {
          background: #2d9e27;
          color: #fff;
          box-shadow: 0 4px 14px rgba(45,158,39,.35);
        }
        .login-btn--primary:hover:not(:disabled) {
          filter: brightness(1.08);
          box-shadow: 0 6px 20px rgba(45,158,39,.45);
        }
        .login-btn__spinner { width: 17px; height: 17px; animation: spin .7s linear infinite; }
        .login-btn__icon    { width: 16px; height: 16px; }

        .login-btn--social {
          background: #fff;
          color: #1a1a1a;
          border: 1.5px solid #e5e5e5;
          box-shadow: 0 2px 8px rgba(0,0,0,.06);
        }
        .login-btn--social:hover:not(:disabled) {
          background: #fafafa;
          box-shadow: 0 4px 14px rgba(0,0,0,.10);
        }
        .login-btn__social-icon { width: 20px; height: 20px; flex-shrink: 0; }

        /* ---------- "or" divider ---------- */
        .login-or {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 20px 0;
        }
        .login-or__line { flex: 1; height: 1px; background: #ebebeb; }
        .login-or__label { font-size: 12px; color: #aaa; white-space: nowrap; }

        /* ---------- Success state ---------- */
        .login-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px 0 8px;
          text-align: center;
          animation: fadeUp .4s ease;
        }
        .login-success__icon { width: 40px; height: 40px; color: #2d9e27; }
        .login-success__text { font-size: 14px; color: #444; }

        /* ---------- Keyframes ---------- */
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ---------- Dark mode ---------- */
        @media (prefers-color-scheme: dark) {
          .login-card { background: #1c1c1e; box-shadow: 0 2px 4px rgba(0,0,0,.3), 0 8px 32px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.06); }
          .login-card__hero { background: #111; }
          .login-card__hero-blob { opacity: .25; }
          .coupon-ticket { background: #252525; border-color: #4aae3f88; }
          .coupon-ticket__left { background: #1e3a1e; }
          .coupon-ticket__sub { color: #777; }
          .coupon-ticket__notch { background: #111; }
          .login-card__divider-line { background: #2e2e2e; }
          .login-card__heading { color: #f0f0f0; }
          .login-card__desc { color: #888; }
          .login-card__hero-title { color: #f0f0f0; }
          .login-input-wrap { background: #2a2a2a; border-color: #3a3a3a; }
          .login-input-wrap:focus-within { background: #1c1c1e; }
          .login-input { color: #f0f0f0; }
          .login-input::placeholder { color: #555; }
          .login-btn--social { background: #252525; border-color: #3a3a3a; color: #f0f0f0; }
          .login-btn--social:hover:not(:disabled) { background: #2e2e2e; }
          .login-or__line { background: #2e2e2e; }
          .login-success__text { color: #bbb; }
        }
      `}</style>
    </div>
  );
}
