// candidateSearchService.js
import { getDocs, collection, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { parseBooleanQuery } from "./booleanParser";

/**
 * MAIN SEARCH FUNCTION
 */
export async function runCandidateSearch(queryText, filters) {
  // Parse boolean query once
  const parsed = parseBooleanQuery(queryText);

  // STEP 1 & 2: fetch candidates
  const benchCandidates = await fetchBenchCandidates(filters);
  const directCandidates = await fetchDirectCandidates(filters);

  const benchTagged = benchCandidates.map((c) => ({ ...c, source: "bench" }));
  const directTagged = directCandidates.map((c) => ({ ...c, source: "direct" }));

  let allCandidates = [...benchTagged, ...directTagged];

  // Attach recruiter details
  allCandidates = await attachRecruiterInfo(allCandidates);

  // --- START: GLOBAL NOT post-filter (safe & idempotent) ---
  // Collect NOT terms from parser output (cover both parsed.not and groups.not)
  const globalNotTerms = [];
  if (parsed) {
    if (Array.isArray(parsed.not)) globalNotTerms.push(...parsed.not);
    if (Array.isArray(parsed.groups)) {
      parsed.groups.forEach((g) => {
        if (Array.isArray(g.not)) globalNotTerms.push(...g.not);
      });
    }
  }

  // Normalize + dedupe
  const globalNot = [
    ...new Set(
      globalNotTerms
        .filter(Boolean)
        .map((t) => t.toString().trim().toLowerCase())
    ),
  ];

  if (globalNot.length > 0) {
    // Local matcher (same logic as hasWord) to avoid moving functions around
    function hasWordLocal(text, term) {
      if (!term) return false;
      const t = (term || "").toString().trim();
      if (!t) return false;
      const words = t
        .split(/\s+/)
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const pattern = `\\b${words.join("\\s+")}\\b`;
      const regex = new RegExp(pattern, "i");
      return regex.test(text);
    }

    // Build normalized searchText for each candidate and filter out matches
    allCandidates = allCandidates.filter((cand) => {
      const searchText = [
        cand.fullName,
        cand.city,
        cand.state,
        cand.currentCompany,
        cand.company,
        cand.employerName,
        cand.clientName,
        cand.projectDetails,
        ...(cand.skills || []),
        cand.resumeText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .replace(/<[^>]+>/g, " ")
        .replace(/\{[^}]+\}/g, " ")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/\/\/.*$/gm, " ")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      for (const nt of globalNot) {
        if (hasWordLocal(searchText, nt)) {
          return false;
        }
      }
      return true;
    });
  }
  // --- END: GLOBAL NOT post-filter ---

  // Finally apply client-side filters and boolean search groups
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

  const base = [where("role", "==", "candidate"), where("country", "==", "India")];

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
      // swallow fetch errors and return candidate as-is
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
/**
 * BOOLEAN SEARCH USING OR-GROUPS
 * parsed.groups = [ { and:[], not:[] }, ... ]
 */

// --- robust word/phrase matcher ---
function hasWord(text, term) {
  if (!term) return false;

  // Normalize inputs
  const t = (term || "").toString().trim();
  if (!t) return false;

  // Escape each word and join with \s+ so phrases like "software engineers"
  // match even if there's \n or multiple spaces between words.
  const words = t.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  // Anchor the phrase to word boundaries on both ends.
  const pattern = `\\b${words.join("\\s+")}\\b`;
  const regex = new RegExp(pattern, "i");
  return regex.test(text);
}

function applyBooleanSearch(candidate, parsed) {
  if (!parsed || !parsed.groups || parsed.groups.length === 0) {
    return true;
  }

  // Build the searchable text once
  let searchText = [
    candidate.fullName,
    candidate.city,
    candidate.state,
    candidate.currentCompany,
    candidate.company,
    candidate.employerName,
    candidate.clientName,
    candidate.projectDetails,
    ...(candidate.skills || []),
    candidate.resumeText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Normalize: remove tags/comments/punctuation and collapse whitespace
  searchText = searchText
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[^}]+\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Evaluate each OR group (a candidate passes if any group evaluates true)
  for (const group of parsed.groups) {
    const { and = [], not = [] } = group;

    // AND part: if there are no AND terms treat it as true (so NOT-only groups work)
    const matchAnd =
      and.length === 0
        ? true
        : and.every((term) => {
            return hasWord(searchText, term);
          });

    // NOT part: candidate must NOT match any of these
    const matchNot =
      not.length === 0
        ? true
        : not.every((term) => {
            return !hasWord(searchText, term);
          });

    const final = matchAnd && matchNot;

    if (final) {
      return true;
    }
  }

  return false;
}

/**
 * CLEAN NUMBER
 */
function normalizeIndianNumber(str) {
  if (!str) return 0;
  return Number(str.replace(/,/g, "")) || 0;
}
