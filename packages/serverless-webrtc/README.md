# Serverless WebRTC React

## Installation

```
npm install serverless-webrtc-react
yarn add serverless-webrtc-react
pnpm add serverless-webrtc-react
```

## Usage

See the `playground` package for a working example.

```tsx
import React, { useEffect, useState } from "react";
import { useServerlessWebRTC, BaseMessage } from "serverless-webrtc-react";

// Define the messages you will use to communicate between peers.
type Messages = TextMessage | PingMessage;

type TextMessage = BaseMessage<"text-message", { value: string; from: string }>;
type PingMessage = BaseMessage<"ping">;

const App = () => {
  const {
    localDescription,
    setRemoteDescription,
    sendMessage,
    registerEventHandler,
    connectionState,
    isLoading,
  } = useServerlessWebRTC<Messages["type"], Messages>({
    useIceServer: false,
  });

  useEffect(() => {
    registerEventHandler("text-message", (message) => {
      console.log("Received text-message:", message.data);
      addMessage(message.data);
    });
  }, []);

  // ...

  return (
    <button
      onClick={() => {
        const message = { value: messageValue, from: username };
        sendMessage("text-message", message);
      }}
    >
      Send a text-message
    </button>
  )
}
```
