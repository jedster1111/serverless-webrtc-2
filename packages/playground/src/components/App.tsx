import React, { useState } from "react";
import { useServerlessWebRTC } from "serverless-webrtc";
import ReactPlayer from "react-player";

const App = () => {
  const [remoteDescriptionString, setRemoteDescriptionString] = useState("");
  const [message, setMessage] = useState("");

  const {
    localDescription,
    setRemoteDescription,
    localStream,
    remoteStream,
    sendMessage,
  } = useServerlessWebRTC((message) =>
    console.log("Received message:", message)
  );
  return (
    <div className="app">
      <h1>Hello World!</h1>
      <div>
        <button
          disabled={!localDescription}
          onClick={() => {
            localDescription && navigator.clipboard.writeText(localDescription);
          }}
        >
          Copy local description
        </button>
      </div>
      <div>
        <input
          value={remoteDescriptionString}
          onChange={(e) => {
            setRemoteDescriptionString(e.target.value);
          }}
        />
        <button
          onClick={() => {
            if (!remoteDescriptionString) return;

            setRemoteDescription(remoteDescriptionString);
          }}
        >
          Connect
        </button>
      </div>

      <input
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
      />
      <button
        onClick={() => {
          sendMessage(message);
          setMessage("");
        }}
      >
        Send Message
      </button>

      {localStream && <p>Local</p>}
      {localStream && <ReactPlayer url={localStream} controls muted playing />}
      <p>Remote</p>
      {remoteStream && <ReactPlayer url={remoteStream} controls muted />}
    </div>
  );
};

export default App;
