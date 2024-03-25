package game

import (
	"math/rand"
	"time"
)

type Tile struct {
	Status int
	Boom   bool
	Time   time.Time
}

type Location struct {
	X int
	Y int
}

type Tiles [13][15]Tile

func (tile *Tile) blast() {
	if tile.Status == 1 {
		tile.Status = 2
	}
	tile.Boom = true
	tile.Time = time.Now()
}

func (tiles *Tiles) clearBlast() bool {
	removed := false
	for x, a := range tiles {
		for y, b := range a {
			if b.Boom && time.Since(b.Time) > time.Second {
				removed = true
				tiles[x][y].Boom = false
			}
		}
	}
	return removed
}

func makeMap() Tiles {
	rand.NewSource(time.Now().UnixNano())
	var tiles Tiles
	for i := 0; i < len(tiles); i++ {
		for j := 0; j < len(tiles[i]); j++ {
			if i == 0 || i == len(tiles)-1 || j == 0 || j == len(tiles[i])-1 || (i%2 == 0 && j%2 == 0) {
				tiles[i][j].Status = 0
			} else {
				if (i <= 2 && j <= 2) || (i <= 2 && j >= len(tiles[i])-3) || (i >= len(tiles)-3 && j <= 2) || (i >= len(tiles)-3 && j >= len(tiles[i])-3) {
					tiles[i][j].Status = 2
				} else if rand.Float64() < 0.8 {
					tiles[i][j].Status = 1
				} else {
					tiles[i][j].Status = 2
				}
			}
		}
	}
	return tiles
}
