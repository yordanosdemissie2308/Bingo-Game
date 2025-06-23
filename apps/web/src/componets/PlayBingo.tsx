"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./Firbase";

export default function PlayBingo() {
  const params = useSearchParams();
  const selectedParam = params?.get("selected") ?? "";
  const bet = params?.get("bet") ?? "0";
  const bonus = params?.get("bonus") ?? "None";

  const [marked, setMarked] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [lang, setLang] = useState<"en" | "am">("am");
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const [cards, setCards] = useState<number[][][]>([]);
  const [showCards, setShowCards] = useState(false);
  const [speed, setSpeed] = useState("2000");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedCartelaIndex, setSelectedCartelaIndex] = useState<
    number | null
  >(null);
  const [showBingoGrid, setShowBingoGrid] = useState(true);
  const [isGridExpanded, setIsGridExpanded] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const letters = ["B", "I", "N", "G", "O"] as const;
  const ranges: [number, number][] = [
    [1, 15],
    [16, 30],
    [31, 45],
    [46, 60],
    [61, 75],
  ];

  const getLabel = useCallback(
    (n: number) => {
      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        if (!range) continue;
        const [min, max] = range;
        if (n >= min && n <= max) {
          return `${letters[i]}${n}`;
        }
      }
      return `${n}`;
    },
    [letters, ranges]
  );

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

  useEffect(() => {
    if (!selectedParam) return;
    const ids = selectedParam.split(",").filter(Boolean);

    const fetchCards = async () => {
      const loaded: number[][][] = [];
      for (const id of ids) {
        try {
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
        } catch (err) {
          console.error(`Failed to load card ${id}:`, err);
        }
      }
      setCards(loaded);
    };

    fetchCards();
  }, [selectedParam]);

  const markRandom = useCallback(() => {
    // Mark numbers completely randomly from 1 to 75, ignoring cartelas
    const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
    const left = allNumbers.filter((n) => !marked.includes(n));
    if (!left.length) {
      setPlaying(false);
      return;
    }
    const pick = left[Math.floor(Math.random() * left.length)];
    if (pick === undefined) return; // safety check

    const lbl = getLabel(pick);
    setMarked((prev) => [...prev, pick]);
    setLastLabel(lbl);
    speak(lbl);
  }, [marked, getLabel, speak]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setTimeout(markRandom, Number(speed));
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, markRandom, speed]);

  const resetAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMarked([]);
    setLastLabel(null);
    setPlaying(false);
  };

  const handlePlayClick = () => {
    if (!playing) {
      const audio = new Audio("/audio/ጨዋታው ተጀምሯል.m4a");
      audio.play().catch((e) => {
        console.error("Audio play failed:", e);
        alert("Audio failed to play: " + e.message);
      });
    }
    setPlaying((p) => !p);
  };

  const parseCartelaInput = (input: string): number | null => {
    if (!input) return null;
    const cleaned = input.toLowerCase().replace("cartela", "").trim();
    const num = Number(cleaned);
    return isNaN(num) ? null : num - 1;
  };

  return (
    <div className="p-6 sm:p-10 min-h-screen">
      {/* Expand / Close Buttons */}
      <div className="flex justify-between mb-4">
        <button
          onClick={() => setIsGridExpanded((prev) => !prev)}
          className="px-4 py-2 rounded-md hover:bg-gray-800"
        >
          {isGridExpanded ? "⤡ " : "⤢ "}
        </button>
        <button
          onClick={() => setShowBingoGrid(false)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          title="Close Grid"
        >
          ✖
        </button>
      </div>

      {/* Bingo Grid */}
      {showBingoGrid && (
        <div
          className={`${
            isGridExpanded ? "w-full h-[90vh]" : "max-w-6xl mx-auto"
          } transition-all duration-300`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-center p-4 rounded-lg shadow-inner h-full">
            <div className="mb-4 lg:mb-0 lg:mr-4">
              <div className="mx-auto w-32 h-32 flex items-center justify-center rounded-full bg-yellow-300 text-3xl font-bold animate-pulse shadow">
                {lastLabel}
              </div>
            </div>
            <div className="overflow-auto w-full">
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
                <div className="col-span-5 grid grid-cols-15 gap-1">
                  {letters.map((_, ci) =>
                    Array.from({ length: 15 }).map((_, ri) => {
                      const range = ranges[ci];
                      if (!range) return null;
                      const [min] = range;
                      const num = min + ri;
                      const isM = marked.includes(num);
                      return (
                        <div
                          key={`${ci}-${ri}`}
                          className={`w-12 h-12 flex items-center justify-center text-sm font-bold rounded-md transition-all duration-300 shadow ${
                            isM
                              ? "bg-gradient-to-br from-green-400 to-green-700 text-white scale-105"
                              : "bg-white text-black hover:bg-indigo-100 hover:scale-105"
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
        </div>
      )}

      {/* Show Grid again button */}
      {!showBingoGrid && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowBingoGrid(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 shadow"
          >
            Show Bingo Grid
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-4 my-6">
        <button
          onClick={handlePlayClick}
          className={`px-5 py-2 rounded-md text-white ${
            playing ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {playing ? "⏸ Stop" : "▶ Play"}
        </button>
        <button
          onClick={() => setShowResetConfirm(true)}
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
        <select
          value={speed}
          onChange={(e) => setSpeed(e.target.value)}
          className="px-4 py-2 border rounded-md shadow-sm"
        >
          <option value="6000">6000 ms</option>
          <option value="4000">4000 ms</option>
          <option value="3000">3000 ms</option>
          <option value="2000">2000 ms</option>
        </select>
        <button
          onClick={() => setShowCards((v) => !v)}
          className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
        >
          {showCards ? "Hide My Cards" : "Show My Cards"}
        </button>
      </div>

      {/* Cartela Selector */}
      <div className="mb-4 flex justify-center gap-4">
        <input
          type="text"
          placeholder='Type "cartela1" or "1"'
          className="px-4 py-2 border rounded-md shadow-sm w-64"
          onChange={(e) => {
            const val = e.target.value.trim();
            setSelectedCartelaIndex(parseCartelaInput(val));
          }}
        />
        {selectedCartelaIndex !== null &&
          (cards[selectedCartelaIndex] ? (
            <div className="text-indigo-700 font-semibold">
              Showing Cartela #{selectedCartelaIndex + 1}
            </div>
          ) : (
            <div className="text-red-600 font-semibold">Cartela not found</div>
          ))}
      </div>

      {/* Bingo Cards */}
      {showCards && cards.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((grid, i) => {
            const isSelected = selectedCartelaIndex === i;
            if (selectedCartelaIndex !== null && !isSelected) return null;
            return (
              <div
                key={i}
                className={`p-4 rounded-lg shadow-lg ${
                  isSelected ? "ring-4 ring-indigo-500" : ""
                }`}
              >
                <h2 className="text-xl font-semibold mb-2 text-center text-indigo-700">
                  Cartela #{i + 1}
                </h2>
                <div className="grid grid-cols-5 gap-2">
                  {grid.flat().map((n, j) => (
                    <div
                      key={j}
                      className={`w-14 h-14 flex items-center justify-center font-bold rounded-md border ${
                        n === 0
                          ? "bg-yellow-400 text-white"
                          : marked.includes(n)
                            ? "bg-green-200 text-gray-800"
                            : "bg-gray-50 text-gray-700"
                      }`}
                      title={getLabel(n)}
                    >
                      {n === 0 ? "★" : n}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-center space-x-6 mt-8 text-lg">
        <div>
          <strong>Bet:</strong> ${bet}
        </div>
        <div>
          <strong>Win:</strong> ${((parseFloat(bet) || 0) * 0.8).toFixed(2)}
        </div>
      </div>

      {/* Reset Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full text-center">
            <p className="mb-4 text-lg font-semibold">
              Are you sure you want to reset?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAll();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Reset Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
