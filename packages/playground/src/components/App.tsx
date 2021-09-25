import React from "react";
import { useServerlessWebRTC } from "serverless-webrtc"

const App = () => {

  const {} = useServerlessWebRTC()
  return (
    <div className="app">
      <h1>Hello World!</h1>
      <p>Foo to the barz! Wowwww</p>
    </div>
  );
};

export default App;
