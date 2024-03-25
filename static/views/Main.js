import Mframe from "../framework/mframe.js"
import Ws from "../websocket.js"

export default function Main({ state, setState, setUsername }) {
  let username = ""
  function editUsername(event) {
    username = event.target.value
  }
  function startPressed() {
    if (username.length < 1) {
      alert("Please enter a username")
      return
    }
    msg = {
      Mtype: "enteruname",
      data: {
        username: username,
        color: document.querySelector('.color-code').value
      },
    }
    Ws.send(msg)
    setState("prelobby")
    setUsername(username)
  }
  function generateRandomColor() {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return randomColor.padStart(6, '0').toUpperCase();
  }
  let a = "#" + generateRandomColor()
  return (
    <div id="game">
      <input className="namebox" placeholder="Enter username" onInput={(event) => editUsername(event)} />
      <button className="start" onClick={() => startPressed()}>Start Game</button>
      <input className="color-code" type="color" placeholder="Enter lobby code" value={"#" + generateRandomColor()}></input>
    </div>
  )
}