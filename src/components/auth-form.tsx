"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loginFormSchema,
  registerSchema,
  type RegisterInput,
} from "@/lib/auth/validation";

type AuthFormProps =
  | { mode: "login" }
  | { mode: "register" };

type FieldErrors = Record<string, string[] | undefined>;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isRegister = mode === "register";

  const form = useForm<RegisterInput>({
    resolver: zodResolver(
      isRegister ? registerSchema : loginFormSchema,
    ),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function submit(values: RegisterInput) {
    setFormError(null);

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as {
      error?: string;
      fields?: FieldErrors;
    };

    if (!response.ok) {
      setFormError(payload.error ?? "Something went wrong. Please try again.");

      for (const [field, messages] of Object.entries(payload.fields ?? {})) {
        const message = messages?.[0];
        if (message && field in values) {
          form.setError(field as never, { message });
        }
      }
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-md"
    >
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold text-primary">
          {isRegister ? "Start fresh" : "Welcome back"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {isRegister ? "Create your account" : "Make today productive."}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {isRegister
            ? "Create one calm place for every deadline and priority."
            : "Sign in to see what matters and keep your day moving."}
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        {isRegister ? (
          <Field
            label="Name"
            error={form.formState.errors.name?.message}
          >
            <Input
              autoComplete="name"
              placeholder="Alex Johnson"
              {...form.register("name")}
            />
          </Field>
        ) : null}

        <Field
          label="Email address"
          error={form.formState.errors.email?.message}
        >
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...form.register("email")}
          />
        </Field>

        <Field
          label="Password"
          error={form.formState.errors.password?.message}
        >
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="At least 8 characters"
              className="pr-11"
              {...form.register("password")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>

        {isRegister ? (
          <Field
            label="Confirm password"
            error={form.formState.errors.confirmPassword?.message}
          >
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your password"
              {...form.register("confirmPassword")}
            />
          </Field>
        ) : null}

        {formError ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <Button className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <LoaderCircle className="animate-spin" size={17} />
          ) : null}
          {isRegister ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isRegister ? "Already have an account?" : "New to Zeinth?"}{" "}
        <Link
          className="font-semibold text-primary hover:underline"
          href={isRegister ? "/login" : "/register"}
        >
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </motion.div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? (
        <span className="block text-xs text-destructive">{error}</span>
      ) : null}
    </label>
  );
}
