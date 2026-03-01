import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { login } from "@/store/slices/login";
import { Eye, EyeOff } from "lucide-react";


const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] =  useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTypeSelection, setShowTypeSelection] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleSubmit = async (e?: React.FormEvent, forceType?: string) => {
    if (e) e.preventDefault();
    setError('');
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    if (forceType || showTypeSelection) {
      setLoginType(forceType || loginType);
    }else{
      setLoginType("")
    }
    try {
      const resultAction = await dispatch(login({ email, password, loginType }));
      if (login.fulfilled.match(resultAction)) {
        const data = resultAction.payload;
        if (data.success) {
          navigate("/dashboard");
        } else {
          const backendError =
            typeof data.error === "string"
              ? data.error
              : data.response?.message || "Login failed";
          if (
            backendError.includes("Invalid Email or Password") ||
            backendError.includes("admin")
          ) {
            setError("Invalid Email or Password");
          } else if (
            backendError.includes("Email exists in both customer and admin accounts. Please specify login type.")
          ) {
            setShowTypeSelection(true);
            setError(backendError);
          } else {
            setError(backendError || "Login failed");
          }
          setError(backendError);
        }
      } else if (login.rejected.match(resultAction)) {
        const payloadError = resultAction.payload;
        const errorMessage =
          typeof payloadError === "string"
            ? payloadError
            : (payloadError as any)?.error || "Login failed. Please try again.";
        if (
          errorMessage.includes("Invalid Email or Password for admin")
        ) {
          setError("Invalid Email or Password");
        } else if (
          errorMessage.includes("Email exists in both customer and admin accounts. Please specify login type.")
        ) {
          setShowTypeSelection(true);

          setError(errorMessage);
        } else {
          setError(errorMessage);

        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="flex min-h-screen items-center justify-center bg-background p-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm"
    >
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-center mb-5 text-sm text-muted-foreground">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Expanding Section */}
          <AnimatePresence>
            {showTypeSelection && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 py-2">
                  <label className="text-sm font-medium">Select Account Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLoginType('customer')}
                      className={`flex items-center justify-center rounded-md border p-2 text-sm transition-colors ${
                        loginType === 'customer' ? 'border-primary bg-primary/10' : 'border-input'
                      }`}
                    >
                      Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginType('admin')}
                      className={`flex items-center justify-center rounded-md border p-2 text-sm transition-colors ${
                        loginType === 'admin' ? 'border-primary bg-primary/10' : 'border-input'
                      }`}
                    >
                      Staff / Admin
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </motion.div>
  </div>
);
};

export default Login;