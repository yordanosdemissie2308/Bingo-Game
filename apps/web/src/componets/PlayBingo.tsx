"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./Firbase";

export default function PlayBingo() {
  const params = useSearchParams();
  const selectedParam = params.get("selected") || "";
  const bet = params.get("bet") || "0";
  const bonus = params.get("bonus") || "None";

  const [marked, setMarked] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [lang, setLang] = useState<"en" | "am">("am");
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const [cards, setCards] = useState<number[][][]>([]);
  const [showCards, setShowCards] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const delay = 2000;

  const letters = ["B", "I", "N", "G", "O"] as const;
  const ranges: [number, number][] = [
    [1, 15],
    [16, 30],
    [31, 45],
    [46, 60],
    [61, 75],
  ];

  const getLabel = useCallback((n: number) => {
    for (let i = 0; i < ranges.length; i++) {
      const [s, e] = ranges[i] as [number, number];
      if (n >= s && n <= e) return `${letters[i]}${n}`;
    }
    return `${n}`;
  }, []);
  const speak = useCallback(
    (lbl: string) => {
      if (lang === "am") {
        new Audio(`/audio/${lbl}.m4a`).play().catch(console.error);
      } else if (typeof window !== "undefined" && window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(lbl);
        u.lang = "en-US";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    },
    [lang]
  );

  // Load cards from Firebase
  useEffect(() => {
    if (!selectedParam) return;
    const ids = selectedParam.split(",").filter(Boolean);
    (async () => {
      const loaded: number[][][] = [];
      for (const id of ids) {
        const snap = await getDoc(doc(db, "cartelas", id));
        if (!snap.exists()) continue;
        const data = snap.data() as Record<
          "B" | "I" | "N" | "G" | "O",
          string[]
        >;
        const cols = letters.map((c) =>
          data[c].map((v) => (v === "FREE" ? 0 : parseInt(v, 10)))
        );
        const rows = Array.from({ length: 5 }, (_, r) =>
          cols.map((col) => col[r] ?? 0)
        );
        loaded.push(rows);
      }
      setCards(loaded);
    })();
  }, [selectedParam]);

  const markRandom = useCallback(() => {
    const all = cards.flat(2).filter((n): n is number => n !== 0);
    const left = all.filter((n) => !marked.includes(n));
    if (!left.length) {
      setPlaying(false);
      return;
    }
    const pick = left[Math.floor(Math.random() * left.length)] ?? 0;
    const lbl = getLabel(pick);
    setMarked((prev) => [...prev, pick] as number[]);
    setLastLabel(lbl);
    speak(lbl);
  }, [cards, marked, getLabel, speak]);
  useEffect(() => {
    if (playing) {
      timerRef.current = setTimeout(markRandom, delay);
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, markRandom]);

  const resetAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMarked([]);
    setLastLabel(null);
    setPlaying(false);
  };

  return (
    <div className="p-20 min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="flex justify-between items-center">
        <div className="mx-auto w-32 h-32 flex items-center justify-center rounded-full bg-yellow-300 text-3xl font-bold animate-pulse shadow mb-6">
          {lastLabel}
        </div>
        <div className="overflow-auto mb-6 p-4 bg-white rounded-lg shadow-inner">
          <div className="grid grid-cols-6 gap-2">
            <div className="flex flex-col gap-2">
              {letters.map((l) => (
                <div
                  key={l}
                  className="w-12 h-12 bg-indigo-700 text-white rounded-md flex items-center justify-center font-semibold"
                >
                  {l}
                </div>
              ))}
            </div>
            <div className="col-span-5 grid grid-cols-15 gap-2">
              {letters.map((_, ci) =>
                Array.from({ length: 15 }).map((_, ri) => {
                  const num = (ranges[ci]?.[0] ?? 0) + ri;
                  const isM = marked.includes(num);
                  return (
                    <div
                      key={`${ci}-${ri}`}
                      className={`w-12 h-12 flex items-center justify-center rounded-md border ${
                        isM
                          ? "bg-green-500 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {num}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <button
          onClick={() => setPlaying((p) => !p)}
          className={`px-5 py-2 rounded-md text-white ${
            playing ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {playing ? "⏸ Stop" : "▶|| Play"}
        </button>
        <button
          onClick={resetAll}
          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
        >
          Reset
        </button>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as "en" | "am")}
          className="px-4 py-2 border rounded-md shadow-sm"
        >
          <option value="en">English</option>
          <option value="am">Amharic</option>
        </select>
        <button
          onClick={() => setShowCards((v) => !v)}
          className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
        >
          {showCards ? "Hide My Cards" : "Show My Cards"}
        </button>
      </div>

      {/* My Cards */}
      {showCards && cards.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((grid, ci) => (
            <div key={ci} className="bg-white p-4 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-2 text-center text-indigo-700">
                Card #{ci + 1}
              </h2>
              <div className="grid grid-cols-5 gap-2">
                {grid.flat().map((n, i) => {
                  const isM = marked.includes(n);
                  return (
                    <div
                      key={i}
                      className={`w-14 h-14 flex items-center justify-center font-bold rounded-md border ${
                        n === 0
                          ? "bg-yellow-400 text-white"
                          : isM
                            ? "bg-green-200 text-gray-800"
                            : "bg-gray-50 text-gray-700"
                      }`}
                      title={getLabel(n)}
                    >
                      {n === 0 ? "★" : n}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center space-x-6 mt-8 text-lg">
        <div>
          <strong>Bet:</strong> ${bet}
        </div>
        <div>
          <strong>Bonus:</strong> {bonus}
        </div>
      </div>
    </div>
  );
}
