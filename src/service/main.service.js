import firebase from 'firebase/app';
import 'firebase/firestore';
import {firebaseAuth} from '../auth/firebase.auth';

const firebaseConfig = firebaseAuth;

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Global State
// this manages all the peer-to-peer connection
// manages the ice-candidates by using stun servers declared above
const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;