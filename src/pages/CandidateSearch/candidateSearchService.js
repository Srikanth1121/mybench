import { getDocs, collection, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { parseBooleanQuery } from "./booleanParser";

/**
 * MAIN SEARCH FUNCTION
 */
export async function runCandidateSearch(queryText, filters) {
  const parsed = parseBooleanQuery(queryText);

  const benchCandidates = await fetchBenchCandidates(filters);
  const directCandidates = await fetchDirectCandidates(filters);

  const benchTagged = benchCandidates.map((c) => ({ ...c, source: "bench" }));
  const directTagged = directCandidates.map((c) => ({ ...c, source: "direct" }));

  let allCandidates = [...benchTagged, ...directTagged];

  // Attach recruiter details
  allCandidates = await attachRecruiterInfo(allCandidates);

  return allCandidates
    .filter((c) => applyClientFilters(c, filters))
    .filter((c) => applyBooleanSearch(c, parsed));
}

/**
 * STEP 1 — FETCH BENCH CANDIDATES (from candidates collection)
 */
async function fetchBenchCandidates(filters) {
  const colRef = collection(db, "candidates");

  const base = [where("country", "==", "India")];

  if (filters.state) base.push(where("state", "==", filters.state));

  const q = query(colRef, ...base);
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

/**
 * STEP 2 — FETCH DIRECT CANDIDATES FROM USERS
 */
async function fetchDirectCandidates(filters) {
  if (filters.source === "bench") return []; // skip direct

  const colRef = collection(db, "users");

  const base = [
    where("role", "==", "candidate"),
    where("country", "==", "India"),
  ];

  const q = query(colRef, ...base);
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    fullName: d.data().name,
    email: d.data().email,
    mobile: d.data().mobile,
    experience: d.data().experience,
    city: d.data().city || "",
    state: d.data().state || "",
    skills: d.data().skills || [],
    resumeText: d.data().resumeText || "",
    currentCTC: d.data().currentCTC || "",
    currentCTCType: d.data().currentCTCType || "",
    noticePeriod: d.data().noticePeriod || "",
    recruiterId: null, // direct
  }));
} // ← CORRECT CLOSING BRACE

/**
 * STEP 3 — ATTACH RECRUITER INFO FOR BENCH CANDIDATES
 */
async function attachRecruiterInfo(candidates) {
  const results = [];

  for (const cand of candidates) {
    if (!cand.recruiterId) {
      results.push(cand);
      continue;
    }

    try {
      const ref = doc(db, "users", cand.recruiterId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const r = snap.data();
        results.push({
          ...cand,
          recruiterName: r.name || r.fullName || "",
          recruiterEmail: r.email || "",
          recruiterPhone: r.mobile || "",
        });
      } else {
        results.push(cand);
      }
    } catch (e) {
      console.error("Recruiter fetch failed:", e);
      results.push(cand);
    }
  }

  return results;
}

/**
 * STEP 4 — CLIENT FILTERS
 */
function applyClientFilters(c, filters) {
  const exp = Number(c.experience || 0);
  const minExp = Number(filters.minExp || 0);
  const maxExp = Number(filters.maxExp || 99);

  if (filters.minExp && exp < minExp) return false;
  if (filters.maxExp && exp > maxExp) return false;

  if (filters.noticePeriod && c.noticePeriod !== filters.noticePeriod) return false;

  if (filters.source === "bench" && !c.recruiterId) return false;
  if (filters.source === "independent" && c.source !== "direct") return false;

  if (filters.expectedCTC) {
    const candidateCTC = normalizeIndianNumber(c.currentCTC || "0");

    const candidateYearly =
      c.currentCTCType === "Per Month" ? candidateCTC * 12 : candidateCTC;

    const budget = normalizeIndianNumber(filters.expectedCTC);

    const budgetYearly =
      filters.expectedCTCType === "Per Month" ? budget * 12 : budget;

    if (candidateYearly > budgetYearly * 0.85) return false;
  }

  return true;
}

/**
 * STEP 5 — BOOLEAN SEARCH
 */
function applyBooleanSearch(candidate, parsed) {
  const { and, or, not } = parsed;
  const resume = (candidate.resumeText || "").toLowerCase();

  if (and.length && !and.every((t) => resume.includes(t))) return false;
  if (or.length && !or.some((t) => resume.includes(t))) return false;
  if (not.length && !not.every((t) => !resume.includes(t))) return false;

  return true;
}

/**
 * CLEAN NUMBER
 */
function normalizeIndianNumber(str) {
  if (!str) return 0;
  return Number(str.replace(/,/g, "")) || 0;
}
