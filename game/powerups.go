package game

import (
	"time"

	"golang.org/x/exp/rand"
)

type PowerUps []PowerUp

type PowerUp struct {
	Location Location
	Type     int
}

func spawnPower(y int, x int, data *GameData) {
	if rand.Float64() < 0.3 {
		rand.NewSource(uint64(time.Now().UnixNano()))
		newPower := PowerUp{
			Location: Location{x, y},
			Type:     rand.Intn(3),
		}
		data.PowerUps = append(data.PowerUps, newPower)
	}

}

func getPower(p *Player, powerUp PowerUp, data *GameData, x int) {
	switch powerUp.Type {
	case 0:
		p.PBomb.Range += 1
	case 1:
		p.PBomb.Max += 1
	case 2:
		p.Speed -= PSpeedDelta
	}
	data.PowerUps = append(data.PowerUps[:x], data.PowerUps[x+1:]...)
}
