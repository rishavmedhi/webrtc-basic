import React, { createRef, useEffect, useState } from 'react'
import logo from './logo.svg'
import GithubIcon from './assets/GithubIcon.svg';
import {servers, firestore} from './service/main.service';

function App() {
  const webcamVideoRef = createRef();
  const remoteVideoRef = createRef();
  let localStream = null;
  let remoteStream = null;

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
    hangupButton: {
      disabled: true
    },
    callInputId: '',
  })
  const [pc, setPc] = useState('');

  useEffect(() => {
    // this manages all the peer-to-peer connection
    // manages the ice-candidates by using stun servers declared above
    setPc(new RTCPeerConnection(servers));
  }, [])

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

    setGlobalState({
      ...globalState,
      callButton: {disabled: false},
      answerButton: {disabled: false},
      webcamButton: {disabled: true},
      hangupButton: {disabled: false}
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
      const data = snapshot.data();
      if(!pc.currentRemoteDescription && data?.answer){
        console.log('before RTCSessionDescription');
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    // when answered, add candidate to peer connection
    answerCandidates.onSnapshot(snapshot => {
      snapshot.docChanges().forEach((change) => {
        if(change.type === 'added'){
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate).catch(e => {
            console.error(e);
          });
        }
      })
    })
  }

  // answer the call feature
  const answerButtonOnClick = async () => {
    const callId = globalState.callInputId;
    const callDoc = firestore.collection('calls').doc(callId);
    const answerCandidates = callDoc.collection('answerCandidates');
    const offerCandidates = callDoc.collection('offerCandidates'); 

    pc.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    }

    const callData = (await callDoc.get()).data();

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    }

    await callDoc.update({ answer });

    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        console.log(change);
        if(change.type === 'added'){
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data)).catch(e => {
            console.error(e.name);
          });
        }
      });
    })
  }

  const onCallIdInput = (event) => {
    setGlobalState({
      ...globalState,
      callInputId: event.target.value
    })
  }

  const hangupButtonOnClick = () => {
    window.location.reload();
  }

  return (
    <div className="main-container overflow-y-auto p-8 absolute bg-indigo-200 md:h-full sm:h-auto" style={{width: '100%'}}>
      <h1 className="text-2xl text-center">Basic WebRTC Platform</h1>
      <div className="video-container justify-between mt-4 md:flex">
        <div className="">
          <h3 className="text-center">Local Stream</h3>
          <WebcamVideo ref={webcamVideoRef}/>
        </div>
        <div className="md:pt-0 sm:pt-4">
          <h3 className="text-center">Remote Stream</h3>
          <RemoteVideo ref={remoteVideoRef} />
        </div>
      </div>
      
      <div className="control-container m-4 text-center space-y-6">
        <button
          className="bg-purple-600 pt-2 pb-2 pl-4 pr-4 text-white rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed" 
          id="webcamButton" 
          onClick={onWebcamStartClick}
          disabled={globalState.webcamButton.disabled}
        >
          Start webcam
        </button>

        <div>
          <h2>2. Create a new Call</h2>
          <button 
            className="bg-purple-600 pt-2 pb-2 pl-4 pr-4 text-white rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed" 
            id="callButton" 
            disabled={globalState.callButton.disabled}
            onClick={createCallOnClick}
          >
            Create Call (offer)
          </button>
          <p>Clicking this will create offer code below</p>
        </div>

        <div>
          <h2>3. Join a Call</h2>
          <p>Answer the call from a different browser window or device</p>

          <input 
            id="callInput" 
            value={globalState.callInputId} 
            onChange={onCallIdInput} 
            className="border border-gray-300 pt-2 pb-2 pl-2 pr-2 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:opacity-50 md:mr-4 sm:mr-0 mb-4"
            style={{width:'300px'}}
            placeholder="offer code to be pasted here"
            />
          <button
            className="bg-purple-600 pt-2 pb-2 pl-4 pr-4 text-white rounded font-bold mt-0 disabled:opacity-50 disabled:cursor-not-allowed" 
            id="answerButton" 
            disabled={globalState.answerButton.disabled}
            onClick={answerButtonOnClick} 
          >
            Answer
          </button>
        </div>

        <div>
          <h2>4. Hangup</h2>

          <button 
            id="hangupButton"
            className="bg-purple-600 pt-2 pb-2 pl-4 pr-4 text-white rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={globalState.hangupButton.disabled}
            onClick={hangupButtonOnClick}
          >
              Hangup
          </button>
        </div>
      </div>

      <footer className="text-center p-4 space-y-4">
        <a className="align-middle text-purple-600 font-medium" href="https://github.com/rishavmedhi/webrtc-basic">
          <img className="inline" src={GithubIcon} height="20" width="20" /> <div className="inline align-middle">Github</div>
        </a>
        <div className="">
          Inspired by <a className="text-purple-600 font-medium" href="https://www.youtube.com/watch?v=WmR9IMUD_CY">Fireship.io</a>
        </div>  
      </footer>
    </div>
  )
}

const WebcamVideo = React.forwardRef((props, ref) => (
  <video className="bg-black w-500 h-auto sm:w-full" ref={ref} id="webcamVideo" autoPlay playsInline></video>
))

const RemoteVideo = React.forwardRef((props, ref) => (
  <video className="bg-black w-500 h-auto sm:w-full" ref={ref} id="remoteVideo" autoPlay playsInline></video>
))

export default App
