import { reactive } from "vue"

//Constants
const rows = 6
const columns = 6
const maxRowWall = (rows * 2) + 1
const maxColumnWall = (columns * 2) + 1
const maxHistory = 12
const maxHealth = 6
const spawnMonster2Threshold = 18
const victoryScore = 36
const nullTile = [0, 0]
const monsterStartingHistory = [nullTile, nullTile, nullTile, nullTile, nullTile, nullTile, nullTile, nullTile, nullTile, nullTile, nullTile, nullTile]

function generateGoal(maze) {
  const {score, possible_goals} = maze
  if (score === victoryScore) {
    return maze
  }

  const index = parseInt(Math.random() * possible_goals.length)
  const newPG = possible_goals[index]
  possible_goals.splice(index, 1)
  maze["goal"] = newPG
  const existingTile = maze["tiles"][newPG]
  const [eentity, egoal, ewalls, etiles] = existingTile
  maze["tiles"][newPG] = [eentity, "goal", ewalls, etiles]
}

function spawnMonster(maze) {
  const {player, tiles, monsters} = maze

  const [px, py, _phealth] = player
  let monsterKey
  if (px <= 3 && py <= 3) {
    monsterKey = [6, 6]
  } else {
    monsterKey = [1, 1]
  }

  const monsterID = Object.keys(monsters).length === 0 ? 1 : 2
  const [mx, my] = monsterKey
  const monster = [mx, my, monsterID, monsterStartingHistory.concat([monsterKey])]
  const eTile = tiles[monsterKey]
  const [_eentity, egoal, etiles, ewalls] = eTile
  const newTile = [monsterID, egoal, etiles, ewalls]
  maze["tiles"][monsterKey] = newTile
  monsters.push(monster)
}

  function constructMaze() {
    const maze = {tiles: {}, walls: {}, possible_goals: [], events: [], player: [2, 2, 6], monsters: [],
  shield: "none", score: 0, goal: [0,0]}
    constructWallsAndTiles(maze)
    window.maze = maze
    generateGoal(maze)
    spawnMonster(maze)
    return maze
  }

  function constructWallsAndTiles(maze) {
    for (let y = 1; y <= columns; y++) {
      for (let x = 1; x <= rows; x++) {
        constructTile(maze, x, y)
      }
    }
    window.walls = maze["walls"]
  }

  function connectedTileKeys(x, y, maxX, maxY) {
    let vertical
    if (y === 0) {
      vertical = [[x, y + 1]]
    } else if (y === maxY) {
      vertical = [[x, y - 1]]
    } else {
      vertical = [[x, y - 1], [x, y + 1]]
    }

    let horizontal
    if (x === 0) {
      horizontal = [[x + 1, y]]
    } else if (x === maxX) {
      horizontal = [[x - 1, y]]
    } else {
      horizontal = [[x - 1, y], [x + 1, y]]
    }
    return vertical.concat(horizontal)
  }

  function connectedWallKeys(column, row) {
    return [                 
      [column * 2, (row * 2) - 1],   
      [(column * 2) + 1, row * 2],
      [column * 2, (row * 2) + 1],
      [(column * 2) - 1, row * 2]
    ]
  }

  function constructWalls(wallKeys, maze) {
    for (let wallKey of wallKeys) {
      let newWall
      const [wallX, wallY] = wallKey
      if (wallX === 1 || wallX === maxRowWall || wallY === 1 || wallY === maxColumnWall) {
        newWall = "solid"
      } else {
        newWall = "open"
      }
      maze["walls"][wallKey] = newWall
    }
  }

  function constructTile(maze, x, y) {
    const tileKey = [x, y]
    const tileKeysConnected = connectedTileKeys(x, y, rows, columns) //VALID
    const wallKeysConnected = connectedWallKeys(x, y)
    const tile = ["open", "open", tileKeysConnected, wallKeysConnected]
    maze["tiles"][tileKey] = tile
    constructWalls(wallKeysConnected, maze)
    maze["possible_goals"].push(tileKey)
  }

  // const myTileTest = connectedTileKeys(2, 1, 6, 6)
  // console.log("MY BISCUIT TIILE TEST", myTileTest)
  // const myWallTest = connectedWallKeys(2, 1)
  // console.log("MY BISCUIT WALL TEST", myWallTest)

