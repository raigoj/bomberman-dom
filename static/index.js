import Ws from "./websocket.js";
import Mframe from "./framework/mframe.js";
import Chat from "./views/Chat.js";
import Main from "./views/Main.js";
import PreLobby from "./views/PreLobby.js";
import Lobby from "./views/Lobby.js";
import Game from "./views/Game.js";
import PlayerList from "./views/PlayerList.js";
import GameOver from "./views/GameOver.js";
import { connection } from "./websocket.js";

let gameStared = false;

var lmusic = document.getElementById("lobby")
var mmusic = document.getElementById("main")
var gmusic = document.getElementById("game")
function initGame() {
  document.addEventListener("keydown", (e) => {
    let move;
    switch (e.code) {
      case "ArrowUp":
        move = 1;
        break;
      case "ArrowDown":
        move = 2;
        break;
      case "ArrowLeft":
        move = 3;
        break;
      case "ArrowRight":
        move = 4;
        break;
      case "Space":
        move = 5;
        break;
      default:
        return;
    }
    e.preventDefault();
    Ws.send({ Mtype: "move", data: { move: move } });
  });
  document.addEventListener("keyup", (e) => {
    switch (e.code) {
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
        break;
      default:
        return;
    }
    e.preventDefault();
    Ws.send({ Mtype: "move", data: { move: 0 } });
  });
}

Ws.connect("main");
const filterContainer = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "svg"
);
filterContainer.style.width = "0";
filterContainer.style.height = "0";
filterContainer.id = "filtrid";
document.body.append(filterContainer);
function App() {
  const [state, setState] = Mframe.useState("main");
  const [messages, setMessages] = Mframe.useState([]);
  const [username, setUsername] = Mframe.useState("");
  const [chatId, setChatId] = Mframe.useState("main");
  const [usersInRoom, setUsersInRoom] = Mframe.useState([]);
  const [gameState, setGameState] = Mframe.useState({});
  const [timer, setTimer] = Mframe.useState(20);
  const [usersColor, setUsersColor] = Mframe.useState([]);

  connection.onmessage = async function (evt) {
    let obj = JSON.parse(evt.data);

    //console.log("Frontend WS'sse tulev s6num: ", obj);

    switch (obj.Mtype) {
      case "chat":
        setMessages((prevMessages) => [...prevMessages, obj.data]);
        break;
      case "lobby":
        if (obj.username === username) {
          setState("lobby");
          setChatId("joinedLobby");
          setMessages([]);
        }
        setUsersInRoom(obj.Users);
        setUsersColor(obj.Colors);
        break;
      case "update":
        if (!gameStared) {
          initGame();
          gameStared = true;
        }
        setGameState(obj.data);
        setState("game");
        break;
      case "over":
        gameStared = false;
        setState("gameover");
        setTimer(20);
        break;
      case "change":
        setUsersInRoom(obj.Users)
        setTimer(20);
        break;
      case "few":
        setUsersInRoom(obj.Users)
        setTimer(20);
        break;
      default:
        setTimer(obj.time);
        break;
    }
  };

  switch (state) {
    case "main":
      lmusic.pause();
      lmusic.currentTime = 0;
      gmusic.pause();
      gmusic.currentTime = 0;
      mmusic.play()
      return (
        <div id="test">
          <Main
            state={state}
            setState={setState}
            setUsername={setUsername}
          ></Main>
          <Chat
            messages={messages}
            setMessages={setMessages}
            chatId={chatId}
          ></Chat>
        </div>
      );
    case "prelobby":
      lmusic.pause();
      lmusic.currentTime = 0;
      gmusic.pause();
      gmusic.currentTime = 0;
      mmusic.play()
      return (
        <div id="test">
          <PreLobby username={username}></PreLobby>
          <Chat
            messages={messages}
            setMessages={setMessages}
            username={username}
            chatId={chatId}
          ></Chat>
        </div>
      );
    case "lobby":
      gmusic.pause();
      gmusic.currentTime = 0;
      mmusic.pause();
      mmusic.currentTime = 0;
      lmusic.play()
      return (
        <div id="test">
          <Lobby
            usersInRoom={usersInRoom}
            timer={timer}
            usersColor={usersColor}
          ></Lobby>
          <Chat
            messages={messages}
            setMessages={setMessages}
            username={username}
            chatId={chatId}
          ></Chat>
        </div>
      );
    case "game":
      lmusic.pause();
      lmusic.currentTime = 0;
      mmusic.pause();
      mmusic.currentTime = 0;
      gmusic.play()
      return (
        <div id="test">
          <div className="flexime">
            <PlayerList
              className="playerlistdisplay"
              players={gameState.Players}
              usersColor={usersColor}
            />
            <Game gamestate={gameState}></Game>
          </div>
          <Chat
            messages={messages}
            setMessages={setMessages}
            username={username}
            chatId={chatId}
          ></Chat>
        </div>
      );
    case "gameover":
      lmusic.pause();
      lmusic.currentTime = 0;
      gmusic.pause();
      gmusic.currentTime = 0;
      mmusic.play()
      return (
        <div id="test">
          <GameOver
            gameData={gameState.Players}
            username={username}
            setState={setState}
            setChatId={setChatId}
            setMessages={setMessages}
          ></GameOver>
          <Chat
            messages={messages}
            setMessages={setMessages}
            username={username}
            chatId={chatId}
          ></Chat>
        </div>
      );
  }
}

let app = document.getElementById("app");
Mframe.render(Mframe.createElement(App, null), app);
