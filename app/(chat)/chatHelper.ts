import { FIRESTORE_DB } from "@/constants/firebaseConf";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  setDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

const db = getFirestore();

export const storeChatInFirestore = async (userId, personaId, message) => {
  if (!userId || !personaId) return;

  const userDocRef = doc(db, "users", userId);
  const sessionDocRef = doc(userDocRef, "sessions", personaId);
  const messagesCollectionRef = collection(sessionDocRef, "messages");

  await addDoc(messagesCollectionRef, {
    user: message.user,
    bot: message.bot,
    summary: message.summary,
    createdAt: serverTimestamp(),
    tokenUsage: {
      total: message.tokenUsage.total || 0,
      prompt: message.tokenUsage.prompt || 0,
      completion: message.tokenUsage.completion || 0,
      system: message.tokenUsage.system || 0,
    },
    summaryTokenUsage: {
      total: message.summaryTokenUsage.total || 0,
      prompt: message.summaryTokenUsage.prompt || 0,
      completion: message.summaryTokenUsage.completion || 0,
      system: message.summaryTokenUsage.system || 0,
    },
    metadata: {
      model: message.model || "unknown",
      responseTimeMs: message.responseTimeMs || 0,
    },
  });

  const totalTokensUsed =
    (message.tokenUsage.total || 0) + (message.summaryTokenUsage.total || 0);

  await setDoc(
    userDocRef,
    { totalTokensUsed: increment(totalTokensUsed) },
    { merge: true }
  );

  await setDoc(
    sessionDocRef,
    { totalTokensUsed: increment(totalTokensUsed) },
    { merge: true }
  );
};

export const fetchGlobalInstructions = async () => {
  try {
    const docRef = doc(FIRESTORE_DB, "variables", "globalInstructions");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data()?.globalInstructions : "";
  } catch (error) {
    console.error("Error fetching global instructions:", error);
    return "";
  }
};

export const fetchSummaryInstructions = async () => {
  try {
    const docRef = doc(FIRESTORE_DB, "variables", "summaryInstructions");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data()?.summaryInstructions : "";
  } catch (error) {
    console.error("Error fetching global instructions:", error);
    return "";
  }
};

export const fetchSummaryInstructionsJournal = async () => {
  try {
    const docRef = doc(FIRESTORE_DB, "variables", "journalSummary");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data()?.instructions : "";
  } catch (error) {
    console.error("Error fetching global instructions:", error);
    return "";
  }
};

export const fetchInstructionsJournal = async () => {
  try {
    const docRef = doc(FIRESTORE_DB, "variables", "journalInstructions");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data()?.journalInstructions : "";
  } catch (error) {
    console.error("Error fetching global instructions:", error);
    return "";
  }
};

export default {
  fetchGlobalInstructions,
  storeChatInFirestore,
  fetchSummaryInstructions,
  fetchInstructionsJournal,
  fetchSummaryInstructionsJournal,
};
