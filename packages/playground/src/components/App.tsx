import React, { useState } from "react";
import { useServerlessWebRTC, BaseMessage } from "serverless-webrtc";
import ReactPlayer from "react-player";

type Messages = TextMessage | PingMessage;

type TextMessage = BaseMessage<"text-message", string>;
type PingMessage = BaseMessage<"ping">;

const App = () => {
  const [remoteDescriptionString, setRemoteDescriptionString] = useState("");
  const [message, setMessage] = useState("");

  const handleMessage = (message: Messages) => {
    if (message.type === "text-message") {
      console.log("Got text-message:", message.data);
    }
    if (message.type === "ping") {
      console.log("Got ping message");
    }
  };
  const {
    localDescription,
    setRemoteDescription,
    localStream,
    remoteStream,
    sendMessage,
  } = useServerlessWebRTC<Messages>(handleMessage);
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

      <div>
        <input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />
        <button
          onClick={() => {
            sendMessage({ type: "text-message", data: message });
            setMessage("");
          }}
        >
          Send Text Message
        </button>
      </div>
      <div>
        <button
          onClick={() => {
            sendMessage({ type: "ping" });
          }}
        >
          Send Ping Message
        </button>
      </div>

      {localStream && <p>Local</p>}
      {localStream && <ReactPlayer url={localStream} controls muted playing />}
      <p>Remote</p>
      {remoteStream && <ReactPlayer url={remoteStream} controls muted />}
    </div>
  );
};

export default App;
