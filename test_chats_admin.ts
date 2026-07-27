import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, where, doc, getDoc } from "firebase/firestore";
import { readFileSync } from "fs";

// Instead of using client SDK without auth, I'll use the API key and simulate a REST request or something?
