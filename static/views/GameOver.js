import Mframe from "../framework/mframe.js"
import Ws from "../websocket.js"
import { reset } from "./Game.js"
export default function GameOver({gameData, username, setState, setChatId, setMessages}) {
    reset()

    const newGamePressed = () => {
        msg = {
            Mtype: "quickPlayLobby",
            data: {
                username: username
            },
        }
        Ws.send(msg)
    }

    const goToPreLobbyPressed = () => {
        setState("prelobby")
        setChatId("joinedMain")
        setMessages([])
    }
    return <div id="game">
        <button className="start" onClick={() => goToPreLobbyPressed()}>Exit</button>
        <button className="start" onClick={() => newGamePressed()}>New game</button>
        <div className='lobby-grid'>
            {Object.values(gameData).map((item, index) => (
                <div className='lobby-item'>
                    <div className="player-name">{item.Name}</div>
                    <div className={item.Lives > 0 ? "winner" : "loser"}>
                <div
                className={item.Lives > 0 ? "winnercolor" : "losercolor"}
                style={applyColorToCosmonauts(item.Color)}
              ></div>
                </div>
                </div>
            ))}
        </div>
    </div>
}