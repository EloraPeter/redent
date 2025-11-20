"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [message, setMessage] = useState("");

  // Set mode based on URL query
  useEffect(() => {
    const mode = searchParams?.get("mode"); // optional chaining to avoid null
    if (mode === "signup") setIsSigningUp(true);
    else setIsSigningUp(false);
  }, [searchParams]); // depend on searchParams, not mode

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (isSigningUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage("Signup successful! Check your email for confirmation.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else {
        setMessage("Login successful!");
        router.push("/dashboard"); // redirect after login
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6">{isSigningUp ? "Sign Up" : "Login"}</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition"
        >
          {isSigningUp ? "Sign Up" : "Login"}
        </button>

        <p className="mt-2 text-center text-sm text-gray-600">
          <button
            type="button"
            onClick={() => router.push("/reset-password")}
            className="text-indigo-600 hover:underline"
          >
            Forgot Password?
          </button>
        </p>

        <p className="mt-4 text-sm text-center text-gray-600">
          {isSigningUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsSigningUp(!isSigningUp)}
            className="text-indigo-600 hover:underline"
          >
            {isSigningUp ? "Login" : "Sign Up"}
          </button>
        </p>

        {message && <p className="mt-4 text-center text-red-500">{message}</p>}
      </form>
    </div>
  );
}
