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

      {localStream && <p>Local</p>}
      {localStream && <ReactPlayer url={localStream} controls />}
      <p>Remote</p>
      {remoteStream && <ReactPlayer url={remoteStream} controls />}
    </div>
  );
};

export default App;
