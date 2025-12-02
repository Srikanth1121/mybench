import {
  collection,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/config";

/**
 * Build Firestore-friendly query instructions.
 * Does NOT execute queries — only builds them.
 *
 * @param {*} parsed {and:[], or:[], not:[]}
 * @param {*} filters India-only filters
 */
export function buildFirestoreQuery(parsed, filters) {
  const { and = [], or = [], not = [] } = parsed;

  // Base collection
  const colRef = collection(db, "candidates");

  // ----------------------------------------
  // Apply country (India only here)
  // ----------------------------------------
  const baseFilters = [
    where("country", "==", "IN"),
  ];

  if (filters.state) {
    baseFilters.push(where("state", "==", filters.state));
  }

  if (filters.workMode) {
    baseFilters.push(where("workMode", "==", filters.workMode));
  }

  if (filters.availability) {
    baseFilters.push(where("availability", "==", filters.availability));
  }

  if (filters.gender) {
    baseFilters.push(where("gender", "==", filters.gender));
  }
// Source filter: bench / independent
if (filters.source && filters.source !== "all") {
  baseFilters.push(where("source", "==", filters.source));
}

  // Experience filters
  if (filters.minExp !== "" && !isNaN(filters.minExp)) {
    baseFilters.push(where("experience", ">=", Number(filters.minExp)));
  }
  if (filters.maxExp !== "" && !isNaN(filters.maxExp)) {
    baseFilters.push(where("experience", "<=", Number(filters.maxExp)));
  }

  // ----------------------------------------
  // AND Queries — candidate must match ALL
  // ----------------------------------------
  let andQueries = [];

  if (and.length > 0) {
    and.forEach((term) => {
      // Each AND term is a separate where clause: array-contains
      const q = query(
        colRef,
        ...baseFilters,
        where("skills", "array-contains", term)
      );

      andQueries.push(q);
    });
  }

  // ----------------------------------------
  // OR Queries — merge results later
  // ----------------------------------------
  let orQueries = [];

  if (or.length > 0) {
    or.forEach((term) => {
      const q = query(
        colRef,
        ...baseFilters,
        where("skills", "array-contains", term)
      );

      orQueries.push(q);
    });
  }

  // ----------------------------------------
  // Return instructions (NOT logic applied later)
  // ----------------------------------------
  return {
    andQueries,    // require intersection
    orQueries,     // union merge
    notTerms: not, // filter client-side
  };
}
