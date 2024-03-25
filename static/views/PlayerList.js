import Mframe from "../framework/mframe"
import applyColorToCosmonauts from "../applyColorToCosmonauts"

export default function PlayerList({ players }) {
  let elems = Object.values(players).map(player => {
    return (
      <div className="userlist-user">
        <div className="userinfo">
          <div className="pic-and-name">
            <div className="playerlist-userpic">
              <div className="playlist-userpic-color" style={applyColorToCosmonauts(player.Color)}/>
            </div>
          </div>
          <div className="playerlist-lives">
            <div className="lives-count">{player.Lives <= 0 ? 0 : player.Lives}</div>
            <div className="lives-image"></div>
          </div>
        </div>
        <div className="powerups">
          <div className="powerupp">
            <div className="powerup-number">{(300000000 - player.Speed) / 50000000}</div>
            <div className="speedpowerup"></div>
          </div>
          <div className="powerupp">
            <div className="powerup-number">{player.PBomb.Max}</div>
            <div className="bombpowerup"></div>
          </div>
          <div className="powerupp">
            <div className="powerup-number">{player.PBomb.Range}</div>
            <div className="blastpowerup"></div>
          </div>
        </div>
      </div>
    )
  })
  return (
    <div className="playerList">
      {elems}
    </div>
  )
}