function relevantWallKey(walls, direction) {
  const [north, east, south, west] = walls
  if (direction === "north") {
    return north
  } else if (direction === "east") {
    return east
  } else if (direction === "south") {
    return south
  } else if (direction === "west") {
    return west
  }
}

function moveableThroughWall(wall) {
  if (wall === "open") {
    return true
  } else if (wall == "sand") {
    return true
  }

  return false
}

function targetTile(x, y, direction) {
  if (direction == "north") {
    return [x, y - 1]
  } else if (direction === "east") {
    return [x + 1, y]
  } else if (direction === "south") {
    return [x, y + 1]
  } else if (direction === "west") {
    return [x - 1, y]
  }
}

function areAllStoneWalls(wallIDsToCheck, walls) {
  for (let wid of wallIDsToCheck) {
    const w = walls[wid]
    if (w != "stone" && w != "solid") {
      return false
    } else {
      // console.log("That is not a stone or solid wall.", w)
    }
  }
  return true
}

function crumble(newWallState, wallIDs, walls) {
  for (let wid of wallIDs) {
    const [x, y] = wid
    if (x === 1 || x === maxColumnWall || y === 1 || y === maxRowWall) {
      //do nothing
    } else {
      walls[wid] = newWallState
    }
  }
}

function morphWalls(maze, translationWallID, targetTileKey, targetTile, originTileKey, originTile) {
  morph(maze, translationWallID, targetTileKey, targetTile, false)
  morph(maze, translationWallID, originTileKey, originTile, true)
}

function morph(maze, translationWallID, targetTileKey, targetTile, skipTranslationWall) {
  const {walls, tiles} = maze
  const wall = walls[translationWallID]
  let newTranslatedWall
  if (skipTranslationWall) {
    newTranslatedWall = wall
  } else {
    if (wall === "open") {
      newTranslatedWall = "sand"
    } else if (wall === "sand") {
      newTranslatedWall = "stone"
    }
  }

  const [_e, _i, _t, tileConnectedWalls] = targetTile
  const [translationX, translationY] = translationWallID
  const otherWallIDsToCheck = tileConnectedWalls.filter( (wk) => {
    const [wx, wy] = wk
    return (wx != translationX) || (wy != translationY)
  })

  const otherWallsStone = areAllStoneWalls(otherWallIDsToCheck, walls)
  if (otherWallsStone) {
    if (skipTranslationWall) {
      if (wall === "stone") {
        crumble("open", otherWallIDsToCheck, walls)
      }
    } else if (wall === "sand" || wall === "open") {
      crumble("open", otherWallIDsToCheck, walls)
    }
  }

  walls[translationWallID] = newTranslatedWall
  // console.log(walls[translationWallID], "the wall updated")
  
}


function movePlayer(translationWallID, player, originTile, originTileKey, targetTileKey, targetTile, maze) {
  const {tiles} = maze
  const [_x, _y, phealth] = player
  const [x, y] = targetTileKey
  const newPlayer = [x, y, phealth]
  const [_e, item, connectedTiles, connectedWalls] = originTile
  const newOriginTile = ["open", item, connectedTiles, connectedWalls]

  const [_te, tItem, tConnectedTiles, tConnectedWalls] = targetTile
  const newTargetTile = ["player", tItem, tConnectedTiles, tConnectedWalls]

  morphWalls(maze, translationWallID, targetTileKey, newTargetTile, originTileKey, newOriginTile)
  maze["player"] = newPlayer
}

