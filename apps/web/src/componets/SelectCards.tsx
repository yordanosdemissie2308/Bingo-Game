"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  getDocs,
  collection,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "./Firbase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const gameTypes = ["Person", "Heart", "H", "T", "P"];

interface Cartela {
  id?: string;
  numbers?: number[] | string;
  [key: string]: any;
}

export default function SelectCards() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<{ points?: number }>({});
  const [language, setLanguage] = useState<"English" | "Amharic">("English");
  const [speed, setSpeed] = useState("4000");
  const [gameType, setGameType] = useState(gameTypes[0]);
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
  const points = userData.points ?? 0;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.email) {
        setUser(firebaseUser);
        try {
          const usersRef = collection(db, "users");
          const userQuery = query(
            usersRef,
            where("email", "==", firebaseUser.email)
          );
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty && userSnapshot.docs[0]) {
            const data = userSnapshot.docs[0].data();
            setUserData({ points: data?.points ?? 0 });
          } else {
            setUserData({ points: 0 });
          }
        } catch {
          setUserData({ points: 0 });
        }
      } else {
        setUser(null);
        setUserData({ points: 0 });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchCartelas() {
      try {
        const snap = await getDocs(collection(db, "cartelas"));
        const list = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Cartela
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
      } catch {
        setError(isAmharic ? "የካርቴላ መጫኛ አልተሳካም።" : "Failed to load cartelas.");
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
    setSelectedCartelaIndices((prev) =>
      prev.includes(i)
        ? prev.filter((x) => x !== i)
        : prev.length < maxSelectable
          ? [...prev, i]
          : prev
    );
  };

  const isNumberInCartela = (
    numbers: number[] | string | undefined,
    target: number
  ) => {
    if (!numbers || typeof numbers === "string") return false;
    return numbers.includes(target);
  };

  const handlePlayClick = async () => {
    if (!selectedCartelaIndices.length) {
      alert(
        isAmharic
          ? "እባክዎን አንድ ካርቴላ ይምረጡ።"
          : "Please select at least one cartela."
      );
      return;
    }

    if (points < 50) {
      alert(isAmharic ? "በቂ ነጥብ የለዎትም።" : "Not enough points (need 50).");
      return;
    }

    if (!user?.email) {
      alert("User not logged in.");
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("email", "==", user.email));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        if (userDoc?.id) {
          const ref = doc(db, "users", userDoc.id);
          await updateDoc(ref, { points: points - 50 });
          setUserData({ points: points - 50 });
        } else {
          alert("User document is invalid.");
          return;
        }
      } else {
        alert("User document not found.");
        return;
      }

      const selectedCartelaIds = selectedCartelaIndices
        .map((i) => cartelas[i]?.id)
        .filter((id): id is string => !!id);

      await addDoc(collection(db, "gameSessions"), {
        userEmail: user.email,
        selectedCartelas: selectedCartelaIds,
        betAmount,
        gameType,
        bonusType,
        createdAt: new Date(),
      });

      const params = new URLSearchParams();
      params.set("selected", selectedCartelaIds.join(","));
      params.set("bet", String(betAmount));
      params.set("bonus", bonusType);
      params.set("gameType", gameType ?? "Person");

      router.push(`/web/play-bingo?${params.toString()}`);
    } catch (err) {
      console.error("Error storing game session:", err);
      alert("Failed to update points or store session");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        {isAmharic ? "መጫን እየተካሄደ ነው..." : "Loading..."}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 flex flex-col items-center ">
      <h1 className="text-5xl font-extrabold mb-10">
        {isAmharic ? "ካርቴላ ምረጥ" : "Select Your Cartelas"}
      </h1>

      <p className="text-xl font-bold mb-6">
        {isAmharic ? "ነጥብዎ፡" : "Your Points:"} {points}
      </p>

      <div className="flex flex-wrap justify-center gap-6 mb-12">
        {[
          {
            label: isAmharic ? "የጨዋታ አይነት" : "Game Type",
            value: gameType,
            options: gameTypes,
            onChange: (e: any) => setGameType(e.target.value),
          },
          {
            label: isAmharic ? "ቦኑስ" : "Bonus Type",
            value: bonusType,
            options: ["None", "Bonus1", "Bonus2"],
            onChange: (e: any) => setBonusType(e.target.value),
          },
          {
            label: isAmharic ? "የትርፍ መጠን" : "Bet Amount",
            value: String(betAmount),
            options: ["10", "20", "30", "40", "50"],
            onChange: (e: any) => setBetAmount(Number(e.target.value)),
          },
        ].map(({ label, value, options, onChange }) => (
          <label
            key={label}
            className="flex flex-col w-40 bg-white/10 p-3 rounded-lg"
          >
            <span className="mb-1 font-semibold">{label}</span>
            <select
              value={value}
              onChange={onChange}
              className="bg-transparent text-black"
            >
              {options.map((opt: any, idx: number) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

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

      <button
        onClick={() => setSelectedCartelaIndices([])}
        className="mb-8 px-6 py-3 bg-blue-600 rounded-full hover:bg-blue-700 transition"
      >
        {isAmharic ? "ምርጫዎችን አጥፋ" : "Clear Selections"}
      </button>

      {error ? (
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
                      : "bg-white/10 text-white"
                }`}
              >
                <div className="font-semibold mb-2">
                  {isAmharic ? `ካርቴላ ${idx + 1}` : ` ${idx + 1}`}
                </div>
                <div className="text-sm">
                  {Array.isArray(c.numbers) ? c.numbers.join(", ") : c.numbers}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={handlePlayClick}
        disabled={!selectedCartelaIndices.length}
        className="mt-12 px-10 py-4 bg-blue-600 rounded-full text-2xl hover:bg-blue-700 transition"
      >
        {isAmharic ? "ጀምር" : "Play Bingo Page"}
      </button>
    </div>
  );
}
