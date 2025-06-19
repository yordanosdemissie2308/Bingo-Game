"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "./Firbase";

const gameTypes = ["Person", "Heart", "H", "T", "P"];

interface Cartela {
  id?: string;
  numbers?: number[] | string;
  [key: string]: any;
}

export default function SelectCards() {
  const router = useRouter();

  const [language, setLanguage] = useState<"English" | "Amharic">("English");
  const [speed, setSpeed] = useState("4000");
  const [gameTypeIndex, setGameTypeIndex] = useState(0);
  const [bonusType, setBonusType] = useState("None");
  const [betAmount, setBetAmount] = useState(10);
  const [cartelas, setCartelas] = useState<Cartela[]>([]);
  const [selectedCartelaIndices, setSelectedCartelaIndices] = useState<
    number[]
  >([]);
  const [searchNumber, setSearchNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const maxSelectable = Math.floor(betAmount / 10);
  const isAmharic = language === "Amharic";

  useEffect(() => {
    async function fetchCartelas() {
      setLoading(true);
      setError(null);
      try {
        const snap = await getDocs(collection(db, "cartelas"));
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Cartela
        );
        setCartelas(list);

        const saved = localStorage.getItem("selectedCartelasIndices");
        if (saved) {
          const idx = JSON.parse(saved) as number[];
          const valid = idx
            .filter((i) => i >= 0 && i < list.length)
            .slice(0, maxSelectable);
          setSelectedCartelaIndices(valid);
        }
      } catch (e) {
        console.error(e);
        setError(
          isAmharic ? "የካርቴላዎችን መጫኛ አልተሳካም።" : "Failed to load cartelas."
        );
      } finally {
        setLoading(false);
      }
    }
    fetchCartelas();
  }, [maxSelectable, isAmharic]);

  useEffect(() => {
    localStorage.setItem(
      "selectedCartelasIndices",
      JSON.stringify(selectedCartelaIndices)
    );
  }, [selectedCartelaIndices]);

  useEffect(() => {
    setSelectedCartelaIndices((prev) => prev.slice(0, maxSelectable));
  }, [maxSelectable]);

  const toggleCartelaSelection = (i: number) => {
    setSelectedCartelaIndices((prev) => {
      if (prev.includes(i)) return prev.filter((x) => x !== i);
      if (prev.length < maxSelectable) return [...prev, i];
      return prev;
    });
  };

  const handlePlayClick = () => {
    if (!selectedCartelaIndices.length) {
      alert(
        isAmharic
          ? "እባክዎን አንድ ካርቴላ ይምረጡ።"
          : "Please select at least one cartela."
      );
      return;
    }
    const ids = selectedCartelaIndices
      .map((i) => cartelas[i]?.id)
      .filter(Boolean);
    const q = new URLSearchParams({
      selected: ids.join(","),
      bet: String(betAmount),
      bonus: bonusType,
    }).toString();
    router.push(`/play-bingo?${q}`);
  };

  const isNumberInCartela = (
    numbers: number[] | string | undefined,
    target: number
  ) => {
    if (!numbers || typeof numbers === "string") return false;
    return numbers.includes(target);
  };

  return (
    <div className="min-h-screen bg-red-900 text-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-5xl font-extrabold mb-10 drop-shadow-lg">
        {isAmharic ? "ካርቴላ ምረጥ" : "Select Your Cartelas"}
      </h1>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-6 mb-12">
        {[
          {
            label: isAmharic ? "ቋንቋ" : "Language",
            value: language,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
              setLanguage(e.target.value as any),
            options: ["English", "Amharic"],
          },
          {
            label: isAmharic ? "ፍጥነት" : "Speed",
            value: speed,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
              setSpeed(e.target.value),
            options: ["4000", "3000", "2000", "1000"],
          },
          {
            label: isAmharic ? "የጨዋታ አይነት" : "Game Type",
            value: String(gameTypeIndex),
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
              setGameTypeIndex(Number(e.target.value)),
            options: gameTypes,
          },
          {
            label: isAmharic ? "ቦኑስ" : "Bonus Type",
            value: bonusType,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
              setBonusType(e.target.value),
            options: ["None", "Bonus1", "Bonus2"],
          },
          {
            label: isAmharic ? "የትርፍ መጠን" : "Bet Amount",
            value: String(betAmount),
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
              setBetAmount(Number(e.target.value)),
            options: ["10", "20", "30", "40", "50"],
          },
        ].map(({ label, value, onChange, options }) => (
          <label
            key={label}
            className="flex flex-col w-40 bg-white/10 p-3 rounded-lg"
          >
            <span className="mb-1 font-semibold">{label}</span>
            <select
              value={value}
              onChange={onChange}
              className="bg-transparent"
            >
              {options.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {/* Search Input and Selected Count */}
      <div className="flex items-center gap-6 mb-6">
        <input
          type="number"
          placeholder={isAmharic ? "ቁጥር ይፈልጉ..." : "Search number..."}
          value={searchNumber}
          onChange={(e) => setSearchNumber(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white"
        />
        <span className="text-lg font-semibold">
          {isAmharic
            ? `ተመርጠው ያሉ ካርቴላዎች፡ ${selectedCartelaIndices.length} / ${maxSelectable}`
            : `Selected: ${selectedCartelaIndices.length} / ${maxSelectable}`}
        </span>
      </div>

      {/* Clear Button */}
      <button
        onClick={() => setSelectedCartelaIndices([])}
        className="mb-8 px-6 py-3 bg-blue-600 rounded-full"
      >
        {isAmharic ? "ምርጫዎችን አጥፋ" : "Clear Selections"}
      </button>

      {/* Cartelas */}
      {loading ? (
        <p className="animate-pulse">{isAmharic ? "መጫን..." : "Loading..."}</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {cartelas.map((c, idx) => {
            const sel = selectedCartelaIndices.includes(idx);
            const disabled =
              !sel && selectedCartelaIndices.length >= maxSelectable;
            const match =
              searchNumber &&
              isNumberInCartela(c.numbers, Number(searchNumber));
            return (
              <button
                key={c.id ?? idx}
                disabled={disabled}
                onClick={() => toggleCartelaSelection(idx)}
                className={`p-5 rounded-xl transition duration-200 ${
                  sel
                    ? "bg-blue-700 text-white"
                    : match
                      ? "bg-green-600 text-white"
                      : "bg-white/10"
                }`}
              >
                <div className="font-semibold mb-2">
                  {isAmharic ? `ካርቴላ ${idx + 1}` : `Card ${idx + 1}`}
                </div>
                <div className="text-sm">
                  {Array.isArray(c.numbers) ? c.numbers.join(", ") : c.numbers}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Play Button */}
      <button
        onClick={handlePlayClick}
        disabled={!selectedCartelaIndices.length}
        className="mt-12 px-10 py-4 bg-blue-600 rounded-full text-2xl"
      >
        {isAmharic ? "ጀምር" : "Play Bingo Page"}
      </button>
    </div>
  );
}
