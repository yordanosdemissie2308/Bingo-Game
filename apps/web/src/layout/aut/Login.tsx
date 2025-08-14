"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../componets/Firbase";

const LoginPage = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("web/home-home");
    } catch (err: any) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 animate-gradient opacity-90"></div>

      {/* Bouncing Bingo Balls */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-14 h-14 rounded-full bg-white shadow-lg border-4 border-yellow-400 text-black font-bold flex items-center justify-center animate-bounce-slow"
          style={{
            top: `${Math.random() * 90}%`,
            left: `${Math.random() * 90}%`,
            animationDelay: `${i * 0.6}s`,
          }}
        >
          {Math.floor(Math.random() * 75) + 1}
        </div>
      ))}

      {/* Floating Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-70 animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Login Box */}
      <form
        onSubmit={handleLogin}
        className="relative z-10 bg-white/95 backdrop-blur-xl p-10 rounded-2xl shadow-2xl w-full max-w-md transform animate-fadeIn hover:scale-[1.03] transition-all duration-300 border border-purple-300"
      >
        <h1 className="text-center font-extrabold text-3xl bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent mb-8 drop-shadow-lg">
          🎯 Doxa Bingo Game Login
        </h1>

        {error && (
          <div className="mb-4 text-red-600 font-semibold text-center animate-shake">
            {error}
          </div>
        )}

        <div className="mb-4 animate-slideUp">
          <label
            htmlFor="email"
            className="block mb-1 font-semibold text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none transition-all duration-300 hover:shadow-md"
            placeholder="you@example.com"
          />
        </div>

        <div className="mb-6 animate-slideUp delay-100">
          <label
            htmlFor="password"
            className="block mb-1 font-semibold text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none transition-all duration-300 hover:shadow-md"
            placeholder="Your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-pink-400/50 transition-all duration-300 animate-pulseGlow"
        >
          {loading ? (
            <span className="flex justify-center items-center gap-2">
              <span className="w-6 h-6 bg-yellow-300 rounded-full border-2 border-white animate-rollBall"></span>
              Logging in...
            </span>
          ) : (
            "Login"
          )}
        </button>
      </form>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease forwards;
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20%,
          60% {
            transform: translateX(-5px);
          }
          40%,
          80% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease forwards;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        @keyframes bounceSlow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-bounce-slow {
          animation: bounceSlow 4s infinite ease-in-out;
        }
        @keyframes float {
          0% {
            transform: translateY(0);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-15px);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 0.8;
          }
        }
        .animate-float {
          animation: float 5s infinite ease-in-out;
        }
        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 10px rgba(255, 105, 180, 0.6);
          }
          50% {
            box-shadow: 0 0 25px rgba(255, 105, 180, 0.9);
          }
          100% {
            box-shadow: 0 0 10px rgba(255, 105, 180, 0.6);
          }
        }
        .animate-pulseGlow {
          animation: pulseGlow 2s infinite;
        }
        @keyframes rollBall {
          0% {
            transform: rotate(0deg) translateX(0);
          }
          50% {
            transform: rotate(180deg) translateX(5px);
          }
          100% {
            transform: rotate(360deg) translateX(0);
          }
        }
        .animate-rollBall {
          animation: rollBall 1s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
