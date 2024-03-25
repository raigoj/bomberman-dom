package game

import (
	"time"
)

var Games = make(map[string]Game)

type Game struct {
	GameData GameData
	Moves    chan PlayerMove
}

type GameData struct {
	Map      Tiles
	Players  Players
	Bombs    Bombs
	PowerUps PowerUps
}

type Move int

const (
	None Move = iota
	Up
	Down
	Left
	Right
	Space
)

func InitGame(update func(Game, bool), players map[string]*Player, name string) {
	data := Game{
		GameData: GameData{
			Map:     makeMap(),
			Players: players,
		},
		Moves: make(chan PlayerMove),
	}
	Games[name] = data
	go update(data, false)
	go game(update, data)

}

func game(callUpdate func(Game, bool), data Game) {
	go SetMove(&data)
	for {
		pleft := len(data.GameData.Players)
		var update = false
		for _, player := range data.GameData.Players {
			if player.Lives > 0 {
				if CheckMove(player, &data.GameData) {
					update = true
				}
				if player.Move.Move == Space {
					if player.PBomb.Placed >= player.PBomb.Max {
						continue
					}
					loc := Location{
						X: int(player.Location.X),
						Y: int(player.Location.Y),
					}
					data.GameData.Bombs = append(data.GameData.Bombs, Bomb{Location: loc, Player: player.Id, Time: time.Now(), Range: player.PBomb.Range})
					player.PBomb.Placed += 1
					player.Move.Move = None
					update = true
				}
			}
			if player.Lives <= 0 {
				pleft--
			}
		}
		if pleft <= 1 {
			go callUpdate(data, true)
			return
		}
		if data.GameData.Bombs.Trigger(&data.GameData) {
			update = true
		}
		if data.GameData.Map.clearBlast() {
			update = true
		}
		if update {
			go callUpdate(data, false)
		}
		time.Sleep(time.Millisecond * 64)
	}
}
