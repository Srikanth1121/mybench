export function parseBooleanQuery(rawQuery) {
  if (!rawQuery || !rawQuery.trim()) {
    return { and: [], or: [], not: [] };
  }

  let query = rawQuery.trim();

  // STEP 1 — Extract quoted phrases
  const phraseMap = {};
  let phraseIndex = 0;

  query = query.replace(/"([^"]*)"/g, (_, phrase) => {
    const key = `__PHRASE_${phraseIndex}__`;
    phraseMap[key] = phrase.trim().toLowerCase();
    phraseIndex++;
    return key;
  });

  // STEP 2 — Tokenize
  let tokens = query
    .split(/\s+/)
    .filter(Boolean);

  // STEP 3 — Parse left-to-right
  let andList = [];
  let orList = [];
  let notList = [];

  let pendingOp = "AND";

  const isOperator = (t) =>
    ["AND", "OR", "NOT"].includes(t.toUpperCase());

  for (let t of tokens) {
    const upper = t.toUpperCase();

    if (isOperator(upper)) {
      pendingOp = upper;
      continue;
    }

    let term = t;

    if (phraseMap[term]) {
      term = phraseMap[term];
    } else {
      term = term.toLowerCase().trim();
    }

    if (!term) continue;

    switch (pendingOp) {
      case "AND":
        andList.push(term);
        break;
      case "OR":
        orList.push(term);
        break;
      case "NOT":
        notList.push(term);
        break;
      default:
        andList.push(term);
        break;
    }

    pendingOp = "AND";
  }

  const dedupe = (arr) => [...new Set(arr.map((s) => s.trim()))];

  return {
    and: dedupe(andList),
    or: dedupe(orList),
    not: dedupe(notList),
  };
}