function evaluateMovement(direction, player, x, y, maze) {
  const {tiles, walls} = maze
  const originKey = [x, y]
  const originTile = tiles[originKey]
  const [_e, _g, adjacentTiles, connectedWalls] = originTile
  const directionWallKey = relevantWallKey(connectedWalls, direction)
  const wall = walls[directionWallKey]

  if (moveableThroughWall(wall)) {
    const targetTileKey = getTargetTile(x, y, direction)
    const targetTile = tiles[targetTileKey]
    if (!targetTile) {
      return false
    }

    movePlayer(directionWallKey, player, originTile, originKey, targetTileKey, targetTile, maze, direction);


    return true
  } else {
    return false
  }
}

function getTargetTile(x, y, direction) {
  if (direction === "north") {
    return [x, y - 1]
  } else if (direction === "east") {
    return [x + 1, y]
  } else if (direction === "south") {
    return [x, y + 1]
  } else if (direction === "west") {
    return [x - 1, y]
  }
}

export function getGame() {
  const state = reactive({payload: constructMaze()})

  const channel = {
    push(_msg, {input, code}) {
      if (input) {
        const updatedMaze = playerInput(input, state.payload)
        state.payload = updatedMaze
      }
    }
  }

  return { channel, state }
}

function evaluateItemCollection(maze) {
  const {player, goal, score} = maze
  const [px, py, ph] = player
  const [gx, gy] = goal
  if (px == gx && py == gy) {
    maze["score"] = score + 1
    maze["player"] = [px, py, Math.min(ph + 1, maxHealth)]
    generateGoal(maze)
  }
}

function adjacentAccessibleTiles(tileKey, connectedWalls, walls) {
  const [n, e, s, w] = connectedWalls
  const north = adjacentAccessibleTile(n, walls, tileKey, "north")
  const east  = adjacentAccessibleTile(e, walls, tileKey, "east")
  const south = adjacentAccessibleTile(s, walls, tileKey, "south")
  const west  = adjacentAccessibleTile(w, walls, tileKey, "west")
  return north.concat(east).concat(south).concat(west)
}

function adjacentAccessibleTile(wallID, walls, originTileKey, direction) {
  const wall = walls[wallID]
  const accessible = wall === "open" || wall === "sand"
  if (accessible) {
    // console.log(direction, "direction")
    const [x, y] = originTileKey
    const adjacentTileKey = offsetTile(x, y, direction)
    if (validTileKey(adjacentTileKey)) {
      return [adjacentTileKey]
    } else {
      return []
    }
  } else {
    return []
  }
}

function validTileKey(tileKey) {
  const [x, y] = tileKey
  return (x > 0 && y > 0 && x <= 6 && y <= 6)
}

// adjacentAccessibleTile(WallID, Walls, OriginTileKey, Direction) ->
//   Accessible = case s:mg(Walls, WallID) of
//     empty -> true;
//     sand -> true;
//     _ -> false
//   end,
//   case Accessible of
//     false -> [];
//     true ->
//       AdjacentTileKey = offset(OriginTileKey, Direction),
//       case validTileKey(AdjacentTileKey) of
//         false -> [];
//         true -> [AdjacentTileKey]
//       end
//   end.

function loopMonsters(maze) {
  const {monsters, tiles, player, walls } = maze
  const [px, py, _ph] = player
  for (const m of monsters) {
    const [mx, my, monsterID, history] = m
    const tileKey = [mx, my]
    const tile = tiles[tileKey]
    const [_e, _i, connectedTiles, connectedWalls] = tile
    // attempt LOS Shooting
    if (reachableTarget(mx, my, px, py, maze)) {
      shootPlayer(mx, my, maze)
    } else {
      // console.log("Not reachable biscuit")
    }
    //attempt to move
    // % Attempt Move
    const possibleTiles = adjacentAccessibleTiles(tileKey, connectedWalls, walls)
    // console.log(possibleTiles, "Biscuit 5") // TODO
    const idealTiles = subtract(possibleTiles, history)
    // console.log(idealTiles, "ideal tiles")
    let newTargetTileKey
    let history2
    // console.log("Reading length")
    if (idealTiles.length === 0) {
      //pick a new tile and assign new monster history
      const index = parseInt(Math.random() * possibleTiles.length)
      newTargetTileKey = possibleTiles[index]
      history2 = monsterStartingHistory.concat([tileKey])
      // console.log("RESET HISTORY SUPER BISCUIT")
    } else {
      //pick a new random tile from ideal tiles and use same history
      const index = parseInt(Math.random() * idealTiles.length)
      newTargetTileKey = idealTiles[index]
      history2 = history
    }
    moveMonster(tileKey, newTargetTileKey, history2, tile, m, maze);
  }
}

