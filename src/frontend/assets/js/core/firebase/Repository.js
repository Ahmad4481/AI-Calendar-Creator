import { addDoc, updateDoc, deleteDoc, getDocs, getDoc, setDoc } from "./firebase-exports.js";
import { col, docRef } from "./helpers.js";

// ----------------------
// Repository
// - Generic Firestore repository for Users and Subcollections
// ----------------------

export default class Repository {
    /**
     * @param {string|null} subCollection - Subcollection name (e.g. "events") or null for root users
     */
    constructor(subCollection = null) {
        this.root = "users";
        this.subCollection = subCollection;
    }

    /**
     * Helper to resolve path components
     * @param {string} userId - The user's UID
     * @param {string|null} docId - The specific document ID (optional)
     */
    _resolve(userId, docId = null) {
        // Case 1: Subcollection (e.g. users/123/events)
        if (this.subCollection) {
            const collectionPath = `${this.root}/${userId}/${this.subCollection}`;
            if (docId) {
                return { path: collectionPath, id: docId };
            }
            return { path: collectionPath, id: null };
        }

        // Case 2: Root User Document (e.g. users/123)
        // userId is the ID of the document in the 'users' collection.
        return { path: this.root, id: userId };
    }

    // Create/Over-write document with specific ID
    // For Root Users: set(uid, null, data)
    // For Subcollections: set(uid, "docId", data)
    async set(userId, docId, data) {
        const { path, id } = this._resolve(userId, docId);
        if (!id) throw new Error("Document ID is required for set()");
        return setDoc(docRef(path, id), data);
    }

    // Get document
    async get(userId, docId = null) {
        const { path, id } = this._resolve(userId, docId);
        const docSnap = await getDoc(docRef(path, id));
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() };
    }

    // Add document to collection (Auto ID)
    async add(userId, data) {
        const { path } = this._resolve(userId);
        // Note: col() helper expects a path string
        return addDoc(col(path), data);
    }

    // Update document
    async update(userId, docId, data) {
        const { path, id } = this._resolve(userId, docId);
        return updateDoc(docRef(path, id), data);
    }

    // Delete document
    async delete(userId, docId = null) {
        const { path, id } = this._resolve(userId, docId);
        return deleteDoc(docRef(path, id));
    }

    // Find in collection (Query)
    async find(userId, queryFn) {
        const { path } = this._resolve(userId);
        const snapshot = await getDocs(queryFn(col(path)));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
}
