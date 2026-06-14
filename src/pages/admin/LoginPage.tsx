import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button, Field } from "../../components/ui";
import rivonLogo from "../../assets/rivon-logo.png";

export function LoginPage() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@rivon.test");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (admin) return <Navigate to="/admin" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <form className="login-card" onSubmit={submit}>
        <img className="login-logo" src={rivonLogo} alt="Rivon Resort logo" />
        <h1>Admin Login</h1>
        <p>Manage Rivon rooms, bookings, customers, and website content.</p>
        {error ? <div className="alert error">{error}</div> : null}
        <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button loading={loading}>Login</Button>
      </form>
    </main>
  );
}
