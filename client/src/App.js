import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./routes/CreateRoom";
import Room from "./routes/Room";

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/p2p" exact component={CreateRoom} />
        <Route path="/p2p/room/:roomID" component={Room} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
