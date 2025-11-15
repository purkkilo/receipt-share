// Add this to your component or test file to see what's happening
import { extractProducts } from "./parseTokens.js";

export function debugExtractProducts(tokens) {
  console.log("=== TOKEN DEBUG ===");
  console.log("Total tokens:", tokens.length);

  // Show each token
  tokens.forEach((t, i) => {
    console.log(`\nToken ${i}:`, {
      text: t.text.substring(0, 50),
      top: t.bounding?.top,
      left: t.bounding?.left,
      width: t.bounding?.width,
      height: t.bounding?.height,
      lines: t.lines?.length,
    });
    if (t.lines?.length > 1) {
      t.lines.forEach((line, j) => {
        console.log(`  Line ${j}: "${line.text}" @ top=${line.bounding?.top}`);
      });
    }
  });

  const results = extractProducts(tokens);
  console.log("\n=== EXTRACTED PRODUCTS ===");
  results.forEach((p) => {
    console.log(
      `${p.name}: €${p.price} (confidence: ${p.confidence.toFixed(2)})`
    );
  });

  return results;
}
