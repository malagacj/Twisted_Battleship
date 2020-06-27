// *** Functions to create General Game related objects  ***
function new_board () {
  //This function is to create a new board.
  board = [];
  for (i=0; i<64; i++) {
    board.push({"position": i, 'clicked': false,
                'color': 'transparent', 'backcolor': 'grey'});
  }
  return board;
}

function new_game () {
  game = {'initiated': false,
          'ended': false,
          'attacker': 0,
          'boards': [
            {'id': 0, 'data': new_board(), 'ships': [], 'all_ships': [], "hits": [],
             "sunk_ships": 0, "turn_taken": false},
            {'id': 1, 'data': new_board(), 'ships': [], 'all_ships': [], "hits": [],
             "sunk_ships": 0, "turn_taken": false},
          ],
          'display_boards': false,
          'news': "",
          }
  return game
}

function get_game () {
  if (sessionStorage.getItem('game') != null) {
    game = JSON.parse(sessionStorage.getItem('game'));
  }
  else {
    game = new_game()
  }
  return game
}


// *** Helper functions (To not saturate the app methods)  ***
function get_line (length, dir, init) {
  if (!init) {
    init = Math.floor(Math.random() * 64);
  }

  var line = [];
  if (dir == 'horz') {
    for (i=0; i < length; i++) {
      line.push(init + i)
    }
  }
  else {
    for (i=0; i < length; i++) {
      line.push(init + i*8)
    }
  }
  return line
}


// *** Components  ***
Vue.component("board", {
  props: ["b_data", "b_id", "attacker", "turn_taken"],
  template: `<div class="grid-container">
               <box v-for="box in b_data"
                    :key="box.position"
                    v-bind:b_id="b_id"
                    v-bind:attacker="attacker"
                    v-bind:turn_taken="turn_taken"
                    v-bind:position="box.position"
                    v-bind:clicked="box.clicked"
                    v-bind:backcolor="box.backcolor"
                    v-bind:color="box.color"
                    v-on:click_event="click_event"
                    >
               </box>
             </div>`,
  methods: {
    click_event: function (box_position) {
      this.$emit("click_event", this.b_id, box_position)
    },
  },

})

Vue.component("box", {
  props: ["b_id", "attacker", "turn_taken", "position", "clicked", "backcolor", "color"],
  template: `<div v-on:click="click_event"
                  class="grid-item"
                  :style="{ backgroundColor: backcolor, color: color}"
                  >
               X
             </div>`,

  methods: {
    click_event: function () {
      if (!this.turn_taken) {
        if (this.b_id != this.attacker) {
          if (!this.clicked) {
            this.$emit('click_event', this.position)
          }
        }
      }
    },
  },
})

