import Mframe from "../framework/mframe.js";
import Ws from "../websocket.js";

export default function PreLobby({ username }) {
    let lobbyid
    const quickPlayPressed = () => {
        msg = {
            Mtype: "quickPlayLobby",
            data: {
                username: username
            },
        }
        Ws.send(msg)
    }

    const joinLobbyPressed = () => {
        msg = {
            Mtype: "joinLobby",
            data: {
                username: username,
                lobbyid: lobbyid,
            },
        }
        Ws.send(msg)
    }

    const editLobbyCode = (event) => {
        lobbyid = event.target.value
    }


    return (
        <div id="game">
            <input value="" className="namebox" placeholder="Lobby Code" onInput={(event) => editLobbyCode(event)} />
            <button className="start" onClick={() => quickPlayPressed()}>Quick Play</button>
            <button className="start" onClick={() => joinLobbyPressed()}>Join Lobby </button>
        </div>
    )
}