import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import "./firebase-config.js";

if (!window.FIREBASE_CONFIG) {
  throw new Error("Configuração do Firebase não encontrada.");
}

const app = initializeApp(window.FIREBASE_CONFIG);

export const db = getFirestore(app);
export const auth = getAuth(app);
