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
import { Eye, EyeOff } from "lucide-react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import Sidebar from "./Sidebar";

const gameTypes = ["Person", "Heart", "H", "T", "P"];

const percentageOptions = [
  20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
];

interface Cartela {
  id?: string;
  number?: number;
  numbers?: number[] | string;
  [key: string]: any;
}

export default function SelectCards() {
  const router = useRouter();
  const [removeCardNumber, setRemoveCardNumber] = useState("");

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<{ points?: number }>({});
  const [language, setLanguage] = useState<"English" | "Amharic">("English");

  const [speed, setSpeed] = useState(4000);
  const [gameType, setGameType] = useState(gameTypes[0]);
  const [bonusTypeIndex, setBonusTypeIndex] = useState(0);
  const [bonusAmount, setBonusAmount] = useState(0);

  const [betAmount, setBetAmount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("betAmount");
      const n = saved ? Number(saved) : 10;
      if (Number.isFinite(n)) {
        return Math.min(1000, Math.max(5, Math.round(n / 5) * 5));
      }
    }
    return 5;
  });
  useEffect(() => {
    localStorage.setItem("betAmount", String(betAmount));
  }, [betAmount]);

  const [showBet, setShowBet] = useState(true);

  const [cartelas, setCartelas] = useState<Cartela[]>([]);
  const [selectedCartelaNumbers, setSelectedCartelaNumbers] = useState<
    number[]
  >([]);
  const [remindSelection, setRemindSelection] = useState(false);

  const [searchNumber, setSearchNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPercent, setSelectedPercent] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedPercent");
      const n = saved ? Number(saved) : 100;
      return percentageOptions.includes(n as any) ? n : 100;
    }
    return 100;
  });
  const [showPercent, setShowPercent] = useState(true);
  const [show, setShow] = useState(true);

  const [showEnterCardModal, setShowEnterCardModal] = useState(false);
  const [enteredCardNumber, setEnteredCardNumber] = useState("");
  const [removecard, setRemoveCard] = useState("false");
  const [enterCardError, setEnterCardError] = useState("");

  const isAmharic = language === "Amharic";
  const points = userData.points ?? 0;

  // ✅ Auth Listener
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

  // ✅ Fetch Cartelas
  useEffect(() => {
    async function fetchCartelas() {
      try {
        const snap = await getDocs(collection(db, "cartelas"));
        const list = snap.docs.map((doc, idx) => {
          const data = doc.data() as Cartela;
          return { id: doc.id, number: data.number ?? idx + 1, ...data };
        });
        setCartelas(list);

        const saved = localStorage.getItem("selectedCartelaNumbers");
        if (saved) {
          const savedNumbers = JSON.parse(saved) as number[];
          const validNumbers = savedNumbers.filter((num) =>
            list.some((c) => c.number === num)
          );
          setSelectedCartelaNumbers(validNumbers);
        }
      } catch {
        setError(isAmharic ? "የካርቴላ መጫኛ አልተሳካም።" : "Failed to load cartelas.");
      }
    }
    fetchCartelas();
  }, [isAmharic]);

  useEffect(() => {
    localStorage.setItem(
      "selectedCartelaNumbers",
      JSON.stringify(selectedCartelaNumbers)
    );
  }, [selectedCartelaNumbers]);

  const toggleCartelaSelection = (index: number) => {
    const cardNumber = cartelas[index]?.number;
    if (!cardNumber) return;
    setSelectedCartelaNumbers((prev) =>
      prev.includes(cardNumber)
        ? prev.filter((n) => n !== cardNumber)
        : [...prev, cardNumber]
    );
  };

  const isNumberInCartela = (
    numbers: number[] | string | undefined,
    target: number
  ) => {
    if (!numbers || typeof numbers === "string") return false;
    return numbers.includes(target);
  };

  // ✅ Handle Play Click with Jackpot Calculation
  const handlePlayClick = async () => {
    if (!selectedCartelaNumbers.length) {
      alert(
        isAmharic
          ? "እባክዎን አንድ ካርቴላ ይምረጡ።"
          : "Please select at least one cartela."
      );
      return;
    }
    if (points < 1) {
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
          await updateDoc(ref, { points: points - 1 });
          setUserData({ points: points - 1 });
        } else {
          alert("User document is invalid.");
          return;
        }
      } else {
        alert("User document not found.");
        return;
      }

      const selectedCartelasData = selectedCartelaNumbers
        .map((num) => cartelas.find((c) => c.number === num))
        .filter(Boolean);
      localStorage.setItem(
        "selectedCartelasData",
        JSON.stringify(selectedCartelasData)
      );

      // ✅ Calculate Jackpot
      const jackpotAmount =
        (betAmount * selectedCartelaNumbers.length * (100 - selectedPercent)) /
        100;

      await addDoc(collection(db, "gameSessions"), {
        userEmail: user.email,
        selectedCartelas: selectedCartelaNumbers,
        betAmount,
        bonusAmount,
        gameType,
        speed,
        createdAt: new Date(),
        percentage: selectedPercent,
        jackpotAmount, // ✅ Store in Firestore
      });

      router.push(`/web/play-bingo`);
    } catch (err) {
      console.error("Error storing game session:", err);
      alert("Failed to update points or store session");
    }
  };

  useEffect(() => {
    localStorage.setItem("selectedPercent", String(selectedPercent));
  }, [selectedPercent]);

  const handlePercentChange = (value: number) => {
    setSelectedPercent(value);
  };

  const incrementBet = () => setBetAmount((v) => Math.min(1000, v + 5));
  const decrementBet = () => setBetAmount((v) => Math.max(5, v - 5));

  const winAmount =
    (betAmount * selectedCartelaNumbers.length * selectedPercent) / 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        {isAmharic ? "መጫን እየተካሄደ ነው..." : "Loading..."}
      </div>
    );
  }

  // ✅ The rest of your JSX layout remains unchanged
  return (
    <>
      <div className="flex justify-between items-center gap-3">
        <Sidebar />
        <div>
          {selectedCartelaNumbers.length > 0 && (
            <div className="mt-10 text-center">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                🎯 Selected Cartelas
              </h2>
              <div className="flex flex-wrap justify-center gap-4 px-6">
                {selectedCartelaNumbers
                  .slice(selectedCartelaNumbers.length > 5 ? 5 : 0)
                  .map((cardNum) => (
                    <div
                      key={cardNum}
                      className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg transform transition-transform hover:scale-110"
                    >
                      {cardNum}
                    </div>
                  ))}
              </div>
              {selectedCartelaNumbers.length > 5 && (
                <p className="mt-4 text-sm text-gray-500 italic">
                  (Showing latest {selectedCartelaNumbers.length - 5} cards)
                </p>
              )}
            </div>
          )}

          <div className="min-h-screen p-6 flex flex-col items-start ">
            <h1 className="text-5xl font-extrabold mb-10">
              {isAmharic ? "ካርቴላ ምረጥ" : "Select Your Cartelas"}
            </h1>

            <p className="text-xl font-bold mb-6">
              {isAmharic ? "ነጥብዎ፡" : "Your Points:"} {points}
            </p>

            <div className="mb-4 flex items-center gap-2">
              <input
                id="remindToggle"
                type="checkbox"
                checked={remindSelection}
                onChange={() => setRemindSelection(!remindSelection)}
                className="cursor-pointer"
              />
              <label
                htmlFor="remindToggle"
                className="select-none cursor-pointer"
              >
                {isAmharic ? "ምልክት አሳይ" : "Remind Me Selection"}
              </label>
            </div>

            {/* Bet, Win, Percentage in same row */}
            <div className="flex justify-between items-start w-full mb-6">
              <div className="flex items-center gap-10">
                {/* Bet Amount (now with Eye/EyeOff) */}
                <div className="flex gap-2 items-center min-w-[220px]">
                  <span className="text-black font-bold text-lg select-none">
                    {isAmharic ? "የትርፍ መጠን" : "Bet Amount"}
                  </span>
                  <div className="flex items-center">
                    {/* Decrement Bet */}
                    <button
                      onClick={decrementBet}
                      disabled={betAmount <= 5}
                      className="w-10 h-10 border-black rounded-md shadow-md text-red-700 text-2xl"
                    >
                      -
                    </button>

                    {/* Bet Amount Display */}
                    <div className="p-[2px] rounded-2xl">
                      <div className="relative bg-blue-200 px-6 py-2 text-black font-bold rounded-sm min-w-[120px] text-center overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-white opacity-10 rounded-t-sm pointer-events-none" />
                        {showBet ? `${betAmount} birr` : "****"}
                        <button
                          onClick={() => setShowBet((s) => !s)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/40"
                          aria-label="Toggle bet visibility"
                        >
                          {showBet ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Increment Bet */}
                    <button
                      onClick={incrementBet}
                      disabled={betAmount >= 1000}
                      className="w-10 h-10 border-black rounded-md shadow-md text-green-700 text-2xl"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Win Amount with Eye */}
                <div className="flex items-center gap-3">
                  <span className="text-black font-bold text-lg select-none">
                    {isAmharic ? "የእድል መጠን" : "Win Amount"}
                  </span>
                  <div
                    onClick={() => setShow(!show)}
                    className="cursor-pointer px-4 py-2 bg-blue-100 text-blue-700 rounded-md shadow-sm hover:bg-blue-200 flex items-center gap-2 font-semibold"
                  >
                    {show ? `${winAmount.toFixed(2)} birr` : "****"}
                    {show ? <Eye size={18} /> : <EyeOff size={18} />}
                  </div>
                </div>

                {/* Percentage Selector with Eye/EyeOff Toggle */}
                <div className="flex gap-1 items-center">
                  <span className="text-black font-bold text-lg select-none">
                    {isAmharic ? "መቶኛ" : "Percentage"}
                  </span>
                  <div className="relative w-40">
                    <select
                      value={selectedPercent}
                      onChange={(e) =>
                        handlePercentChange(Number(e.target.value))
                      }
                      className="w-full px-4 py-2 pr-12 rounded-lg border border-gray-300 text-black bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {percentageOptions.map((percent) => (
                        <option key={percent} value={percent}>
                          {showPercent ? `${percent}%` : "****"}
                        </option>
                      ))}
                    </select>
                    <div
                      onClick={() => setShowPercent(!showPercent)}
                      className="absolute inset-y-0 right-3 flex items-center text-blue-700 cursor-pointer"
                    >
                      {showPercent ? <Eye size={18} /> : <EyeOff size={18} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-6">
                <button
                  onClick={() => {
                    setEnteredCardNumber("");
                    setEnterCardError("");
                    setRemoveCard("false");
                    setShowEnterCardModal(true);
                  }}
                  className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-extrabold px-6 py-3 rounded-md shadow-lg text-lg transition hover:scale-105 active:scale-95"
                >
                  {isAmharic ? "ካርድ አስገባ" : "Enter Card"}
                </button>
                <button
                  onClick={handlePlayClick}
                  disabled={!selectedCartelaNumbers.length}
                  className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-extrabold px-10 py-4 rounded-md shadow-lg text-xl 
                  transition hover:scale-105 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isAmharic ? "ጀምር" : "Play"}
                </button>
              </div>
            </div>

            {error ? (
              <p className="text-red-400">{error}</p>
            ) : (
              <div className="flex">
                <div className="grid grid-cols-30 gap-6 justify-start">
                  {cartelas.map((c, idx) => {
                    const sel = selectedCartelaNumbers.includes(c.number ?? -1);
                    const match =
                      searchNumber &&
                      isNumberInCartela(c.numbers, Number(searchNumber));
                    return (
                      <button
                        key={c.id ?? idx}
                        onClick={() => toggleCartelaSelection(idx)}
                        className={`w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center border-2 shadow-md ${
                          sel
                            ? "bg-blue-600 text-white border-white"
                            : match
                              ? "bg-orange-600 text-white border-white"
                              : "bg-gray-300 text-black border-gray-500"
                        }`}
                      >
                        {c.number ?? idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {showEnterCardModal && (
              <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm pointer-events-auto" />
                <div className="relative bg-white rounded-lg shadow-lg p-6 w-96 pointer-events-auto z-10">
                  <h2 className="text-lg font-bold mb-4">
                    {isAmharic ? "ካርድ አስገባ / አስወግድ" : "Add / Remove Card"}
                  </h2>

                  <input
                    type="number"
                    value={enteredCardNumber}
                    onChange={(e) => setEnteredCardNumber(e.target.value)}
                    placeholder={
                      isAmharic ? "የካርድ ቁጥር ያስገቡ" : "Enter card number to add"
                    }
                    className="border p-2 w-full mb-3 rounded"
                  />

                  <input
                    type="number"
                    value={removeCardNumber}
                    onChange={(e) => setRemoveCardNumber(e.target.value)}
                    placeholder={
                      isAmharic
                        ? "ለማስወገድ የካርድ ቁጥር ያስገቡ"
                        : "Enter card number to remove"
                    }
                    className="border p-2 w-full mb-4 rounded"
                  />

                  {enterCardError && (
                    <p className="text-red-500 mb-3">{enterCardError}</p>
                  )}

                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => {
                        setShowEnterCardModal(false);
                        setEnteredCardNumber("");
                        setRemoveCardNumber("");
                        setEnterCardError("");
                      }}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                    >
                      {isAmharic ? "ይቅር" : "Cancel"}
                    </button>

                    <button
                      onClick={() => {
                        const cardNumber = parseInt(enteredCardNumber);
                        if (isNaN(cardNumber)) {
                          setEnterCardError(
                            isAmharic ? "የተሳሳተ ቁጥር ነው።" : "Invalid card number."
                          );
                          return;
                        }
                        const cardIndex = cartelas.findIndex(
                          (c) => c.number === cardNumber
                        );
                        if (cardIndex === -1) {
                          setEnterCardError(
                            isAmharic ? "ካርድ አልተገኘም።" : "Card not found."
                          );
                          return;
                        }
                        setSelectedCartelaNumbers((prev) =>
                          prev.includes(cardNumber)
                            ? prev
                            : [...prev, cardNumber]
                        );
                        setEnteredCardNumber("");
                        setEnterCardError("");
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                      {isAmharic ? "አስገባ" : "Add"}
                    </button>

                    <button
                      onClick={() => {
                        const cardNumber = parseInt(removeCardNumber);
                        if (isNaN(cardNumber)) {
                          setEnterCardError(
                            isAmharic ? "የተሳሳተ ቁጥር ነው።" : "Invalid card number."
                          );
                          return;
                        }
                        if (!selectedCartelaNumbers.includes(cardNumber)) {
                          setEnterCardError(
                            isAmharic ? "ካርድ አልተመረጠም።" : "Card is not selected."
                          );
                          return;
                        }
                        setSelectedCartelaNumbers((prev) =>
                          prev.filter((n) => n !== cardNumber)
                        );
                        setRemoveCardNumber("");
                        setEnterCardError("");
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                      {isAmharic ? "አስወግድ" : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center items-center shadow-2xl rounded-3xl gap-4 p-6 self-end">
            selected cards number:
            <p>{selectedCartelaNumbers.length}</p>
          </div>
        </div>
      </div>
    </>
  );
}
