import React, { createRef, useRef, useState } from 'react'
import logo from './logo.svg'
import {servers, firestore} from './service/main.service';
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [globalState, setGlobalState] = useState({
    webcamButton: {
      disabled: false
    },
    callButton: {
      disabled: true
    },
    answerButton: {
      disabled: true
    },
    callInputId: '',
  })

  const webcamVideoRef = createRef();
  const remoteVideoRef = createRef();

  // Global State
  // this manages all the peer-to-peer connection
  // manages the ice-candidates by using stun servers declared above
  const pc = new RTCPeerConnection(servers);
  let localStream = null;
  let remoteStream = null;

  const onWebcamStartClick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    remoteStream = new MediaStream();

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Pull tracks from remote stream, add to video stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    webcamVideoRef.current.srcObject = localStream;
    remoteVideoRef.current.srcObject = remoteStream;


    // callButton.disabled = false;
    // answerButton.disabled = false;
    // webcamButton.disabled = true;

    setGlobalState({
      ...globalState,
      callButton: {disabled: false},
      answerButton: {disabled: false},
      webcamButton: {disabled: true}
    });
  }

  // create call offer button click 
  const createCallOnClick = async () => {
    // Reference Firestore collection
    const callDoc = firestore.collection('calls').doc();
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    // setting the random call id to input field
    setGlobalState({
      ...globalState,
      callInputId: callDoc.id
    })

    // Get candidates for caller, save to db
    pc.onicecandidate = event => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    }

    // create offer
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type
    }

    await callDoc.set({offer});

    // listen for remote answer
    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data;
      if(!pc.currentRemoteDescription && data?.answer){
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    // when answered, add candidate to peer connection
    answerCandidates.onSnapshot(snapshot => {
      snapshot.docChanges().forEach((change) => {
        if(change.type === 'added'){
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      })
    })
  }


  return (
    <div className="main-container">
      <div className="video-container">
        <span>
          <h3>Local Stream</h3>
          <WebcamVideo ref={webcamVideoRef}/>
        </span>
        <span>
          <h3>Remote Stream</h3>
          <RemoteVideo ref={remoteVideoRef} />
        </span>
      </div>
      
      <button 
        id="webcamButton" 
        onClick={onWebcamStartClick}
        disabled={globalState.webcamButton.disabled}
      >
        Start webcam
      </button>

      <h2>2. Create a new Call</h2>
      <button 
        id="callButton" 
        disabled={globalState.callButton.disabled}
      >
        Create Call (offer)
      </button>

      <h2>3. Join a Call</h2>
      <p>Answer the call from a different browser window or device</p>

      <input id="callInput" value={globalState.callInputId} />
      <button 
        id="answerButton" 
        disabled={globalState.answerButton.disabled}
      >
        Answer
      </button>

      <h2>4. Hangup</h2>

      <button id="hangupButton" disabled>Hangup</button>
    </div>
  )
}

const WebcamVideo = React.forwardRef((props, ref) => (
  <video ref={ref} id="webcamVideo" autoPlay playsInline></video>
))

const RemoteVideo = React.forwardRef((props, ref) => (
  <video ref={ref} id="remoteVideo" autoPlay playsInline></video>
))

export default App
