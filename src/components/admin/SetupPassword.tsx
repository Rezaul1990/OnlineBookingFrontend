"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setupPassword } from "@/services/adminService";

export function SetupPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Setup token is missing.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await setupPassword({ token, password });
      setSuccess("Password created. You can now sign in.");
      setTimeout(() => router.push("/admin/login"), 1000);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Create password</h1>
        <p className="mt-2 text-sm text-slate-600">Set your own password to activate the admin account.</p>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Password
            <input className="rounded-md border border-slate-300 px-3 py-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Confirm password
            <input className="rounded-md border border-slate-300 px-3 py-2" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} />
          </label>
        </div>

        {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

        <button className="mt-5 w-full rounded-md bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60" disabled={submitting}>
          {submitting ? "Creating..." : "Create password"}
        </button>
      </form>
    </main>
  );
}
