"use client";

import { FormEvent, useEffect, useState } from "react";
import { createRole, fetchPermissions, fetchRoles } from "@/services/adminService";
import type { Permission, Role } from "@/types/auth";

export function RolesPanel() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [roleData, permissionData] = await Promise.all([fetchRoles(), fetchPermissions()]);
      setRoles(roleData.roles);
      setPermissions(permissionData.permissions);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load roles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const togglePermission = (key: string) => {
    setSelected((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await createRole({ name, description, permissions: selected });
      setName("");
      setDescription("");
      setSelected([]);
      setSuccess("Role created successfully.");
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create role.");
    }
  };

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, permission) => {
    acc[permission.group] = acc[permission.group] || [];
    acc[permission.group].push(permission);
    return acc;
  }, {});

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div>
        <h1 className="text-2xl font-bold">Roles and Permissions</h1>
        <div className="mt-5 rounded-md border border-slate-200 bg-white shadow-sm">
          {loading ? <p className="p-5 text-slate-600">Loading roles...</p> : null}
          {!loading && roles.length === 0 ? <p className="p-5 text-slate-600">No roles yet.</p> : null}
          {!loading && roles.map((role) => (
            <article key={role._id} className="border-b border-slate-200 p-4 last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{role.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{role.description || "No description"}</p>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{role.permissions.length} permissions</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Create role</h2>
        <div className="mt-4 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Role name
            <input className="rounded-md border border-slate-300 px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Description
            <textarea className="min-h-20 rounded-md border border-slate-300 px-3 py-2" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={300} />
          </label>
        </div>

        <div className="mt-5 grid gap-4">
          {Object.entries(grouped).map(([group, groupPermissions]) => (
            <fieldset key={group} className="rounded-md border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold text-slate-900">{group}</legend>
              <div className="mt-2 grid gap-2">
                {groupPermissions.map((permission) => (
                  <label key={permission.key} className="flex items-start gap-2 text-sm text-slate-700">
                    <input className="mt-1" type="checkbox" checked={selected.includes(permission.key)} onChange={() => togglePermission(permission.key)} />
                    <span>
                      <span className="font-medium text-slate-900">{permission.label}</span>
                      <span className="block text-xs text-slate-500">{permission.key}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

        <button className="mt-5 rounded-md bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800" type="submit">
          Create role
        </button>
      </form>
    </section>
  );
}
