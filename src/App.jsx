import React, { useRef, useState } from 'react'
import logo from './logo.svg'
import {servers} from './service/main.service';
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
    }
  })

  const webcamVideoRef = useRef();
  const remoteVideoRef = useRef();

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

    webcamVideoRef.srcObject = localStream;
    remoteVideoRef.srcObject = remoteStream;

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

  return (
    <div className="main-container">
      <div className="video-container">
        <span>
          <h3>Local Stream</h3>
          <video ref={webcamVideoRef} id="webcamVideo" autoPlay playsInline></video>
        </span>
        <span>
          <h3>Remote Stream</h3>
          <video ref={remoteVideoRef} id="remoteVideo" autoPlay playsInline></video>
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

      <input id="callInput" />
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

export default App
