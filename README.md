# Basic WebRTC Implementation

This is a basic implementation of webRTC concept which you can run by opening this [website](https://rishavmedhi.github.io/webrtc-basic/) in two browser windows on two different devices and get connected on a video call

Inspired by the tutorial by [fireship.io](https://www.youtube.com/channel/UCsBjURrPoezykLs9EqgamOA) which I stumbled upon on youtube.

Referred the following links for the tutorial:
1. [Youtube Video](https://www.youtube.com/watch?v=WmR9IMUD_CY)
2. [Tutorial Source Code](https://github.com/fireship-io/webrtc-firebase-demo)
3. [Tutorial Doc](https://fireship.io/lessons/webrtc-firebase-video-chat/)

If you are interested in learning more about the architecture and working of the webRTC setup, please visit the above links. Fireship.io has done an awesome job in explaining how it works.

## How my project is different from the tutorial?

- Implemented in React instead of Vanilla JS. Used React Hooks
- Tried out Tailwind CSS as a personal experiment (not required for the tutorial)
- Basic Mobile view optimised by using Tailwind CSS

## Requirements to run in your system

1. Node.js version >=12.0.0
2. Firestore db in Firebase

## Running the Application in your System

1. Clone the project into your system  
`git clone https://github.com/rishavmedhi/webrtc-basic.git`

2. Add the firebase config file to `src/auth/` folder.  
   Add the required values as per your credentials of the firebase db.  
  
    `firebase.auth.js`

    ```javascript
    export const firebaseAuth = {
        apiKey: "<API_KEY>",
        authDomain: "<AUTH_DOMAIN>",
        projectId: "<PROJECT_ID>",
        storageBucket: "<STORAGE_BUCKET>",
        messagingSenderId: "<MESSAGING_SENDER_ID>",
        appId: "<APP_ID>"
      };
    ```

3. Execute the following commands to run the application

    ```shell
      npm install
      npm run dev
    ```

4. Go to http://localhost:3000 to view the application.


## Problems and Issues
Although it is not a finished product and doesn't aim to be one, it is just a prototype and basic implementation of the concept as an experiment.

The issues with the implementation are:  

1. Unwanted infinite loop echoes as the sound from both local stream and remote stream gets transmitted to and fro.
2. Video call connection is not established under certain network connections.  
It is found to work best on current home network and on connecting to two different devices (desktop/mobile)
3. UI issues: adjusting screen sizes of different devices. Currently the local/remote strean screen might elongate if it is a mobile device.
