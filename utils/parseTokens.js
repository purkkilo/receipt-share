/**
 * extractProducts(tokens)
 * Input: tokens = [{ text: "...", bounding: { left, top, width, height } }, ...]
 * Output: [{ name, price, priceText, top, left, confidence }, ...] sorted top->bottom
 *
 * Heuristics used:
 * - Detect numeric tokens that look like prices (e.g. "2,45", "28.32", "0,15 €/KPL")
 * - Cluster numeric tokens by X to find numeric columns; choose the rightmost numeric cluster as main price column
 * - Group tokens into horizontal rows by Y proximity
 * - For each price token in the main column, attach contiguous tokens to the left as product name; if empty, try right side
 * - Attempt to merge previous rows (multi-line product names) if they contain alphabetic tokens and have no price
 * - Return confidence score (0..1) based on proximity/size heuristics
 */
export function extractProducts(tokens) {
  // defensive copy
  tokens = (tokens || []).map((t) => ({
    text: String(t.text || "").trim(),
    left: Number(t.bounding?.left || 0),
    top: Number(t.bounding?.top || 0),
    width: Number(t.bounding?.width || 0),
    height: Number(t.bounding?.height || 0),
  }));

  if (!tokens.length) return [];

  // helpers
  const right = (t) => t.left + t.width;
  const xCenter = (t) => t.left + t.width / 2;
  const yCenter = (t) => t.top + t.height / 2;

  // median helper
  function median(arr) {
    const a = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(a.length / 2);
    return a.length % 2 === 1 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  }

  // compute medians to form thresholds
  const heights = tokens.map((t) => t.height || 1);
  const widths = tokens.map((t) => Math.max(t.width || 1, 1));
  const H_med = Math.max(1, median(heights));
  const W_med = Math.max(1, median(widths));

  const ROW_TOL = Math.max(0.6 * H_med, 8); // y clustering threshold
  const GAP_TOL = Math.max(W_med * 2, 20); // horizontal adjacency tolerance

  // regex to find price-like substring (captures e.g. 2,45 or 28.32)
  const priceSubRe = /(\d{1,3}[,\.]\d{2})/;
  const fuzzyNum = (s) => {
    if (!s) return null;
    // common OCR fixes: OCR often confuses O with 0 in numeric tokens
    // only replace 'O'->'0' when token has digits and letters O
    let t = s.replace(/\u2019/g, "'").trim();
    if (/[\d]/.test(t) && /O/.test(t)) t = t.replace(/O/g, "0");
    // Try to extract first price-like pattern
    const m = t.match(priceSubRe);
    if (!m) return null;
    const raw = m[1];
    // normalize comma to dot for parseFloat
    const normalized = raw.replace(",", ".");
    const val = parseFloat(normalized);
    if (Number.isFinite(val)) return { value: val, raw: raw };
    return null;
  };

  // mark price candidates
  const priceCandidates = tokens
    .map((t, i) => {
      const parsed = fuzzyNum(t.text);
      return {
        idx: i,
        token: t,
        parsed, // null or {value, raw}
        xRight: right(t),
        xCenter: xCenter(t),
        yCenter: yCenter(t),
      };
    })
    .filter((p) => p.parsed !== null);

  // if no numeric tokens found, return empty quickly
  if (!priceCandidates.length) return [];

  // cluster price candidate xRight positions into columns (1D clustering by gaps)
  const xsSorted = priceCandidates.slice().sort((a, b) => a.xRight - b.xRight);
  const columns = [];
  let curColumn = { xs: [], items: [] };
  for (let i = 0; i < xsSorted.length; i++) {
    const it = xsSorted[i];
    if (!curColumn.xs.length) {
      curColumn.xs.push(it.xRight);
      curColumn.items.push(it);
    } else {
      const prev = xsSorted[i - 1];
      const gap = it.xRight - prev.xRight;
      // if gap is small -> same column, else start new column
      if (gap <= Math.max(W_med * 3, 30)) {
        curColumn.xs.push(it.xRight);
        curColumn.items.push(it);
      } else {
        // finish column
        curColumn.center =
          curColumn.xs.reduce((a, b) => a + b, 0) / curColumn.xs.length;
        columns.push(curColumn);
        curColumn = { xs: [it.xRight], items: [it] };
      }
    }
  }
  // push last
  if (curColumn.xs.length) {
    curColumn.center =
      curColumn.xs.reduce((a, b) => a + b, 0) / curColumn.xs.length;
    columns.push(curColumn);
  }

  // choose rightmost numeric column as main price column
  columns.sort((a, b) => a.center - b.center);
  const mainPriceColumn = columns[columns.length - 1];
  const mainPriceX = mainPriceColumn.center;

  // cluster all tokens into rows by yCenter (simple sequential grouping after sorting by yCenter)
  const tokensByYC = tokens
    .map((t, i) => ({ i, t, y: yCenter(t) }))
    .sort((a, b) => a.y - b.y);

  const rows = [];
  let currentRow = { items: [], yCenterSum: 0 };
  for (let p of tokensByYC) {
    if (!currentRow.items.length) {
      currentRow.items.push(p);
      currentRow.yCenterSum += p.y;
    } else {
      const lastY = currentRow.items[currentRow.items.length - 1].y;
      if (Math.abs(p.y - lastY) <= ROW_TOL) {
        currentRow.items.push(p);
        currentRow.yCenterSum += p.y;
      } else {
        currentRow.meanY = currentRow.yCenterSum / currentRow.items.length;
        rows.push(currentRow);
        currentRow = { items: [p], yCenterSum: p.y };
      }
    }
  }
  if (currentRow.items.length) {
    currentRow.meanY = currentRow.yCenterSum / currentRow.items.length;
    rows.push(currentRow);
  }

  // helper to check if a token is alphabetic-ish (product name) or likely numeric label
  function isAlphabeticText(s) {
    return /[A-Za-zÅÄÖåäö]/.test(s);
  }

  // prepare lookup from token idx -> row index
  const tokenIdxToRow = new Map();
  rows.forEach((r, ridx) => {
    r.items.forEach((it) => tokenIdxToRow.set(it.i, ridx));
  });

  // prepare quick access of price candidates per row
  const priceCandByRow = new Map();
  for (const pc of priceCandidates) {
    const rowIdx = tokenIdxToRow.get(pc.idx);
    if (rowIdx === undefined) continue;
    if (!priceCandByRow.has(rowIdx)) priceCandByRow.set(rowIdx, []);
    priceCandByRow.get(rowIdx).push(pc);
  }

  // blacklist for non-product lines (Finnish examples from your receipt)
  const blacklistKeywords = [
    "KÄTEINEN",
    "KORTTITAPAHTUMA",
    "BONUS",
    "BONUSTA",
    "Jäsennumero",
    "Jäsen",
    "KASSAKUITTI",
    "KPL",
    "OSTOT",
    "YHTEENSÄ",
  ];

  function isBlacklistedLine(s) {
    const S = (s || "").toUpperCase();
    return blacklistKeywords.some((k) => S.includes(k.toUpperCase()));
  }

  // collect product pairs
  const results = [];
  for (let ridx = 0; ridx < rows.length; ridx++) {
    const row = rows[ridx];

    // find price candidates in row (if any)
    const rowPrices = priceCandByRow.get(ridx) || [];
    if (!rowPrices.length) continue;

    // choose row price nearest to mainPriceX
    const chosenPrice = rowPrices.reduce((best, cur) => {
      const dcur = Math.abs(cur.xRight - mainPriceX);
      const dbest = best ? Math.abs(best.xRight - mainPriceX) : Infinity;
      return dcur < dbest ? cur : best;
    }, null);

    if (!chosenPrice) continue;

    // gather left-side candidate tokens (in the same row)
    const sameRowTokens = row.items
      .map((it) => ({ idx: it.i, token: it.t }))
      .filter((x) => x.idx !== chosenPrice.idx); // remove price itself if present

    const leftTokens = sameRowTokens
      .filter((x) => x.token.left + x.token.width / 2 < chosenPrice.xCenter)
      .sort((a, b) => a.token.left - b.token.left);

    const rightTokens = sameRowTokens
      .filter((x) => x.token.left + x.token.width / 2 > chosenPrice.xCenter)
      .sort((a, b) => a.token.left - b.token.left);

    // function to build name from contiguous tokens (either leftwards or rightwards)
    function buildNameFromList(list, direction = "left") {
      if (!list.length) return { name: "", tokens: [] };
      if (direction === "left") {
        // walk from nearest (rightmost) left token, go left while gaps small
        const rev = list.slice().reverse();
        let chosen = [];
        let lastRightEdge = chosenPrice.token.left; // start gap calculation from price.left
        for (let it of rev) {
          const edgeRight = it.token.left + it.token.width;
          const gap = lastRightEdge - edgeRight;
          if (gap > GAP_TOL && chosen.length) break;
          // accept token if it looks alphabetic or contains letters
          chosen.unshift(it);
          lastRightEdge = it.token.left;
        }
        return {
          name: chosen
            .map((x) => x.token.text)
            .join(" ")
            .trim(),
          tokens: chosen,
        };
      } else {
        // direction right: walk from nearest (leftmost) right token, go right while gaps small
        let chosen = [];
        let lastLeftEdge = chosenPrice.token.left + chosenPrice.token.width; // start after price
        for (let it of list) {
          const gap = it.token.left - lastLeftEdge;
          if (gap > GAP_TOL && chosen.length) break;
          chosen.push(it);
          lastLeftEdge = it.token.left + it.token.width;
        }
        return {
          name: chosen
            .map((x) => x.token.text)
            .join(" ")
            .trim(),
          tokens: chosen,
        };
      }
    }

    // try left first
    let { name, tokens: nameTokens } = buildNameFromList(leftTokens, "left");

    // if left produced nothing meaningful, try right
    if (!name || name.length < 2) {
      const rightRes = buildNameFromList(rightTokens, "right");
      if (rightRes.name && rightRes.name.length > name.length) {
        name = rightRes.name;
        nameTokens = rightRes.tokens;
      }
    }

    // If still short, attempt to merge previous row(s) (multi-line names)
    if ((!name || name.split(/\s+/).length < 2) && ridx > 0) {
      // look upward a few rows while they contain alphabetic tokens and no price
      for (let up = ridx - 1; up >= Math.max(0, ridx - 3); up--) {
        const upRow = rows[up];
        const upRowPrices = priceCandByRow.get(up) || [];
        if (upRowPrices.length) break; // stop if that row has price (different product usually)
        const upTokens = upRow.items.map((it) => it.t);
        const alphaTokens = upTokens.filter((t) => isAlphabeticText(t.text));
        if (!alphaTokens.length) break;
        // prepend that row's text tokens (left-aligned)
        const concat = alphaTokens.map((t) => t.text).join(" ");
        name = (concat + " " + (name || "")).trim();
      }
    }

    // final cleanup: remove stray punctuation, collapse multiple spaces
    name = (name || "").replace(/\s{2,}/g, " ").trim();

    // create confidence: basic heuristic
    let confidence = 1.0;
    // penalize if name empty
    if (!name) confidence -= 0.5;
    // penalize by vertical offset of price from row mean (should be small)
    const vertDiff = Math.abs(chosenPrice.yCenter - row.meanY || 0);
    confidence -= Math.min(0.3, vertDiff / (H_med * 3));
    // penalize if name tokens count is only 1 short
    const tokenCount = (nameTokens || []).length;
    if (tokenCount <= 1) confidence -= 0.15;
    confidence = Math.max(0, Math.min(1, confidence));

    // skip blacklisted lines
    if (isBlacklistedLine(name)) continue;

    // push result
    results.push({
      name: name || "-",
      price: chosenPrice.parsed.value,
      priceText: chosenPrice.parsed.raw,
      top: row.meanY,
      left: mainPriceX, // approximate column location
      confidence,
    });
  }

  // sort top->bottom (smaller top means earlier on receipt)
  results.sort((a, b) => a.top - b.top);

  return results;
}
