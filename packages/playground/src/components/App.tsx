import React, { useEffect, useState } from "react";
import { useServerlessWebRTC, BaseMessage } from "serverless-webrtc";

type Messages = TextMessage | PingMessage;

type TextMessage = BaseMessage<"text-message", string>;
type PingMessage = BaseMessage<"ping">;

const App = () => {
  const [remoteDescriptionString, setRemoteDescriptionString] = useState("");
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<string[]>([]);

  const addMessage = (newMessage: string) => {
    setMessages((prev) => [...prev, newMessage]);
  };

  const {
    localDescription,
    setRemoteDescription,
    sendMessage,
    registerEventHandler,
    connectionState,
    isLoading,
  } = useServerlessWebRTC<Messages["type"], Messages>({
    useIceServer: true
  });

  useEffect(() => {
    registerEventHandler("text-message", (message) => {
      console.log("Received text-message:", message.data);
      addMessage(message.data);
    });
    registerEventHandler("ping", () => {
      console.log("Received ping-message.");
    });
  }, []);

  const getMessage = () => {
    if (connectionState === "initial") {
      return "To start a call, copy the local description and send it to a friend. To answer a call, take your friend's description, paste it into the connect box and press connect.";
    }

    if (connectionState === "waitingForRemoteDescription") {
      return "Now get your friend to send you their local description. Paste it into the connect box and press connect.";
    }

    if (connectionState === "needToSendLocalDescription") {
      return "Now copy your local description and send it to your friend.";
    }

    if (connectionState === "connected") {
      return "You are now connected, try sending each other a message!";
    }

    if (connectionState === "disconnected") {
      return "Something's gone wrong and you are disconnected. Try refreshing the page and starting the connection process again.";
    }

    return undefined;
  };

  return (
    <div className="app">
      <div>
        {isLoading && <div>Loading...</div>}
        <div>{getMessage()}</div>
      </div>
      {(connectionState === "initial" ||
        connectionState === "needToSendLocalDescription") && (
        <div>
          <button
            disabled={isLoading}
            onClick={() => {
              !isLoading &&
                localDescription &&
                navigator.clipboard.writeText(localDescription);
            }}
          >
            Copy local description
          </button>
        </div>
      )}
      {(connectionState === "initial" ||
        connectionState === "waitingForRemoteDescription") && (
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
      )}

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
            addMessage(message);
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
      <div>
        <p>Messages</p>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
