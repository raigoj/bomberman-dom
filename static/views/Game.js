import Mframe from "../framework/mframe.js";
class Players {
  constructor(playerName, x, y) {
    this.playerName = playerName;
    this.coordinates = { x: x, y: y };
    this.diditmove = false
    this.moved = "down"
  }

  move(newX, newY) {
    if (this.coordinates.x !== newX || this.coordinates.y !== newY) {
      this.diditmove = true
      if (this.coordinates.x > newX) {
        this.moved = "left"
      } else if (this.coordinates.x < newX) {
        this.moved = "right"
      } else if (this.coordinates.y > newY) {
        this.moved = "up"
      } else {
        this.moved = "down"
      }
      this.coordinates.x = newX;
      this.coordinates.y = newY;
    } else {
      this.diditmove = false
    } 
    return this.moved
  }
}

// Example usage:
let prevstate = [];
export function reset() {
  prevstate = []
}

export default function Game({ gamestate }) {
  let boo = false
  if (prevstate.length === 0) {
    boo = true
  }
  // PLAYERS
  let playerElems = Object.values(gamestate.Players).map((player) => {
    if (boo) {
      prevstate.push(new Players(player.Name, player.Location.X, player.Location.Y))
    }
    const playa = prevstate.find((p) => p.playerName === player.Name)
    let move = playa.move(player.Location.X, player.Location.Y)
    return <Player player={player} move={move} diditmove={playa.diditmove}/>;
  });

  function Player({ player, move, diditmove }) {
    console.log("player: ", player)
    if (player.Lives <= 0) {
      return <div></div>
    }
    let pY = (player.Location.Y * 50 - 650).toString();
    let pX = (player.Location.X * 50).toString();
    let n = 0.64;
    let i = 0;
    let j = 3;
    switch (move) {
      case "down":
        i = 0
        j = 3
        break
      case "up":
        i = 0
        j = 4
        break
      case "left":
        i = 0
        j = 0
        break
      case "right":
        i = 0
        j = 2
        break
      default:
    }
    let playerStyle = {
      transform: `translate(${pX}px, ${pY}px)`,
      display: 'inline-block',
      height: `calc(32px / ${n})`,
      width: `calc(32px / ${n})`,
      backgroundPosition: `calc(${i} / ${n} * 32px) calc(${j} / ${n} * 32px)`,
      backgroundSize: `calc(128px / ${n}) calc(160px / ${n})`,
    }
    let playerStyle2 = {
      display: 'inline-block',
      height: `calc(32px / ${n})`,
      width: `calc(32px / ${n})`,
      backgroundPosition: `calc(${i} / ${n} * 32px) calc(${j} / ${n} * 32px)`,
      backgroundSize: `calc(128px / ${n}) calc(160px / ${n})`,
    };
    let playerColorStyle = applyColorToCosmonauts(player.Color);
    return <div className="player" style={playerStyle}><div className="playergamecolor" style={{ ...playerStyle2, ...playerColorStyle }}/></div>;
  }

  // BOMBS
  let bombElems = gamestate.Bombs?.map((bomb, i) => {
    return <Bomb bomb={bomb} />;
  });

  function Bomb({ bomb }) {
    let BombStyle = {
      position: "absolute",
      top: (bomb.Location.Y * 50).toString() + "px",
      left: (bomb.Location.X * 50 + 208.933).toString() + "px",
    };
    return <div className="bomb" style={BombStyle}></div>;
  }

  // POWERUPS
  let powerElems = gamestate.PowerUps?.map((power, i) => {
    return <Power power={power} />;
  });

  function Power({ power }) {
    let PowerStyle = {
      position: "absolute",
      width: 50,
      height: 50,
      zIndex: 1,
      top: (power.Location.Y * 50).toString() + "px",
      left: (power.Location.X * 50 + 208.933).toString() + "px",
    };
    return (
      <div
        className={
          power.Type === 0
            ? "powerFlames"
            : power.Type === 1
            ? "powerBombsNum"
            : "powerSpeed"
        }
        style={PowerStyle}
      ></div>
    );
  }

  //MAP
  const mapElements = [];
  let mapRow = [];
  for (let i = 0; i < gamestate.Map.length; i++) {
    const row = gamestate.Map[i];
    for (let j = 0; j < row.length; j++) {
      const square = row[j];
      const squareElement = (
        <div
          className={
            square.Status === 0
              ? "wall"
              : square.Boom === true
              ? "blast"
              : square.Status === 1
              ? "breakable"
              : "grass"
          }
        ></div>
      );
      mapRow.push(squareElement);
    }
    mapElements.push(<div className="row">{mapRow}</div>);
    mapRow = [];
  }
  return (
    <div id="map">
      {mapElements}
      {playerElems}
      {bombElems}
      {powerElems}
    </div>
  );
}
