import { useNavigate, Link } from "react-router";
import "../auth.form.scss";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";

const Login = () => {
  const { loading, handleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin({ email, password });
    navigate("/");
  };

  if (loading) {
    return (
      <main>
        <div className="loader-container">
          <div className="loader"></div>
          <h1>Loading...</h1>
        </div>
      </main>
    );
  }
  return (
    <main>
      <div className="form-container">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              value={email}
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              value={password}
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              required
            />
          </div>
          <button className="button primary-button" type="submit">
            Login
          </button>
        </form>

        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </main>
  );
};

export default Login;
