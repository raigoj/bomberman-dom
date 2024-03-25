package game

import (
	"log"
	"time"
)

type Player struct {
	Name     string
	Id       string
	Color    string
	Lives    int
	Location Location
	PBomb    PBomb
	Speed    time.Duration
	Move     PlayerMove
}

type PlayerMove struct {
	Name    string
	Move    Move
	Time    time.Time
	Changed bool
}

const PSpeed = time.Millisecond * 250
const PSpeedDelta = time.Millisecond * 50

// remake move channel for each room? need to make a game struct for each lobby, more than one game should break it.
//var Moves = make(chan PlayerMove)

type Players map[string]*Player

func (pls *Players) PlayerVsBlast(intY, intX int) {
	for _, p := range *pls {
		if int(p.Location.Y) == intY && int(p.Location.X) == intX {
			p.Lives -= 1
		}
	}
}

func SetMove(data *Game) {
	for {
		move := <-data.Moves
		p := data.GameData.Players[move.Name]
		if p.Move.Move == move.Move {
			continue
		}
		p.Move.Move = move.Move
		p.Move.Changed = true
	}
}

func CheckMove(p *Player, data *GameData) bool {
	if !p.Move.Changed || time.Since(p.Move.Time) < p.Speed {
		return false
	}
	x, y := p.Location.X, p.Location.Y
	switch p.Move.Move {
	case Up:
		y -= 1
	case Down:
		y += 1
	case Left:
		x -= 1
	case Right:
		x += 1
	default:
		return false
	}
	if CheckWall(x, y, *data, *p) {
		p.Location.X, p.Location.Y = x, y
		for i, powerUp := range data.PowerUps {
			if p.Location == powerUp.Location {
				getPower(p, powerUp, data, i)
			}
		}
		p.Move.Time = time.Now()
		p.Move.Changed = true
		return true
	} else {
		p.Move.Move = None
		p.Move.Changed = true
		return false
	}
}

func CheckWall(newX, newY int, data GameData, p Player) bool {
	log.Println(newX, newY)
	log.Println("here")
	if data.Map[newY][newX].Status != 2 {
		return false
	}
	for _, bomb := range data.Bombs {
		if !(p.Location.X == bomb.Location.X && p.Location.Y == bomb.Location.Y) && bomb.Location.X == newX && bomb.Location.Y == newY {
			return false
		}
	}
	return true
}
