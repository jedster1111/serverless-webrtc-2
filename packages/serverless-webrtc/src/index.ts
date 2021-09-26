import { useState, useEffect } from "react";

export type BaseMessage<
  T extends string = string,
  D = undefined
> = D extends undefined ? MessageWithoutData<T> : MessageWithData<T, D>;

type MessageWithData<T extends string, D> = {
  type: T;
  data: D;
};

type MessageWithoutData<T extends string> = {
  type: T;
};

const defaultRTCConfig: RTCConfiguration = {
  iceServers: [],
};

export const useServerlessWebRTC = <Message extends BaseMessage<string, any>>(
  onMessage: (message: Message) => void
) => {
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>();
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [remoteStream, setRemoteStream] = useState<MediaStream>();
  const [textDataChannel, setTextDataChannel] = useState<RTCDataChannel>();
  const [isIceGatheringComplete, setIsIceGatheringComplete] = useState(false);
  const [localDescription, setLocalDescription] =
    useState<RTCSessionDescription>();

  useEffect(() => {
    const setup = async () => {
      const peerConnection = new RTCPeerConnection(defaultRTCConfig);
      const localMediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      setPeerConnection(peerConnection);
      setLocalStream(localMediaStream);
    };

    setup();
  }, []);

  useEffect(() => {
    if (!peerConnection || !localStream) return;

    for (const track of localStream.getTracks()) {
      console.log("Adding local tracks", track);
      peerConnection.addTrack(track, localStream);
    }

    peerConnection.ontrack = ({ track, streams }) => {
      console.log("Received remote track!", track.id);
      track.onunmute = () => {
        console.log("Track unmuted!", track.id);
        if (remoteStream) return;

        console.log("Use this stream in state!", track.id);
        setRemoteStream(streams[0]);
      };
    };

    peerConnection.onnegotiationneeded = async () => {
      console.log("On negotiation needed! Setting local description.");
      await peerConnection.setLocalDescription();
    };

    peerConnection.onicecandidate = ({ candidate }) => {
      console.log("Received Ice Candidate");

      if (candidate === null) {
        console.log("Received null candidate");
      }
    };

    peerConnection.onicegatheringstatechange = () => {
      const iceGatheringState = peerConnection.iceGatheringState;
      if (iceGatheringState === "new" || iceGatheringState === "gathering") {
        console.log("Ice gathering in progress.", iceGatheringState);
        setIsIceGatheringComplete(false);
      } else if (iceGatheringState === "complete") {
        console.log("Ice gathering complete");
        setIsIceGatheringComplete(true);
        setLocalDescription(peerConnection.localDescription || undefined);
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const connectionState = peerConnection.connectionState;
      if (connectionState === "disconnected") {
        setRemoteStream(undefined);
      }
    };

    const dataChannel = peerConnection.createDataChannel("text", {
      negotiated: true,
      id: 0,
    });

    setTextDataChannel(dataChannel);

    dataChannel.onopen = (event) => {
      console.log("Opened 'text' data channel.", event);
    };

    dataChannel.onmessage = (event) => {
      let message: Message | undefined;
      try {
        message = JSON.parse(event.data);
      } catch (error) {
        console.error("Could not parse message as JSON:", event.data);
      }

      if (!message) {
        console.error("A message was not provided.");
        return;
      }

      if (!message.type) {
        console.error("The message did not contain a type");
        return;
      }

      onMessage(message);
    };
  }, [peerConnection, localStream]);

  const setRemoteDescription = async (remoteDescriptionString: string) => {
    if (!peerConnection)
      throw new Error(
        "Tried to set remote description before Peer Connection was created."
      );

    const remoteDescription = JSON.parse(
      remoteDescriptionString
    ) as RTCSessionDescription;

    await peerConnection.setRemoteDescription(remoteDescription);

    if (remoteDescription.type === "offer") {
      setLocalDescription(undefined);
      await peerConnection.setLocalDescription();
      setLocalDescription(peerConnection.localDescription || undefined);
    }
  };

  const sendMessage = (message: Message) => {
    if (!textDataChannel) return;

    console.log("Sending message:", message);
    textDataChannel.send(JSON.stringify(message));
  };

  return {
    localDescription:
      isIceGatheringComplete && localDescription
        ? JSON.stringify(localDescription)
        : undefined,
    setRemoteDescription,
    localStream,
    remoteStream,
    sendMessage,
  };
};