function pruneHistory(history) {
  while (history.length > maxHistory) {
    console.log("PRUNE HAPPENS")
    history.shift()
  }
  return history
}

function moveMonster(tileKey, targetTileKey, history, tile, monster, maze) {
  const {monsters, tiles} = maze;
  const [mx, my, monsterID, monsterHistory] = monster
  const [x, y] = targetTileKey;
  // console.log(history, "pre pruning history")
  const monsterHistory2 = history.concat([[x, y]])
  const newMonster = [x, y, monsterID, pruneHistory(monsterHistory2)];
  // console.log(newMonster, "new monster biscuit")
  const [_e, item, connectedTiles, connectedWalls] = tile
  const originTile2 = ["open", item, connectedTiles, connectedWalls]

  maze["tiles"][tileKey] = originTile2

  const [_te, titem, ttiles, twalls]  = maze["tiles"][targetTileKey]
  const targetTile2 = [monsterID, titem, ttiles, twalls] 
  maze["tiles"][targetTileKey] = targetTile2
  const index = monsterID === 1 ? 0 : 1
  maze["monsters"].splice(index, 1, newMonster)
}


function subtract(list1, list2) {
  //subtract 2 from 1
  return list1.filter( (key) => {
    const [kx, ky] = key
    return !list2.find( (e) => {
      const [ex, ey] = e
      return kx === ex && ky === ey
    })
  })
}

function shootPlayer(mx, my, maze) {
  const {player} = maze
  const [px, py, phealth] = player
  maze["player"] = [px, py, phealth - 2]
  const shootEvent = {from: [mx, my], to: [px, py]}
  maze.events.push(shootEvent)
}

function reachableTarget(mx, my, px, py, maze) {
  if (py < my && px == mx) {
    return isReachable("north", mx, my, mx, py, maze)
  } else if (px > mx && py == my) {
    return isReachable("east", mx, my, px, my, maze)
  } else if (py > my && px == mx) {
    return isReachable("south", mx, my, mx, py, maze)
  } else if (px < mx && py == my) {
    return isReachable("west", mx, my, px, my, maze)
  }
  
  return false
}

function isReachable(direction, mx, my, tx, ty, maze) {
  if (mx === tx && my === ty) {
    return true
  }
  const {tiles, walls} = maze
  const checkTileKey = [mx, my]
  const [_e, _i, _t, connectedWalls] = tiles[checkTileKey]
  const nextWallKey = relevantWallKey(connectedWalls, direction)
  if (moveableThroughWall(walls[nextWallKey])) {
    const adjacentTileKey = offsetTile(mx, my, direction)
    const [ax, ay] = adjacentTileKey
    return isReachable(direction, ax, ay, tx, ty, maze)
  } {
    return false
  }
}

function offset(direction) {
  if (direction === "north") {
    return [0, -1]
  } else if (direction === "east") {
    return [1, 0]
  } else if (direction === "south") {
    return [0, 1]
  } else if (direction === "west") {
    return [-1, 0]
  }
}

function offsetTile(x, y, direction) {
  const [offsetx, offsety] = offset(direction)
  return [x + offsetx, y + offsety]
}

function playerInput(direction, maze) {
  const {player, score} = maze
  maze["events"] = []
  const [x, y, phealth] = player

  if (score >= victoryScore) {
    maze = constructMaze()
  } else if (phealth <= 0) {
    return constructMaze()
  }

  if (evaluateMovement(direction, player, x, y, maze)) {
    evaluateItemCollection(maze)
    loopMonsters(maze)
    if (maze["score"] > score && maze["score"] === spawnMonster2Threshold) {
      spawnMonster(maze)
    }
  }

  return maze
}
