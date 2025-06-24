"use client";

export default function DownloadCardsButton() {
  const handleDownload = () => {
    const data = "Sample card data...\nBingo Card 1\nBingo Card 2";
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "bingo_cards.txt";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition font-medium"
    >
      Download Cards
    </button>
  );
}
