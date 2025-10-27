// Plik: setup.js
const fs = require("fs");
const path = require("path");

// Definicja wszystkich ścieżek do plików
const filePaths = [
  "src/components/Dashboard/Dashboard.tsx",
  "src/components/Dashboard/Dashboard.module.css",
  "src/components/QuantumGraph/QuantumGraph.tsx",
  "src/components/QuantumGraph/QuantumGraph.module.css",
  "src/components/QuantumGraph/useD3ForceGraph.ts",
  "src/components/QuantumGraph/types.ts",
  "src/components/Leaderboard/Leaderboard.tsx",
  "src/components/Leaderboard/Leaderboard.module.css",
  "src/components/BadgeList/BadgeList.tsx",
  "src/components/BadgeList/BadgeList.module.css",
  "src/components/common/Panel.tsx",
  "src/components/common/Panel.module.css",
  "src/assets/icons.tsx",
  "src/utils/cn.ts",
];

console.log("Tworzenie struktury plików...");

filePaths.forEach((filePath) => {
  try {
    const dirName = path.dirname(filePath);

    // Utwórz foldery rekursywnie (jak mkdir -p)
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }

    // Utwórz pusty plik (jak touch)
    fs.writeFileSync(filePath, "");
    console.log(`Utworzono: ${filePath}`);
  } catch (error) {
    console.error(`Błąd podczas tworzenia ${filePath}:`, error.message);
  }
});

console.log("\nStruktura plików i folderów została pomyślnie utworzona.");
