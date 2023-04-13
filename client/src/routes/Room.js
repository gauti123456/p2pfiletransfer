import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import streamSaver from "streamsaver";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Container, Spinner, Form } from "react-bootstrap";
import { useHistory } from "react-router-dom";

const worker = new Worker("../worker.js");

const Room = (props) => {
  const [connectionEstablished, setConnection] = useState(false);
  const [file, setFile] = useState();
  const [gotFile, setGotFile] = useState(false);
  const history = useHistory();

  const socketRef = useRef();
  const peerRef = useRef();
  const fileNameRef = useRef("");

  const roomID = props.match.params.roomID;

  useEffect(() => {
    socketRef.current = io.connect("/");
    socketRef.current.emit("join room", roomID);
    socketRef.current.on("all users", (users) => {
      peerRef.current = createPeer(users[0], socketRef.current.id);
    });

    socketRef.current.on("user joined", (payload) => {
      peerRef.current = addPeer(payload.signal, payload.callerID);
    });

    socketRef.current.on("receiving returned signal", (payload) => {
      peerRef.current.signal(payload.signal);
      setConnection(true);
    });

    socketRef.current.on("room full", () => {
      alert("room is full");
      history.goBack();
    });
  }, []);

  function createPeer(userToSignal, callerID) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending signal", {
        userToSignal,
        callerID,
        signal,
      });
    });

    peer.on("data", handleReceivingData);

    return peer;
  }

  function addPeer(incomingSignal, callerID) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID });
    });

    peer.on("data", handleReceivingData);

    peer.signal(incomingSignal);
    setConnection(true);
    return peer;
  }

  function handleReceivingData(data) {
    if (data.toString().includes("done")) {
      setGotFile(true);
      const parsed = JSON.parse(data);
      fileNameRef.current = parsed.fileName;
    } else {
      worker.postMessage(data);
    }
  }

  function download() {
    setGotFile(false);
    worker.postMessage("download");
    worker.addEventListener("message", (event) => {
      const stream = event.data.stream();
      const fileStream = streamSaver.createWriteStream(fileNameRef.current);
      stream.pipeTo(fileStream);
    });
  }

  function selectFile(e) {
    setFile(e.target.files[0]);
  }

  function sendFile() {
    const peer = peerRef.current;
    const stream = file.stream();
    console.log(stream);
    const reader = stream.getReader();
    console.log(reader);

    reader.read().then((obj) => {
      handlereading(obj.done, obj.value);
    });

    function handlereading(done, value) {
      if (done) {
        peer.write(JSON.stringify({ done: true, fileName: file.name }));
        return;
      }

      peer.write(value);
      reader.read().then((obj) => {
        handlereading(obj.done, obj.value);
      });
    }
  }

  let copy = () => {
    let text = document.getElementById("text");
    text.select();
    document.execCommand("copy");
  };

  let body;
  if (connectionEstablished) {
    body = (
      <Container className="text-center">
        <br />
        <br />
        <h1>Connected With Peer (You can Share or Transfer Files)</h1>
        <br/><br/>
        <Form>
          <Form.Label>Select the File:</Form.Label>
          <Form.Control
            size="lg"
            onChange={selectFile}
            type="file"
          ></Form.Control>
        </Form>
        <br/>
        <Button onClick={sendFile}>Send file</Button>
      </Container>
    );
  } else {
    body = (
      <Container className="text-center">
        <br />
        <br />
        <br />
        <h1>Waiting for the Peer to Join</h1>
        <br />
        <br />
        <Spinner animation="grow" variant="primary" />
        <Spinner animation="grow" variant="success" />
        <Spinner animation="grow" variant="danger" />
        <br />
        <br />
        <Form>
          <Form.Group>
            <Form.Label>Your Room URL: (Share with Anyone in World)</Form.Label>
            <br />
            <br />
            <Form.Control
              size="lg"
              id="text"
              type="text"
              value={window.location.href}
              readOnly
            />
          </Form.Group>
          <br />
          <Button onClick={copy} variant="primary">
            Copy to Clipboard
          </Button>
        </Form>
      </Container>
    );
  }

  let downloadPrompt;
  if (gotFile) {
    downloadPrompt = (
      <Container className="text-center">
        <br/><br/>
        <h3>
          You have received a file. Would you like to download the file?
        </h3>
        <br/>
        <Button onClick={download}>Yes</Button>
      </Container>
    );
  }

  return (
    <Container>
      {body}
      {downloadPrompt}
    </Container>
  );
};

export default Room;
