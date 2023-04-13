import React from "react";
import { v1 as uuid } from "uuid";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button,Container } from 'react-bootstrap';

const CreateRoom = (props) => {
    function create() {
        const id = uuid();
        props.history.push(`/p2p/room/${id}`);
    }

    return (
        <Container className="text-center">
        <br/><br/>
        <h1>P2P File Transfer</h1>
        <br/><br/>
        <Button className="btn btn-danger" onClick={create}>Create room</Button>
        </Container>
    );
};

export default CreateRoom;
