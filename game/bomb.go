package game

import (
	"log"
	"time"
)

type Bombs []Bomb

type Bomb struct {
	Player   string
	Location Location
	Time     time.Time
	Range    int
}

type PBomb struct {
	Placed int
	Range  int
	Max    int
}

func (bs *Bombs) Trigger(data *GameData) bool {
	pTime := time.Now()
	bombs := Bombs{}
	boom := false
	for _, bomb := range *bs {
		elapsed := pTime.Sub(bomb.Time)
		if elapsed > time.Second*3 {
			boom = true
			tiles := tilesBombed(data, bomb)
			for _, tile := range tiles {
				tile.blast()
			}
			data.Players[bomb.Player].PBomb.Placed -= 1
			continue
		}
		bombs = append(bombs, bomb)
	}
	*bs = bombs
	return boom
}

func tilesBombed(data *GameData, bomb Bomb) []*Tile {
	y := bomb.Location.Y
	x := bomb.Location.X
	compass := [4]bool{true, true, true, true}
	var time []*Tile
	time = append(time, &data.Map[y][x])
	data.Players.PlayerVsBlast(y, x)
	for i := 1; i <= bomb.Range; i++ {
		for j, way := range compass {
			dx, dy := i, i
			if j%2 == 0 {
				dx = 0
				if j == 2 {
					dy *= -1
				}
			} else {
				dy = 0
				if j == 3 {
					dx *= -1
				}
			}
			compass[j], time = checkCompass(x+dx, y+dy, data, way, time)
		}
	}
	return time
}

func checkCompass(x, y int, data *GameData, state bool, tiles []*Tile) (bool, []*Tile) {
	log.Println(x, y)
	fin := state
	if state {
		fin, tiles = pushSqr(tiles, &data.Map[y][x])
		data.Players.PlayerVsBlast(y, x)
		if data.Map[y][x].Status == 1 {
			spawnPower(y, x, data)
		}
	}
	return fin, tiles
}

func pushSqr(tiles []*Tile, tile *Tile) (bool, []*Tile) {
	tiles = append(tiles, tile)
	if tile.Status != 2 {
		return false, tiles
	}
	return true, tiles
}
