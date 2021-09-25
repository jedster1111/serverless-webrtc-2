import { useState, useEffect } from "react";

const defaultRTCConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

async function getLocalStream() {
  return await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
}

export const useServerlessWebRTC = () => {
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>();
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream>();
  const [remoteStream, setRemoteStream] = useState<MediaStream>();
  const [isIceGatheringComplete, setIsIceGatheringComplete] =
    useState(false);
  const [localDescription, setLocalDescription] =
    useState<RTCSessionDescription>();

  useEffect(() => {
    const setup = async () => {
      const peerConnection = new RTCPeerConnection(defaultRTCConfig);
      const localMediaStream = await getLocalStream();

      setPeerConnection(peerConnection);
      setLocalMediaStream(localMediaStream);
    };

    setup();
  }, []);

  useEffect(() => {
    if (!peerConnection || !localMediaStream) return;

    for (const track of localMediaStream.getTracks()) {
      peerConnection.addTrack(track, localMediaStream);
    }

    peerConnection.ontrack = ({ track, streams }) => {
      track.onunmute = () => {
        if (remoteStream) return;

        setRemoteStream(streams[0]);
      };
    };

    peerConnection.onnegotiationneeded = async () => {
      console.log("On negotiation needed! Setting local description.");
      await peerConnection.setLocalDescription();
    };

    peerConnection.onicecandidate = ({ candidate }) => {
      console.log("On ice candidate:", candidate?.toJSON());

      if (candidate === null) {
        // At this point ICE candidate collection has completed
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
  }, [peerConnection, localMediaStream]);

  const setRemoteDescription = async (
    remoteDescription: RTCSessionDescription
  ) => {
    if (!peerConnection)
      throw new Error(
        "Tried to set remote description before Peer Connection was created."
      );

    await peerConnection.setRemoteDescription(remoteDescription);

    if (remoteDescription.type === "offer") {
      await peerConnection.setLocalDescription();
      setLocalDescription(peerConnection.localDescription || undefined);
    }
  };

  return {
    isIceGatheringComplete,
    localDescription,
    setRemoteDescription
  }
};
