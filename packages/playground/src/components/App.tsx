import React, { useState } from "react";
import { useServerlessWebRTC } from "serverless-webrtc";
import ReactPlayer from "react-player";

const App = () => {
  const [remoteDescriptionString, setRemoteDescriptionString] = useState("");

  const { localDescription, setRemoteDescription, localStream, remoteStream } =
    useServerlessWebRTC();
  return (
    <div className="app">
      <h1>Hello World!</h1>
      <p>localDescription: {localDescription}</p>
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
      {localStream && <p>Local</p>}
      {localStream && <ReactPlayer url={localStream} controls />}
      <p>Remote</p>
      {remoteStream && <ReactPlayer url={remoteStream} controls />}
    </div>
  );
};

export default App;
