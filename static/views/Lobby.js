import Mframe from "../framework/mframe.js";
import applyColorToCosmonauts from "../applyColorToCosmonauts.js"
export default function Lobby({ usersInRoom, timer, usersColor }) {
  const displayText = timer === 20 ? "Get ready!" : "Game starts in:";
  return (
    <div id="game">
            <div className="timer-container">
        <div className="game-starts-in">{displayText}</div>
        <div className="timer">{timer}</div>
      </div>
      <div className="lobby-grid">
        {usersInRoom.map((item, index) => (
          <div className="lobby-item" key={index}>
            <div className="player-icon">
            <div className="userpic-color" style={applyColorToCosmonauts(usersColor[index])}></div>
            </div>
            <div className="player-name">{item}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
