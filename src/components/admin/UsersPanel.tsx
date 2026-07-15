"use client";

import { FormEvent, useEffect, useState } from "react";
import { createUser, fetchRoles, fetchUsers } from "@/services/adminService";
import type { AdminUser, Role } from "@/types/auth";

export function UsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState({ name: "", email: "", roleId: "" });
  const [setupLink, setSetupLink] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [userData, roleData] = await Promise.all([fetchUsers(), fetchRoles()]);
      setUsers(userData.users);
      setRoles(roleData.roles);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const data = await createUser(form);
      const link = `${window.location.origin}/admin/setup-password?token=${data.setupToken}`;
      setSetupLink(link);
      setForm({ name: "", email: "", roleId: "" });
      setSuccess("User invited. Copy the setup link and send it to the user.");
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create user.");
    }
  };

  const copySetupLink = async () => {
    if (!setupLink) return;
    await navigator.clipboard.writeText(setupLink);
    setSuccess("Setup link copied.");
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="mt-5 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          {loading ? <p className="p-5 text-slate-600">Loading users...</p> : null}
          {!loading && users.length === 0 ? <p className="p-5 text-slate-600">No users yet.</p> : null}
          {!loading && users.length > 0 ? (
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id || user.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3 text-slate-600">{user.roleId?.name || user.role?.name || "No role"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{user.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Create user</h2>
        <div className="mt-4 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Name
            <input className="rounded-md border border-slate-300 px-3 py-2" value={form.name} onChange={(event) => updateField("name", event.target.value)} required minLength={2} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email
            <input className="rounded-md border border-slate-300 px-3 py-2" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Role
            <select className="rounded-md border border-slate-300 px-3 py-2" value={form.roleId} onChange={(event) => updateField("roleId", event.target.value)} required>
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}
        {setupLink ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">Password setup link</p>
            <input className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" readOnly value={setupLink} />
            <button className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={copySetupLink}>
              Copy link
            </button>
          </div>
        ) : null}

        <button className="mt-5 rounded-md bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800" type="submit">
          Create invitation
        </button>
      </form>
    </section>
  );
}
