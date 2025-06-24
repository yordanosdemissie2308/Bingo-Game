"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./Firbase";
import { FaArrowsAltH, FaHome } from "react-icons/fa";

export default function PlayBingo() {
  const params = useSearchParams();
  const selectedParam = params?.get("selected") ?? "";
  const bet = params?.get("bet") ?? "0";
  const selectedCount = selectedParam.split(",").filter(Boolean).length;

  const [marked, setMarked] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [lang, setLang] = useState<"en" | "am">("am");
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const [cards, setCards] = useState<number[][][]>([]);
  const [showCards, setShowCards] = useState(false);
  const [speed, setSpeed] = useState("2000");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBingoGrid, setShowBingoGrid] = useState(true);
  const [selectedCartelaIndex, setSelectedCartelaIndex] = useState<
    number | null
  >(null);
  const [pendingCartelaIndex, setPendingCartelaIndex] = useState<number | null>(
    null
  );
  const [showCartelaConfirm, setShowCartelaConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [expandBingoOnly, setExpandBingoOnly] = useState(false);
  const [checkCartelaNumber, setCheckCartelaNumber] = useState("");
  const [checkCartelaResult, setCheckCartelaResult] = useState<
    "valid" | "invalid" | null
  >(null);
  const [selectedCartelaIndices, setSelectedCartelaIndices] = useState<
    number[]
  >([]);

  const [showMyCartelaPopup, setShowMyCartelaPopup] = useState(false);
  const [myCartelaInput, setMyCartelaInput] = useState("");
  const [myCartelaResult, setMyCartelaResult] = useState<
    "valid" | "invalid" | null
  >(null);
  const [myCheckedCard, setMyCheckedCard] = useState<number[][] | null>(null);

  const [showCheckPopup, setShowCheckPopup] = useState(false);
  const [checkedCard, setCheckedCard] = useState<number[][] | null>(null);
  function handleCheckCartela() {
    const num = parseInt(checkCartelaNumber);
    if (isNaN(num) || num < 1 || num > cards.length || !cards[num - 1]) {
      setCheckCartelaResult("invalid");
      setCheckedCard(null);
    } else {
      setCheckCartelaResult("valid");
    }
  }

  const timerRef = useRef<NodeJS.Timeout | null>(null);
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
    setSelectedCartelaIndex(null);
    setExpandBingoOnly(false);
  }

  function handlePlayClick() {
    if (!playing) new Audio("/audio/ጨዋታው ተጀምሯ�ል.m4a").play().catch();
    setPlaying((p) => !p);
  }
  function handleMyCartelaCheck() {
    const num = parseInt(myCartelaInput);
    const card = cards[num - 1];

    if (isNaN(num) || num < 1 || num > cards.length || !card) {
      setMyCartelaResult("invalid");
      setMyCheckedCard(null);
    } else {
      setMyCartelaResult("valid");
      setMyCheckedCard(card);
    }
  }

  function onCartelaInputChange(input: string) {
    const num = Number(input.replace(/[^0-9]/g, ""));
    if (isNaN(num)) {
      setPendingCartelaIndex(null);
      setShowCartelaConfirm(false);
      return;
    }
    setPendingCartelaIndex(num - 1);
    setShowCartelaConfirm(true);
  }

  function confirmViewCartela() {
    setSelectedCartelaIndex(pendingCartelaIndex);
    setShowCartelaConfirm(false);
    setShowCards(true);
  }

  function cancelViewCartela() {
    setPendingCartelaIndex(null);
    setShowCartelaConfirm(false);
  }

  return (
    <div className="relative p-6 min-h-screen  text-white">
      {/* Fixed Nav Buttons */}
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
          onClick={() => setShowCancelConfirm(true)}
          className="fixed top-6 right-6 z-50 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-full shadow-lg"
        >
          ❌ Cancel
        </button>
      </div>

      {/* Top Layout: Circle + Grid */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-8 pt-20 max-w-6xl mx-auto">
        {/* Big Circle */}
        <div className="w-48 h-72 flex-shrink-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-52 h-52 rounded-full border-8 border-red-700 bg-white flex items-center justify-center shadow-2xl">
              <span className="text-5xl font-black text-red-600">
                {lastLabel ?? "0/75"}
              </span>
            </div>
          </div>
        </div>

        {/* Bingo Number Grid */}
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

            {/* Big Circle with lastLabel */}
            {expandBingoOnly && (
              <div className="mt-16">
                <div className="w-52 h-52 rounded-full border-8 border-red-700 bg-white flex items-center justify-center shadow-2xl">
                  <span className="text-5xl font-black text-red-600">
                    {lastLabel ?? "0/75"}
                  </span>
                </div>
              </div>
            )}

            {/* Bingo Grid */}
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
                  ${isM ? "bg-yellow-400" : "bg-white"} text-black border border-gray-400 shadow-[2px_2px_4px_#00000050]`}
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
        {/* Show Grid button (when hidden) */}
        {!showBingoGrid && (
          <button
            onClick={() => setShowBingoGrid(true)}
            className="mt-10 px-8 py-3 bg-green-500 rounded-full shadow-lg hover:bg-green-600 font-semibold"
          >
            Show Grid
          </button>
        )}
      </div>

      {/* Bottom Controls: Play, Reset, etc. */}
      <div className="flex flex-wrap justify-center gap-6 mt-8 max-w-3xl mx-auto">
        <button
          onClick={handlePlayClick}
          className={`px-8 py-3 rounded-full font-bold shadow-lg transition ${playing ? "bg-red-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}`}
        >
          {playing ? "⏸ Stop" : "▶ Play"}
        </button>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-full shadow-lg font-bold"
        >
          Reset
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
        <button
          onClick={() => {
            setShowMyCartelaPopup(true);
            setMyCartelaInput("");
            setMyCartelaResult(null);
            setMyCheckedCard(null);
          }}
          className="fixed bottom-20 right-6 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-full shadow-lg z-50"
        >
          🧾 Check My Cartela
        </button>

        {showMyCartelaPopup && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white text-black p-6 rounded-lg shadow-xl max-w-2xl w-full">
              <h2 className="text-xl font-bold mb-4 text-center">
                🧾 My Cartela
              </h2>

              <input
                type="text"
                value={myCartelaInput}
                onChange={(e) => setMyCartelaInput(e.target.value)}
                placeholder="Enter cartela number (e.g. 1)"
                className="w-full p-3 border border-gray-300 rounded mb-4"
              />

              <div className="flex justify-end gap-4 mb-4">
                <button
                  onClick={() => {
                    setShowMyCartelaPopup(false);
                    setMyCartelaInput("");
                    setMyCheckedCard(null);
                    setMyCartelaResult(null);
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMyCartelaCheck}
                  className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded"
                >
                  Check
                </button>
              </div>

              {myCartelaResult === "invalid" && (
                <p className="text-red-600 font-semibold text-center">
                  ❌ Cartela not found.
                </p>
              )}

              {myCartelaResult === "valid" && myCheckedCard && (
                <div className="bg-gradient-to-tr from-yellow-300 to-yellow-400 rounded-xl shadow-xl ring-4 ring-yellow-500 p-4 mt-4">
                  <h3 className="text-center font-bold text-lg text-gray-900 mb-4">
                    Cartela {parseInt(myCartelaInput)}
                  </h3>
                  <div className="grid grid-cols-5 gap-1">
                    {myCheckedCard.flat().map((n, j) => (
                      <div
                        key={j}
                        className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center font-bold rounded border-2
        ${
          n === 0
            ? "bg-yellow-500 text-white border-black"
            : marked.includes(n)
              ? "bg-green-300 text-black border-black"
              : "bg-white text-black border-black"
        }`}
                        style={{
                          borderRight:
                            (j + 1) % 5 === 0 ? "none" : "2px solid black",
                          borderBottom: j >= 20 ? "none" : "2px solid black",
                        }}
                      >
                        {n === 0 ? "★" : n}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cartela View Status */}
      <div className="mt-4 mb-4 flex justify-center">
        {selectedCartelaIndex !== null &&
          (cards[selectedCartelaIndex] ? (
            <span className="text-yellow-400 font-semibold">
              Showing Cartela #{selectedCartelaIndex + 1}
            </span>
          ) : (
            <span className="text-red-500 font-semibold">
              No card found for that number.
            </span>
          ))}
      </div>

      {/* Display Selected Cartela */}
      {showCards &&
        selectedCartelaIndex !== null &&
        cards[selectedCartelaIndex] && (
          <div className="mt-8 p-6 bg-gradient-to-tr from-yellow-300 to-yellow-400 rounded-xl shadow-2xl ring-8 ring-yellow-500 mx-auto max-w-5xl">
            <h2 className="text-2xl font-extrabold mb-4 text-center text-gray-900">
              Card {selectedCartelaIndex + 1}
            </h2>
            <div className="grid grid-cols-5 gap-1">
              {cards[selectedCartelaIndex].flat().map((n, j) => (
                <div
                  key={j}
                  className={`w-16 h-16 flex items-center justify-center font-extrabold rounded border-2
                  ${
                    n === 0
                      ? "bg-yellow-500 text-white shadow-lg border-black"
                      : marked.includes(n)
                        ? "bg-green-300 text-gray-900 border-black"
                        : "bg-white text-black border-black"
                  }`}
                  style={{
                    borderRight: (j + 1) % 5 === 0 ? "none" : "2px solid black",
                    borderBottom: j >= 20 ? "none" : "2px solid black",
                  }}
                >
                  {n === 0 ? "★" : n}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Footer: Bet & Reward Display */}
      <div className="flex justify-center space-x-12 mt-12 text-lg font-semibold max-w-3xl mx-auto px-4">
        <div className="flex flex-col items-center">
          <span className="mb-1">መድብ:</span>
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-400 border-4 border-orange-500 rounded-lg px-6 py-3 shadow-xl text-black font-bold text-xl">
            {bet} ብር
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="mb-1">ደራሽ:</span>
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-400 border-4 border-orange-500 rounded-lg px-6 py-3 shadow-xl text-black font-bold text-xl">
            {(parseFloat(bet) * selectedCount * 0.8).toFixed(2)} ብር
          </div>
        </div>
      </div>

      {/* Shuffle / Play Buttons */}
      {/* <div className="flex justify-center gap-6 mt-6">
        <button
          onClick={handlePlayClick}
          className="px-10 py-3 rounded-md bg-gradient-to-b from-orange-400 to-orange-600 text-white text-xl font-extrabold shadow-lg hover:scale-105 transition"
        >
          PLAY
        </button>
      </div> */}

      {/* Modals (reset, cartela view, cancel) */}
      {/* ... include your modal markup as before ... */}
    </div>
  );
}
