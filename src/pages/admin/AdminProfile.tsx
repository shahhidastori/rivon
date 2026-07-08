import { FormEvent, useEffect, useState } from "react";
import { Button, Field } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

export function AdminProfile() {
  const { admin, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: admin?.name || "",
    email: admin?.email || "",
    currentPassword: "",
    newPassword: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!admin) return;
    setForm((current) => ({
      ...current,
      name: admin.name,
      email: admin.email
    }));
  }, [admin]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile({
        name: form.name,
        email: form.email,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined
      });
      setForm((current) => ({ ...current, currentPassword: "", newPassword: "" }));
      setSuccess("Admin user details updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update admin user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-page admin-profile-page">
      <div className="admin-heading">
        <span>Account</span>
        <h1>Admin User</h1>
      </div>

      <form className="admin-card admin-profile-card" onSubmit={submit}>
        <div className="admin-profile-copy">
          <h2>Super user details</h2>
          <p>Update the display name, login email, or password for the signed-in administrator.</p>
        </div>

        {error ? <div className="alert error">{error}</div> : null}
        {success ? <div className="alert success">{success}</div> : null}

        <div className="form-grid">
          <Field
            label="Actual user name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <Field
            label="Current password"
            type="password"
            value={form.currentPassword}
            onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
            placeholder="Required only when changing password"
            autoComplete="current-password"
          />
          <Field
            label="New password"
            type="password"
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
          />
        </div>

        <div className="admin-profile-actions">
          <Button loading={saving}>Save admin user</Button>
        </div>
      </form>
    </section>
  );
}
