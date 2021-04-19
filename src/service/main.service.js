import firebase from 'firebase/app';
import 'firebase/firestore';
import {firebaseAuth} from '../auth/firebase.auth';

const firebaseConfig = firebaseAuth;

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
export const firestore = firebase.firestore();

export const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};