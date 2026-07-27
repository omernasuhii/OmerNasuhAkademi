import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, where, doc, getDoc } from "firebase/firestore";
import { readFileSync } from "fs";

// Mock auth is hard with client SDK without a token. 
// We can use the REST API to simulate a request, but maybe we can just change the rule.
