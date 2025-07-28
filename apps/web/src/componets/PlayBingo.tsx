"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./Firbase";

export default function PlayBingo() {
  const params = useSearchParams();
  const selectedParam = params?.get("selected") ?? "";
  const bet = params?.get("bet") ?? "0";

  const [marked, setMarked] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [lang, setLang] = useState<"en" | "am">("am");
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const [cards, setCards] = useState<number[][][]>([]);
  const [speed, setSpeed] = useState("2000");
  const [showBingoGrid, setShowBingoGrid] = useState(true);
  const [expandBingoOnly, setExpandBingoOnly] = useState(false);

  const [allCartelas, setAllCartelas] = useState<any[]>([]); // all cartelas from storage
  const [showCartela, setShowCartela] = useState<any | null>(null);
  const [inputCardNumber, setInputCardNumber] = useState("");
  const [error, setError] = useState("");
  const [inputVisible, setInputVisible] = useState(false);

  // Track winners { cardIndex, type }
  const [winners, setWinners] = useState<{ cardIndex: number; type: string }[]>(
    []
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const letters = ["B", "I", "N", "G", "O"] as const;
  const ranges: [number, number][] = [
    [1, 15],
    [16, 30],
    [31, 45],
    [46, 60],
    [61, 75],
  ];

  // Convert cartela to 5x5 grid
  function convertToGrid(cartela: Record<string, string[]>): number[][] {
    const cols = letters.map(
      (c) => cartela[c]?.map((v) => (v === "FREE" ? 0 : parseInt(v))) ?? []
    );
    return Array.from({ length: 5 }, (_, r) => cols.map((col) => col[r] ?? 0));
  }

  // Load cards from Firestore
  useEffect(() => {
    if (!selectedParam) return;
    const ids = selectedParam.split(",").filter(Boolean);
    const fetchCards = async () => {
      const loaded: number[][][] = [];
      for (const id of ids) {
        const snap = await getDoc(doc(db, "cartelas", id));
        if (!snap.exists()) continue;
        const d = snap.data() as Record<"B" | "I" | "N" | "G" | "O", string[]>;
        const cols = letters.map((c) =>
          d[c].map((v) => (v === "FREE" ? 0 : parseInt(v)))
        );
        const rows = Array.from({ length: 5 }, (_, r) =>
          cols.map((col) => col[r] ?? 0)
        );
        loaded.push(rows);
      }
      setCards(loaded);
    };
    void fetchCards();
  }, [selectedParam]);

  // Load cartelas data from localStorage for checking by number
  useEffect(() => {
    const dataStr = localStorage.getItem("selectedCartelasData");
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        const dataWithNumbers = data.map((cartela: any, idx: number) => ({
          ...cartela,
          number: cartela.number ?? idx + 1,
        }));
        setAllCartelas(dataWithNumbers);
      } catch (e) {
        console.error("Failed to parse selected cartelas", e);
      }
    }
  }, []);

  // Check if all numbers in arr are marked
  const isMarked = (numbers: number[]) =>
    numbers.every((n) => marked.includes(n) || n === 0);

  // Check winning for one card
  function checkWinning(card: number[][], markedNumbers: number[]) {
    const winTypes: string[] = [];

    // Four Corners
    const corners = [
      card[0]?.[0] ?? 0,
      card[0]?.[4] ?? 0,
      card[4]?.[0] ?? 0,
      card[4]?.[4] ?? 0,
    ];
    if (isMarked(corners)) winTypes.push("Four Corners");

    // Diagonals
    const diag1 = [
      card[0]?.[0] ?? 0,
      card[1]?.[1] ?? 0,
      card[2]?.[2] ?? 0,
      card[3]?.[3] ?? 0,
      card[4]?.[4] ?? 0,
    ];
    if (isMarked(diag1)) winTypes.push("Main Diagonal");

    const diag2 = [
      card[0]?.[4] ?? 0,
      card[1]?.[3] ?? 0,
      card[2]?.[2] ?? 0,
      card[3]?.[1] ?? 0,
      card[4]?.[0] ?? 0,
    ];
    if (isMarked(diag2)) winTypes.push("Anti Diagonal");

    // Rows
    for (let r = 0; r < 5; r++) {
      const row = (card[r] ?? []).map((n) => n ?? 0);
      if (isMarked(row)) {
        winTypes.push(`Row ${r + 1}`);
      }
    }

    // Columns
    for (let c = 0; c < 5; c++) {
      const col = card.map((row) => row[c] ?? 0);
      if (isMarked(col)) {
        winTypes.push(`Column ${c + 1}`);
      }
    }

    return winTypes;
  }

  // Play winner sound separately when new winners appear
  useEffect(() => {
    if (cards.length === 0 || marked.length === 0) {
      setWinners([]);
      return;
    }

    const foundWinners: { cardIndex: number; type: string }[] = [];

    cards.forEach((card, idx) => {
      const wins = checkWinning(card, marked);
      wins.forEach((winType) => {
        foundWinners.push({ cardIndex: idx, type: winType });
      });
    });

    const winnersChanged =
      foundWinners.length !== winners.length ||
      foundWinners.some(
        (w, i) =>
          winners[i]?.cardIndex !== w.cardIndex || winners[i]?.type !== w.type
      );

    if (winnersChanged && foundWinners.length > 0) {
      // Play original winning sound
      new Audio("/audio/winning-sound.mp3").play().catch(() => {});

      // Also play a special "winner" voice or sound (fancier)
      const winnerAudio = new Audio("/audio/winner-voice.mp3");
      winnerAudio.volume = 0.8;
      winnerAudio.play().catch(() => {});
    }

    setWinners(foundWinners);
  }, [marked, cards]);

  const getLabel = useCallback((n: number) => {
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i] ?? [0, 0];
      const [min, max] = range;
      if (n >= min && n <= max) return `${letters[i]}${n}`;
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

  const markRandom = useCallback(() => {
    const left = Array.from({ length: 75 }, (_, i) => i + 1).filter(
      (n) => !marked.includes(n)
    );
    if (!left.length) {
      setPlaying(false);
      return;
    }
    const pick = left[Math.floor(Math.random() * left.length)];
    const lbl = getLabel(pick!);
    if (pick !== undefined) {
      setMarked((prev) => [...prev, pick]);
    }
    setLastLabel(lbl);
    speak(lbl);
  }, [marked, getLabel, speak]);

  useEffect(() => {
    if (playing) timerRef.current = setTimeout(markRandom, +speed);
    else if (timerRef.current) clearTimeout(timerRef.current);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [playing, markRandom, speed]);

  function resetAll() {
    timerRef.current && clearTimeout(timerRef.current);
    setMarked([]);
    setLastLabel(null);
    setPlaying(false);
    setWinners([]);
  }

  const toggleMarkNumber = (n: number) => {
    if (n === 0) return; // Don't toggle FREE space
    setMarked((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  };

  const handleCheckCard = () => {
    setError("");
    setShowCartela(null);
    const num = parseInt(inputCardNumber);

    if (isNaN(num)) {
      setError("Invalid card number");
      return;
    }

    const found = allCartelas.find((cartela) => cartela.number === num);

    if (found) {
      const grid = convertToGrid(found);
      setShowCartela({ ...found, cardNumber: num, grid });
    } else {
      setError("Card not found");
    }
  };

  const handleCancel = () => {
    setInputVisible(false);
    setInputCardNumber("");
    setError("");
    setShowCartela(null);
  };

  function handlePlayClick() {
    if (!playing) new Audio("/audio/ጨዋታው ተጀምሯል.m4a").play().catch(() => {});
    setPlaying((p) => !p);
  }

  return (
    <>
      <style>
        {`
          .marked {
            background-color: #facc15;
            color: black;
            box-shadow: 0 0 6px 2px #f59e0b;
            transition: background-color 0.3s ease;
          }
          .winner-card {
            box-shadow: 0 0 16px 4px #22c55e;
            animation: bounce 1.5s infinite alternate, glow 2s ease-in-out infinite;
            position: relative;
            border-radius: 1rem;
            background: linear-gradient(135deg, #e6ffe6 0%, #bbffbb 100%);
          }
          .winner-message {
            position: absolute;
            top: 8px;
            left: 8px;
            right: 8px;
            background-color: #d1fae5; /* light green */
            color: #065f46; /* dark green */
            font-weight: 700;
            padding: 8px 12px;
            border-radius: 8px;
            z-index: 10;
            text-align: center;
            box-shadow: 0 0 12px rgba(34, 197, 94, 0.9);
            font-size: 1.1rem;
            user-select: none;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes glow {
            0% {
              box-shadow: 0 0 8px 3px #22c55e;
            }
            50% {
              box-shadow: 0 0 20px 6px #16a34a;
            }
            100% {
              box-shadow: 0 0 8px 3px #22c55e;
            }
          }
        `}
      </style>
      <div className="relative p-6 min-h-screen text-white bg-gray-100">
        {/* Nav Buttons */}
        <div>
          <button
            onClick={() => {
              setExpandBingoOnly(true);
              setShowBingoGrid(true);
            }}
            className="fixed top-6 left-6 z-50 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-full shadow-lg"
            title="Enter Fullscreen"
          >
            ⛶
          </button>
          <button
            onClick={resetAll}
            className="fixed top-6 right-6 z-50 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-full shadow-lg"
            title="Reset Game"
          >
            ♻ Reset
          </button>
        </div>

        {/* Top Layout */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 pt-20 max-w-6xl mx-auto">
          <div className="w-48 h-72 flex-shrink-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-52 h-52 rounded-full border-8 border-red-700 bg-white flex items-center justify-center shadow-2xl">
                <span className="text-5xl font-black text-red-600">
                  {lastLabel ?? "0/75"}
                </span>
              </div>
            </div>
          </div>

          {/* Bingo Grid */}
          {showBingoGrid && (
            <div
              className={`${
                expandBingoOnly
                  ? "fixed top-0 left-0 w-screen h-screen z-50 bg-blue-900 p-8 flex flex-col items-center justify-start gap-6 overflow-auto"
                  : "flex-grow"
              } transition-all duration-500 rounded-lg bg-white bg-opacity-20 shadow-inner`}
            >
              {expandBingoOnly && (
                <button
                  onClick={() => setExpandBingoOnly(false)}
                  className="absolute top-4 right-4 px-5 py-2 text-lg bg-red-600 hover:bg-red-700 rounded-full text-white shadow"
                >
                  ✖ Exit Fullscreen
                </button>
              )}

              {expandBingoOnly && (
                <div className="mt-16">
                  <div className="w-52 h-52 rounded-full border-8 border-red-700 bg-white flex items-center justify-center shadow-2xl">
                    <span className="text-5xl font-black text-red-600">
                      {lastLabel ?? "0/75"}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-10 grid grid-cols-6 gap-1 w-fit">
                <div className="flex flex-col gap-1">
                  {letters.map((l, i) => {
                    const colors = [
                      "bg-red-500 text-white",
                      "bg-orange-500 text-white",
                      "bg-yellow-400 text-black",
                      "bg-green-500 text-white",
                      "bg-blue-500 text-white",
                    ];
                    return (
                      <div
                        key={l}
                        className={`w-14 h-14 flex items-center justify-center font-bold text-xl border border-yellow-400 shadow-[2px_2px_4px_#00000050] ${colors[i]}`}
                      >
                        {l}
                      </div>
                    );
                  })}
                </div>
                <div className="col-span-5 grid grid-cols-15 gap-3 ">
                  {letters.map((_, ci) =>
                    Array.from({ length: 15 }).map((_, ri) => {
                      const range = ranges[ci];
                      if (!range) return null;
                      const [min] = range;
                      const n = min + ri;
                      const isM = marked.includes(n);
                      return (
                        <div
                          key={`${ci}-${ri}`}
                          className={`h-12 w-10 flex items-center justify-center font-bold text-2xl select-none
                            ${isM ? "marked" : "bg-white"} text-black border border-gray-400 shadow-[2px_2px_4px_#00000050]`}
                        >
                          {n}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {!showBingoGrid && (
            <button
              onClick={() => setShowBingoGrid(true)}
              className="mt-10 px-8 py-3 bg-green-500 rounded-full shadow-lg hover:bg-green-600 font-semibold"
            >
              Show Grid
            </button>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-wrap justify-center gap-6 mt-8 max-w-3xl mx-auto">
          <button
            onClick={handlePlayClick}
            className={`px-8 py-3 rounded-full font-bold shadow-lg transition ${
              playing
                ? "bg-red-600 hover:bg-orange-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {playing ? "⏸ Stop" : "▶ Play"}
          </button>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            className="px-4 py-2 rounded-md bg-amber-50 text-black shadow-sm"
          >
            <option value="en">English</option>
            <option value="am">Amharic</option>
          </select>
          <select
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            className="px-4 py-2 rounded-md bg-amber-50 text-black shadow-sm"
          >
            <option value="6000">6000 ms</option>
            <option value="4000">4000 ms</option>
            <option value="3000">3000 ms</option>
            <option value="2000">2000 ms</option>
          </select>
        </div>

        {/* Check Cartela Section */}
        <div className="p-6 max-w-4xl mx-auto">
          {!inputVisible && (
            <button
              onClick={() => setInputVisible(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 mb-6"
            >
              Check Cartela
            </button>
          )}

          {inputVisible && (
            <div className="mb-6 flex items-center gap-4">
              <input
                type="text"
                value={inputCardNumber}
                onChange={(e) => setInputCardNumber(e.target.value)}
                className="px-4 py-2 rounded text-black flex-grow"
                placeholder="Enter card number"
              />
              <button
                onClick={handleCheckCard}
                className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700"
              >
                Search
              </button>
              <button
                onClick={handleCancel}
                className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700"
              >
                Cancel
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 text-red-500 font-semibold">{error}</div>
          )}

          {showCartela && (
            <div className="mb-10 max-w-md p-4 border border-green-500 rounded shadow-lg bg-white text-black">
              <h3 className="font-bold text-2xl mb-3">
                Card #{showCartela.cardNumber}{" "}
                {checkWinning(showCartela.grid, marked).length > 0 && (
                  <span className="text-green-600 font-semibold">(Winner)</span>
                )}
              </h3>
              <div className="grid grid-cols-5 gap-1">
                {showCartela.grid.map((row: number[], rIndex: number) =>
                  row.map((num, cIndex) => {
                    const markedCell = marked.includes(num) || num === 0;
                    return (
                      <div
                        key={`${rIndex}-${cIndex}`}
                        className={`h-12 flex items-center justify-center border border-gray-400 font-bold
                          ${
                            markedCell
                              ? "bg-yellow-300 text-black"
                              : "bg-white text-black"
                          }
                        `}
                      >
                        {num === 0 ? "FREE" : num}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Show Cards */}
        <div className="max-w-6xl mx-auto mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 px-4">
          {cards.map((card, index) => {
            const cardWinners = winners
              .filter((w) => w.cardIndex === index)
              .map((w) => w.type);
            const hasWin = cardWinners.length > 0;
            return (
              <div
                key={index}
                className={`relative rounded-xl border border-gray-300 bg-gray-50 text-black p-4 shadow-md ${
                  hasWin ? "winner-card" : ""
                }`}
              >
                {/* Winner message at top */}
                {hasWin && (
                  <div className="winner-message">
                    🎉 Winner: {cardWinners.join(", ")} 🎉
                  </div>
                )}

                <h3 className="text-xl font-bold mb-4 text-center">
                  Cartela #{index + 1}
                </h3>

                <div className="grid grid-cols-5 gap-1">
                  {card.map((row, rIdx) =>
                    row.map((num, cIdx) => {
                      const isMarkedCell = marked.includes(num) || num === 0;
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          onClick={() => toggleMarkNumber(num)}
                          className={`h-14 flex items-center justify-center cursor-pointer font-bold select-none rounded
                            ${
                              isMarkedCell
                                ? "bg-yellow-400 text-black shadow-lg"
                                : "bg-white text-black"
                            }
                            border border-gray-300`}
                        >
                          {num === 0 ? "FREE" : num}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