// *** Main Application  ***
var battleship_app = new Vue({
  el: "#battleship",
  data: {
    "game": get_game(),
  },
  methods: {
    reset_game: function () {
      this.game.initiated = this.game.initiated == false ? true : false
      this.game.ended = false
      this.game.news = "Player1 attacking"
      this.game.display_boards = true
      this.game.attacker = 0;
      this.game.boards.forEach(board => {
        board.all_ships = []
        board.hits = []
        board.sunk_ships = 0
        board.turn_taken = false
        board.ships = [{'name': 'boat_1', 'positions': this.set_feasible_line(board, 4),
                        'destroyed': false},
                       {'name': 'boat_2', 'positions': this.set_feasible_line(board, 4),
                        'destroyed': false},
                       {'name': 'boat_L', 'positions': this.set_feasible_l(board),
                        'destroyed': false},
                       {'name': 'boat_Box', 'positions': this.set_feasible_box(board),
                        'destroyed': false},
                      ]

        board.data.forEach(box => {
          box.clicked = false
          box.color = "transparent"
          box.backcolor = "grey"
          this.box_color(board, box)
        })

      })

      // Save changes
      sessionStorage.setItem('game', JSON.stringify(this.game))
    },

    is_drawable: function (board, line, dir) {
      // Check for overlapping and position out of range
      for (i=0; i<line.length; i++) {
        if (board.all_ships.includes(line[i])) {
          return false
        }
        else if (line[i] >=64 ){
          return false
        }
      }

      // Check if line is horizontally feasible (Line in the same row)
      if (dir == 'horz') {
        return line[line.length -1]%8 > line[0]%8
      }

      return true
    },

    set_feasible_line: function (board, length) {
      drawable = false
      dir = (Math.floor(Math.random()*2 + 1) % 2) == 0 ? 'horz': 'vert'

      while (!drawable) {
        line = get_line(4, dir)
        drawable = this.is_drawable(board, line, dir)
      }
      board.all_ships = board.all_ships.concat(line)
      return line
    },

    set_feasible_l: function (board) {
      drawable = false
      main_dir = (Math.floor(Math.random()*2 + 1) % 2) == 0 ? 'horz': 'vert'
      secn_dir = main_dir == 'horz' ? 'vert' : 'horz'

      while (!drawable) {
        line1 = get_line(3, main_dir)
        line2= get_line(2, secn_dir, line1[0])

        draw_line1 = this.is_drawable(board, line1, main_dir)
        draw_line2 = this.is_drawable(board, line2, secn_dir)
        if (draw_line1 && draw_line2) {
          drawable = true
        }
      }
      concat = line1.concat(line2)
      set = new Set(concat)
      ship = Array.from(set)

      board.all_ships = board.all_ships.concat(ship)
      return ship
    },

    set_feasible_box: function (board) {
      drawable = false
      while (!drawable) {
        line1 = get_line(2, 'vert')
        line2= get_line(2, 'vert', line1[0]+1)
        horz = [line1[0], line2[0]]

        draw_line1 = this.is_drawable(board, line1, 'vert')
        draw_line2 = this.is_drawable(board, line2, 'vert')
        draw_horz = this.is_drawable(board, horz, 'horz')

        if (draw_line1 && draw_line2 && draw_horz) {
          drawable = true
        }
      }
      concat = line1.concat(line2)
      set = new Set(concat)
      ship = Array.from(set)

      board.all_ships = board.all_ships.concat(ship)
      return ship
    },

    box_color: function (board, box) {
      if (box.clicked) {
        box.color = 'black'
      }

      if (this.game.attacker == board.id) {
        if (board.all_ships.includes(box.position)) {
          box.backcolor = '#0cd840' // green
        }
        else{
          box.backcolor = '#2196F3' // blue
        }
      }
      else {
        if (box.clicked) {
          if (board.all_ships.includes(box.position)) {
            box.backcolor = '#f0200c' // red
          }
          else{
            box.backcolor = '#2196F3' // blue
          }
        }
        else {
          box.backcolor = 'grey' // grey
        }
      }
    },

    clicked_box: function (board_id, box_position) {
      board = this.game.boards[board_id]
      box = board.data[box_position]

      board.turn_taken = true
      box.clicked = true

      board.hits.push(box_position)
      if (board.all_ships.includes(box_position)) {
        this.game.news = "Hit!"

        board.ships.forEach(ship => {
          if (ship.positions.includes(box_position)) {
            fully_destroyed = true
            for (i=0; i<ship.positions.length; i++) {
              if (!board.hits.includes(ship.positions[i])) {
                fully_destroyed = false
              }
            }
            if (fully_destroyed) {
              this.game.news = this.game.news + ' ' + ship.name + ' has been destroyed'
              ship.destroyed = true
            }
          }
        })
      }
      else {
        this.game.news = "Miss!"
      }

      board.sunk_ships = 0

      for (i=0; i<board.ships.length; i++) {
        if (board.ships[i].destroyed) {
          board.sunk_ships += 1
        }
      }

      if (board.sunk_ships == 4) {
        this.game.ended = true
      }

      this.box_color(board, box)

      // Save changes
      sessionStorage.setItem('game', JSON.stringify(this.game))
    },

    transition: function () {
      this.game.display_boards = false
      this.game.news = ''

      // Save changes
      sessionStorage.setItem('game', JSON.stringify(this.game))
    },

    show_boards: function () {
      this.game.boards[this.game.attacker].turn_taken = false
      this.game.attacker = this.game.attacker == 0 ? 1 : 0
      this.game.display_boards = true
      this.game.boards.forEach(board => {
        board.data.forEach(box => {
          this.box_color(board, box)
        })
      })

      if (this.game.attacker == 0) {
        this.game.news = 'Player1 attacking'
      }
      else {
        this.game.news = 'Player2 attacking'
      }

      // Save changes
      sessionStorage.setItem('game', JSON.stringify(this.game))
    },
  },
})
