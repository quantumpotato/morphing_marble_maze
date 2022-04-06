import { range } from 'lodash'
import { reactive } from 'vue'
import ls from 'local-storage-json'

import dummy from './dummy'

const LS_KEY = 'PREVIOUS_STATE'
const initial_state = {
  __code: parseInt(1e12 * Math.random()),
  events: [],
  payload: {
    player: [2, 2, 6],
    possible_goals: range(36).map((i) => [i % 6, parseInt(i / 6)]),
    score: 0,
    shield: 'none',
    status: 'playing',
    walls: {
      '13,8': 'solid',
      '4,13': 'solid',
      '8,13': 'solid',
      '8,1': 'solid',
      '2,1': 'solid',
      '10,1': 'solid',
      '1,4': 'solid',
      '13,12': 'solid',
      '1,2': 'solid',
      '6,1': 'solid',
      '13,6': 'solid',
      '13,4': 'solid',
      '2,13': 'solid',
      '1,6': 'solid',
      '1,10': 'solid',
      '1,8': 'solid',
      '10,13': 'solid',
      '4,1': 'solid',
      '6,13': 'solid',
      '13,2': 'solid',
      '12,1': 'solid',
      '13,10': 'solid',
      '12,13': 'solid',
      '1,12': 'solid',
    },
  },
}

Object.assign(initial_state, ls.get(LS_KEY))

export const getSocket = () => {
  if (window.location.search.includes('dummy')) {
    return { state: { payload: dummy.s1 }, channel: { push: () => {} } }
  }
  const state = reactive(initial_state)

  const socket = new Socket(`ws://${process.env.VUE_APP_SOCKET}/player/socket`)
  socket.connect()
  const channel = socket.channel('bar.player', {})
  const listen = (key, action = () => {}) => {
    channel.on(key, (payload) => {
      state.events.push([key, payload])
      Object.assign(state.payload, payload)
      action(payload)
      ls.set(LS_KEY, state)
    })
  }

  listen('player_update')

  channel.join()

  return { socket, channel, state }
}
