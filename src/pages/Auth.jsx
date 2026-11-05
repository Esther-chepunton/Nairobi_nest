import { motion } from "framer-motion";
import { useState } from "react";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiPost, claimSearchSession } from "../lib/api";
import { auth as authCopy } from "../lib/copy";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const persistSession = (token, user) => {
    localStorage.setItem("userToken", token);
    localStorage.setItem("userData", JSON.stringify(user));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!isLogin) {
        await apiPost("/api/auth/signup", { full_name: fullName, email, password });
      }
      const data = await apiPost("/api/auth/login", { email, password });
      persistSession(data.token, data.user);
      // Attach any anonymous search session to this account before redirect.
      await claimSearchSession().catch(() => null);
      toast.success(isLogin ? authCopy.toast.welcomeBack : authCopy.toast.accountCreated);
      const redirect = sessionStorage.getItem("authRedirect") || "/";
      sessionStorage.removeItem("authRedirect");
      navigate(redirect);
    } catch (error) {
      toast.error(error.message || authCopy.toast.failed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueAsGuest = () => {
    localStorage.setItem("kijiji_onboarded", "true");
    navigate("/");
  };

  const copy = isLogin ? authCopy.signIn : authCopy.signUp;

  return (
    <div className="min-h-screen flex items-center justify-center bg-kijiji-deep px-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <p className="text-kijiji-accent text-sm mb-1">{authCopy.eyebrow}</p>
        <h2 className="font-serif text-3xl text-kijiji-text mb-2">{copy.title}</h2>
        <p className="text-muted text-sm mb-6">{copy.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm text-muted mb-2">{authCopy.labels.name}</label>
              <div className="flex items-center gap-2 glass rounded-lg p-3">
                <FaUser className="text-kijiji-accent" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent border-none outline-none"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-muted mb-2">{authCopy.labels.email}</label>
            <div className="flex items-center gap-2 glass rounded-lg p-3">
              <FaEnvelope className="text-kijiji-accent" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-none outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">{authCopy.labels.password}</label>
            <div className="flex items-center gap-2 glass rounded-lg p-3">
              <FaLock className="text-kijiji-accent" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-none outline-none"
                minLength={isLogin ? undefined : 8}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting
              ? authCopy.submit.loading
              : isLogin
                ? authCopy.submit.signIn
                : authCopy.submit.signUp}
          </button>
        </form>

        <p className="mt-4 text-center text-muted text-sm">
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-kijiji-accent">
            {isLogin ? authCopy.toggle.toSignUp : authCopy.toggle.toSignIn}
          </button>
        </p>

        <button type="button" onClick={continueAsGuest} className="w-full text-center text-muted text-sm mt-4 py-2">
          {authCopy.guest}
        </button>
      </motion.div>
    </div>
  );
}
