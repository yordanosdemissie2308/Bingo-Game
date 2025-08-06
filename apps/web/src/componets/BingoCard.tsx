"use client";

import { useState, useEffect } from "react";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./Firbase";
import Sidebar from "./Sidebar";

export default function BingoCard() {
  const columns = ["B", "I", "N", "G", "O"] as const;
  type Column = (typeof columns)[number];

  const normalizeCartelaData = (
    data: Partial<Record<Column, string[]>>
  ): Record<Column, string[]> => {
    const defaultColumn = ["", "", "", "", ""];
    return {
      B: Array.isArray(data.B) && data.B.length === 5 ? data.B : defaultColumn,
      I: Array.isArray(data.I) && data.I.length === 5 ? data.I : defaultColumn,
      N:
        Array.isArray(data.N) && data.N.length === 5
          ? [...data.N.slice(0, 2), "FREE", ...data.N.slice(3)]
          : [...defaultColumn.slice(0, 2), "FREE", ...defaultColumn.slice(3)],
      G: Array.isArray(data.G) && data.G.length === 5 ? data.G : defaultColumn,
      O: Array.isArray(data.O) && data.O.length === 5 ? data.O : defaultColumn,
    };
  };

  const [gridValues, setGridValues] = useState<Record<Column, string[]>>({
    B: ["", "", "", "", ""],
    I: ["", "", "", "", ""],
    N: ["", "", "FREE", "", ""],
    G: ["", "", "", "", ""],
    O: ["", "", "", "", ""],
  });

  const [cartelas, setCartelas] = useState<
    Array<{ id: string; data: Record<Column, string[]> }>
  >([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCartela, setSelectedCartela] = useState<{
    id: string;
    data: Record<Column, string[]>;
  } | null>(null);

  const handleInputChange = (col: Column, rowIndex: number, value: string) => {
    if (col === "N" && rowIndex === 2) return;
    const newValue = value.replace(/\D/g, "");
    setGridValues((prev) => {
      const newGrid = { ...prev };
      newGrid[col][rowIndex] = newValue;
      return newGrid;
    });
  };

  const generateRandomNumbers = (min: number, max: number, count: number) => {
    const numbers = new Set<number>();
    while (numbers.size < count) {
      const rand = Math.floor(Math.random() * (max - min + 1)) + min;
      numbers.add(rand);
    }
    return Array.from(numbers).map(String);
  };

  const handleGenerateCard = () => {
    const newCard: Record<Column, string[]> = {
      B: generateRandomNumbers(1, 15, 5),
      I: generateRandomNumbers(16, 30, 5),
      N: generateRandomNumbers(31, 45, 5),
      G: generateRandomNumbers(46, 60, 5),
      O: generateRandomNumbers(61, 75, 5),
    };
    newCard.N[2] = "FREE";
    setGridValues(newCard);
  };

  const addCardToFirebase = async () => {
    try {
      const cleanedGrid: Record<Column, string[]> = {
        B: gridValues.B.map((val) => val.replace(/\D/g, "")),
        I: gridValues.I.map((val) => val.replace(/\D/g, "")),
        N: gridValues.N.map((val, idx) =>
          idx === 2 ? "FREE" : val.replace(/\D/g, "")
        ),
        G: gridValues.G.map((val) => val.replace(/\D/g, "")),
        O: gridValues.O.map((val) => val.replace(/\D/g, "")),
      };

      const docId = Date.now().toString();

      await setDoc(doc(db, "cartelas", docId), cleanedGrid);

      alert("Cartela saved successfully!");

      fetchCartelas();

      setGridValues({
        B: ["", "", "", "", ""],
        I: ["", "", "", "", ""],
        N: ["", "", "FREE", "", ""],
        G: ["", "", "", "", ""],
        O: ["", "", "", "", ""],
      });
    } catch (error) {
      console.error("Error saving cartela:", error);
      alert("Failed to save cartela.");
    }
  };

  const fetchCartelas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "cartelas"));
      const cartelaList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        data: normalizeCartelaData(
          doc.data() as Partial<Record<Column, string[]>>
        ),
      }));
      setCartelas(cartelaList);
    } catch (error) {
      console.error("Error fetching cartelas:", error);
    }
  };

  const deleteCartela = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cartela?")) return;
    try {
      await deleteDoc(doc(db, "cartelas", id));
      alert("Cartela deleted!");
      fetchCartelas();
      setModalOpen(false);
      setSelectedCartela(null);
    } catch (error) {
      console.error("Error deleting cartela:", error);
      alert("Failed to delete cartela.");
    }
  };

  const openModal = (cartela: {
    id: string;
    data: Record<Column, string[]>;
  }) => {
    const normalizedData = normalizeCartelaData(cartela.data);
    setSelectedCartela({ id: cartela.id, data: normalizedData });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCartela(null);
  };

  const editChangedCartela = async () => {
    if (!selectedCartela) return;
    try {
      const cleanedGrid: Record<Column, string[]> = {
        B: selectedCartela.data.B.map((val) => val.replace(/\D/g, "")),
        I: selectedCartela.data.I.map((val) => val.replace(/\D/g, "")),
        N: selectedCartela.data.N.map((val, idx) =>
          idx === 2 ? "FREE" : val.replace(/\D/g, "")
        ),
        G: selectedCartela.data.G.map((val) => val.replace(/\D/g, "")),
        O: selectedCartela.data.O.map((val) => val.replace(/\D/g, "")),
      };

      await setDoc(doc(db, "cartelas", selectedCartela.id), cleanedGrid);

      alert("Cartela edited successfully!");
      fetchCartelas();
      closeModal();
    } catch (error) {
      console.error("Error editing cartela:", error);
      alert("Failed to edit cartela.");
    }
  };

  const handleModalInputChange = (
    col: Column,
    rowIndex: number,
    value: string
  ) => {
    if (!selectedCartela) return;
    if (col === "N" && rowIndex === 2) return;
    const newValue = value.replace(/\D/g, "");
    setSelectedCartela((prev) => {
      if (!prev) return null;
      const newData = { ...prev.data };
      newData[col][rowIndex] = newValue;
      return { id: prev.id, data: newData };
    });
  };

  useEffect(() => {
    fetchCartelas();
  }, []);

  return (
    <div className="flex justify-between items-center gap-2">
      <Sidebar />

      <div className="max-w-4xl mx-auto mt-10 p-4 space-y-10">
        {/* Add Numbers Form */}
        <div className="shadow rounded-lg bg-white p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Add Numbers</h2>

          {/* Column Headers */}
          <div className="grid grid-cols-5 gap-2 text-center font-bold text-lg mb-2">
            {columns.map((col) => (
              <div
                key={col}
                className="bg-blue-500 text-white p-2 rounded select-none"
              >
                {col}
              </div>
            ))}
          </div>

          {/* Input Grid */}
          <div className="grid grid-cols-5 gap-2 text-center">
            {Array.from({ length: 5 }).map((_, rowIndex) =>
              columns.map((col) => {
                if (col === "N" && rowIndex === 2) {
                  return (
                    <div
                      key={`${col}-${rowIndex}`}
                      className="p-2 border rounded bg-black text-white font-bold select-none"
                    >
                      FREE
                    </div>
                  );
                }
                return (
                  <input
                    key={`${col}-${rowIndex}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    className="border rounded p-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={gridValues[col]?.[rowIndex] ?? ""}
                    onChange={(e) =>
                      handleInputChange(col, rowIndex, e.target.value)
                    }
                  />
                );
              })
            )}
          </div>

          <div className="mt-4 flex gap-4">
            <button
              onClick={handleGenerateCard}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Generate Random Card
            </button>
            <button
              onClick={addCardToFirebase}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Save Cartela
            </button>
          </div>
        </div>

        {/* Saved Cards Section */}
        <div className="shadow rounded-lg bg-white p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Saved Cards</h2>

          <div className="flex flex-wrap gap-3">
            {cartelas.length === 0 && (
              <div className="text-gray-600 italic">No saved cartelas yet.</div>
            )}
            {cartelas.map(({ id }, index) => (
              <button
                key={id}
                onClick={() => cartelas[index] && openModal(cartelas[index])}
                className="bg-blue-200 hover:bg-blue-300 rounded px-4 py-2 text-lg font-semibold transition"
                title={`Cartela #${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Modal for Viewing/Editing Cartela */}
        {modalOpen && selectedCartela && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6 relative max-h-[90vh] overflow-auto">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Edit Cartela #
                {cartelas.findIndex((c) => c.id === selectedCartela.id) + 1}
              </h3>

              {/* Editable Grid in Modal */}
              <div className="grid grid-cols-5 gap-2 text-center mb-4">
                {columns.map((col) => (
                  <div
                    key={`header-${col}`}
                    className="font-bold text-lg bg-blue-500 text-white rounded select-none p-2"
                  >
                    {col}
                  </div>
                ))}

                {Array.from({ length: 5 }).map((_, rowIndex) =>
                  columns.map((col) => {
                    if (col === "N" && rowIndex === 2) {
                      return (
                        <div
                          key={`free-modal-${col}-${rowIndex}`}
                          className="p-2 border rounded bg-black text-white font-bold select-none"
                        >
                          FREE
                        </div>
                      );
                    }
                    return (
                      <input
                        key={`input-modal-${col}-${rowIndex}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        className="border rounded p-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedCartela.data[col]?.[rowIndex] ?? ""}
                        onChange={(e) =>
                          handleModalInputChange(col, rowIndex, e.target.value)
                        }
                      />
                    );
                  })
                )}
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={editChangedCartela}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  Edit Changed
                </button>
                <button
                  onClick={() => deleteCartela(selectedCartela.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  Delete
                </button>
                <button
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition h-max"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
