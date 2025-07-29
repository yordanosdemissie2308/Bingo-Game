"use client";
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../componets/Firebase";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );
      console.log("User logged in:", userCredential.user);

      // Redirect to main page after login
      router.push("/web/admin-dashbord");
    } catch (err: any) {
      console.error("Firebase Login Error:", err.code, err.message);
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password. Please try again.");
          break;
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;
        default:
          setError("Login failed. Please try again.");
      }
    }
  };

  const goToSignUp = () => {
    router.push("/web/sign-up");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border border-indigo-200 animate-fade-in"
      >
        <h2 className="text-4xl font-bold text-center text-indigo-700 mb-8">
          Welcome Back
        </h2>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-100 px-4 py-2 rounded">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-4 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-6 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Login
        </button>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">Don’t have an account?</span>
          <button
            type="button"
            onClick={goToSignUp}
            className="ml-2 text-indigo-600 hover:text-indigo-800 font-medium transition underline"
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
