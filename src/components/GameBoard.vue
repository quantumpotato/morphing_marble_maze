<template>
  <div class="game__wrapper" v-if="state.payload.player">
    <div class="game-score">💎 {{ state.payload.score }} / {{ MAX_SCORE }}</div>
    <div class="game-health">
      <div v-for="h in player.health" :key="h" :class="h.class" />
    </div>
    <div class="game__board">
      <div v-for="square in squares" :key="square.index" :class="square.class" />
      <div
        v-for="(wall, index) in walls"
        :key="index"
        :class="getWallClass(wall)"
        :title="wall.title"
      />
      <div :class="player.class">
        🙃
      </div>
      <div v-if="goal_class" :class="goal_class">💎</div>
      <template v-for="monster in monsters" :key="monster.id">
        <div v-for="(print, i) in monster.prints" :key="i" :class="print.class">
          {{ print.icon }}
        </div>
        <div :class="monster.class">
          {{ monster.icon }}
        </div>
      </template>
      <div v-for="event in events" :key="event.id" :class="event.class">
        {{ event.icon }}
      </div>
    </div>
    <div class="game-message">{{ message }}</div>
  </div>
  <event-log :events="state.events" />
</template>

<script>
import { range, flatten } from 'lodash'
import { getSocket } from '@/socket'
import Mousetrap from '@unrest/vue-mousetrap'
import { getGame } from '@/game'

const vec = {
  dxy_by_key: {
    ArrowUp: [0, -1],
    ArrowRight: [1, 0],
    ArrowLeft: [-1, 0],
    ArrowDown: [0, 1],
    w: [0, -1],
    d: [1, 0],
    a: [-1, 0],
    s: [0, 1]
  },
  news_by_key: {
    w: 'north',
    a: 'west',
    s: 'south',
    d: 'east',
    ArrowUp: 'north',
    ArrowRight: 'east',
    ArrowLeft: 'west',
    ArrowDown: 'south',
  },
  dxy_by_news: {
    north: [0, -1],
    east: [1, 0],
    west: [-1, 0],
    south: [0, 1],
  },
}

const monsters = ['👹', '👺']
const paw_prints = ['🐾', '👣']

const Wall = {
  isEdge({ x, y, orientation }) {
    if (orientation === 'vertical' && (x === 1 || x === 7)) {
      return true
    }
    if (orientation === 'horizontal' && (y === 1 || y === 7)) {
      return true
    }
  },
}

export default {
  mixins: [Mousetrap.Mixin],
  data() {
    const { state, channel } = getGame()
    channel.push('msg', { code: state.__code })
    window.S = state
    window.C = channel
    const walls = []
    const seven = range(1, 8)
    seven.forEach((y) => {
      seven.forEach((x) => {
        const h = { x, y, orientation: 'vertical' }
        const v = { x, y, orientation: 'horizontal' }
        h.state = Wall.isEdge(h) ? 'solid' : 'empty'
        v.state = Wall.isEdge(v) ? 'solid' : 'empty'
        walls.push(h)
        walls.push(v)
      })
    })
    return {
      state,
      channel,
      walls,
      MAX_SCORE: 36,
      last_state: {},
      turn: 0,
      events: [],
      message: null,
      streak: 0
    }
  },
  computed: {
    mousetrap() {
      return {
        'up,down,left,right,w,a,s,d': this.pressArrow,
      }
    },
    squares() {
      // These aren't actually rendered, could be used for touch interactions though
      const six = range(1, 7)
      const out = []
      six.forEach((y) => {
        six.forEach((x) => {
          out.push({ x, y, class: `game__square -floor -x-${x} -y-${y}`, index: x + y * 6 })
        })
      })
      return out
    },
    player() {
      const { player = {} } = this.state.payload || {}
      const [x, y, health] = player
      return {
        class: `game__player -floor -x-${x} -y-${y}`,
        health: range(3).map((i) => {
          const remainder = i * 2 - health
          return {
            key: i,
            class: [`game-health__heart`, remainder >= 0 && '-empty', remainder == -1 && '-half'],
          }
        }),
      }
    },
    player_class() {
      return `game__player -floor -x-${x} -y-${y}`
    },
    goal_class() {
      if (!this.state.payload.goal) {
        return
      }
      const [x, y] = this.state.payload.goal
      return `game__goal -floor -x-${x} -y-${y}`
    },
    monsters() {
      window.monsters = this.state.payload.monsters
      return this.state.payload.monsters?.map(([x, y, id, history = []], index) => ({
        id: id || index,
        class: `game__monster -floor -x-${x} -y-${y}`,
        icon: monsters[index % 2],
        prints: history
          .filter(([x, y]) => x || y) // history starts as all [0,0]
          .map(([x, y], i) => ({
            class: `game__pawprint -floor -x-${x} -y-${y} -index-${12 - i}`,
            icon: paw_prints[index % 2],
          })),
      }))
    },
  },
  watch: {
    'state.payload.walls': 'moveWalls',
  },
  mounted() {
    this.moveWalls()
  },
  methods: {
    getWallClass({ x, y, state, orientation }) {
      return `game__wall -wall -orientation-${orientation} -x-${x} -y-${y} -state-${state}`
    },
    pressArrow(e) {
      this.channel.push('msg', { input: vec.news_by_key[e.key] })
      this.moveWalls()
    },
    moveWalls() {
       if (this.state.payload.score === this.MAX_SCORE) {
        this.streak = this.streak + 1
        this.message = 'You won!'
        this.turn = 0
      } else if (this.state.payload.player[2] <= 0) {
        if (this.streak) {
          this.message = `You died. ${this.streak} streak ended.`
        } else {
          this.message = 'You died. Try again!'
        }
        this.turn = 0
        this.streak = 0
      }
      
      else {
        this.message = null
        this.turn += 1
      }
      this.last_state = {
        score: this.state.payload.score,
        health: this.state.payload.player[2],
      }
      const state_by_xy = this.state.payload.walls || {}
      Object.entries(state_by_xy).forEach(([key, value]) => {
        if (value == 'empty') {
          delete state_by_xy[key]
        }
      })
      // console.log(state_by_xy, "statebyxy")
      this.walls
        .filter((w) => !Wall.isEdge(w))
        .forEach((wall) => {
          const { x, y, orientation } = wall
          let wx = 2 * x
          let wy = 2 * y
          if (orientation == 'vertical') {
            wx -= 1
          } else {
            wy -= 1
          }
          wall.state = state_by_xy[`${wx},${wy}`] || 'empty'
          wall.title = `${wx},${wy}`
        })
      this.events = flatten(this.state.payload.events)?.map(({ from, to }) => {
        const [x1, y1] = from
        const [x2, y2] = to
        return {
          icon: '⚡',
          class: `game__event -floor  -x-${x1} -y-${y1}`,
          class2: `game__event -floor  -x-${x2} -y-${y2}`,
          id: Math.random(),
        }
      })
      this.events?.length &&
        setTimeout(() =>
          this.events.forEach((e) => {
            e.class = e.class2
          }, 0),
        )
    },
  },
}
</script>
