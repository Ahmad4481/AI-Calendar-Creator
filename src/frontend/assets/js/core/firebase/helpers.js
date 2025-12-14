import { collection, doc } from "./firebase-exports.js";
import { db } from "./config.js";

// ----------------------
// Internal helpers
// ----------------------
const col = (name) => collection(db, name);
const docRef = (collectionName, id) => doc(db, collectionName, id);

const snapshotToArray = (snapshot) => {
  if (!snapshot) return [];
  const result = [];
  snapshot.forEach((docSnap) => {
    if (docSnap.exists()) {
      result.push({ id: docSnap.id, ...docSnap.data() });
    }
  });
  return result;
};

const isIndexError = (error) =>
  error?.code === "failed-precondition" || error?.message?.includes("index");

const runQueryWithFallback = async (primaryFn, fallbackFn) => {
  try {
    return await primaryFn();
  } catch (error) {
    if (isIndexError(error) && typeof fallbackFn === "function") {
      console.warn("[Firestore] Missing index, applying fallback query");
      return fallbackFn();
    }
    throw error;
  }
};

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
};

const sortByTimestamp = (items = [], field) => {
  if (!field) return items;
  return [...items].sort((a, b) => {
    const aDate = toDate(a?.[field]);
    const bDate = toDate(b?.[field]);
    if (!aDate || !bDate) return 0;
    return aDate - bDate;
  });
};

export {
  col,
  docRef,
  snapshotToArray,
  runQueryWithFallback,
  sortByTimestamp,
  toDate,
};

