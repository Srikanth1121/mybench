import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import { parseBooleanQuery } from "./booleanParser";

/**
 * MAIN SEARCH FUNCTION
 */
export async function runCandidateSearch(queryText, filters) {
  const parsed = parseBooleanQuery(queryText);

  // Get candidates from Firestore (basic filters)
  const candidates = await fetchByFilters(filters);

  // Apply client-side filters + resume boolean search
  return candidates
    .filter((c) => applyClientFilters(c, filters))
    .filter((c) => applyBooleanSearch(c, parsed));
}

/**
 * STEP 1 — FIRESTORE FILTERS (basic only)
 */
async function fetchByFilters(filters) {
  const colRef = collection(db, "candidates");

  const base = [where("country", "==", "India")];

  // State
  if (filters.state) base.push(where("state", "==", filters.state));
  const q = query(colRef, ...base);
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * STEP 2 — CLIENT-SIDE FILTERS
 */
function applyClientFilters(c, filters) {
  const exp = Number(c.experience || 0);
  const minExp = Number(filters.minExp || 0);
  const maxExp = Number(filters.maxExp || 99);

  // Experience filter
  if (filters.minExp && exp < minExp) return false;
  if (filters.maxExp && exp > maxExp) return false;

  // Notice Period
  if (filters.noticePeriod && c.noticePeriod !== filters.noticePeriod) return false;
  // Source filter (Only Bench / Only Independent)
if (filters.source === "bench" && !c.recruiterId) return false;
if (filters.source === "independent" && c.recruiterId) return false;


  // Budget CTC filter (Budget – 15%)
  if (filters.expectedCTC) {
    const candidateCTC = normalizeIndianNumber(c.currentCTC || "0");
     // Convert candidate CTC → yearly
  let candidateYearly =
    c.currentCTCType === "Per Month"
      ? candidateCTC * 12
      : candidateCTC;
    const budget = normalizeIndianNumber(filters.expectedCTC);
 // Convert budget → yearly
  let budgetYearly =
    filters.expectedCTCType === "Per Month"
      ? budget * 12
      : budget;
   // Compare yearly CTC
if (candidateYearly > budgetYearly * 0.85) return false;

  }

  return true;
}

/**
 * STEP 3 — BOOLEAN SEARCH (resume only)
 */
function applyBooleanSearch(candidate, parsed) {
  const { and, or, not } = parsed;
  const resume = (candidate.resumeText || "").toLowerCase();

  if (and.length > 0 && !and.every((t) => resume.includes(t))) return false;
  if (or.length > 0 && !or.some((t) => resume.includes(t))) return false;
  if (not.length > 0 && !not.every((t) => !resume.includes(t))) return false;

  return true;
}

/**
 * Convert "5,00,000" → 500000
 */
function normalizeIndianNumber(str) {
  if (!str) return 0;
  return Number(str.toString().replace(/,/g, "")) || 0;
}
