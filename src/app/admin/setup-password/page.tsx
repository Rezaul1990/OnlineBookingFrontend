import { Suspense } from "react";
import { SetupPassword } from "@/components/admin/SetupPassword";

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-slate-100 text-slate-600">Loading setup...</main>}>
      <SetupPassword />
    </Suspense>
  );
}
