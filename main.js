// *** Functions to create General Game related objects  ***
function new_boxes (boxes) {
  // Resets all boxes, weather they have been created already or not
  if (boxes) {
    boxes.forEach(box => {
      box.clicked = false
      box.color = "transparent"
      box.backcolor = "grey"
    })
  }
  else {
    boxes = [];
    for (i=0; i<64; i++) {
      boxes.push({"position": i, "clicked": false,
                  "color": "transparent", "backcolor": "grey"});
    }
  }
  return boxes;
}

function new_game (game) {
  // Resets game, weather it has been created already or not
  // It loads previous game state if page is refreshed
  if (game) {
    game.state = "lobby"
    game.attacker = 0
    game.news = ""
    game.boards.forEach(board => {
      board.ships = []
      board.all_ships = []
      board.hits = []
      board.sunk_ships = 0
      board.turn_taken = false
      new_boxes(board.boxes)
    })
  }

  else if (sessionStorage.getItem("game") != null) {
    return JSON.parse(sessionStorage.getItem("game"));
  }

  else {
    game = {"state": "lobby",
            "attacker": 0,
            "news": "",
            "boards": [
              {"id": 0, "boxes": new_boxes(), "ships": [], "all_ships": [], "hits": [],
               "sunk_ships": 0, "turn_taken": false},
              {"id": 1, "boxes": new_boxes(), "ships": [], "all_ships": [], "hits": [],
               "sunk_ships": 0, "turn_taken": false},
            ],
            }
    return game
  }
}


// *** Helper functions (To not saturate the app methods)  ***
function get_line (length, dir, init) {
  // returns a vertical or horizontal line with an specific length
  // initial point may be passed
  init = typeof init == 'undefined' ? Math.floor(Math.random() * 64) : init

  var line = [];
  if (dir == "horz") {
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
  // Represents a player's board
  props: ["boxes", "pk"],
  template: `<div class="grid-container">
               <box v-for="box in boxes"
                    :key="box.position"
                    v-bind:position="box.position"
                    v-bind:backcolor="box.backcolor"
                    v-bind:color="box.color"
                    v-on:click_event="click_event"
                    >
               </box>
             </div>`,
  methods: {
    click_event: function (box_position) {
      this.$emit("click_event", this.pk, box_position)
    },
  },

})

Vue.component("box", {
  // Represents a box within a board
  props: ["position", "backcolor", "color"],
  template: `<div v-on:click="click_event"
                  class="grid-item"
                  :style="{ backgroundColor: backcolor, color: color}"
                  >
               X
             </div>`,

  methods: {
    click_event: function () {
      this.$emit("click_event", this.position)
    },
  },
})


// *** Main Application  ***
var battleship_app = new Vue({
  el: "#battleship",
  data: {
    "game": new_game(),
  },
  methods: {
    lobby: function () {
      // Initial state of the game, game is completely reset
      new_game(this.game)
      
      // Save state
      sessionStorage.setItem("game", JSON.stringify(this.game))
    },

    start_game: function () {
      // Initiating game, only called the first time the boards are layed out
      this.game.state = "game"
      this.game.news = "Player1 attacking"
      this.game.boards.forEach(board => {
        board.ships = [{"name": "boat_1", "positions": this.set_feasible_line(board, 4),
                        "destroyed": false},
                       {"name": "boat_2", "positions": this.set_feasible_line(board, 4),
                        "destroyed": false},
                       {"name": "boat_L", "positions": this.set_feasible_l(board),
                        "destroyed": false},
                       {"name": "boat_Box", "positions": this.set_feasible_box(board),
                        "destroyed": false},
                      ]

        board.boxes.forEach(box => {
          this.set_box_color(board, box)
        })

        board.ships.forEach(ship => {
          if (ship.positions.length != 4) {
            console.log('Something is wrong')
            console.log(ship)
          }
        })

      })

      // Save state
      sessionStorage.setItem("game", JSON.stringify(this.game))
    },

    transition: function () {
      // Transition between one player to the next
      this.game.state = "transition"
      this.game.news = ""

      // Save changes
      sessionStorage.setItem("game", JSON.stringify(this.game))
    },

    is_drawable: function (board, line, dir) {
      // Checks weather a line can be drawn on a board

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
      if (dir == "horz") {
        return line[line.length -1]%8 > line[0]%8
      }

      return true
    },

    set_feasible_line: function (board, length) {
      // sets a line shaped ship on the board

      drawable = false
      dir = (Math.floor(Math.random()*2 + 1) % 2) == 0 ? "horz": "vert"

      while (!drawable) {
        line = get_line(4, dir)
        drawable = this.is_drawable(board, line, dir)
      }
      board.all_ships = board.all_ships.concat(line)
      return line
    },

    set_feasible_l: function (board) {
      // sets an L shaped ship on the board

      drawable = false
      main_dir = (Math.floor(Math.random()*2 + 1) % 2) == 0 ? "horz": "vert"
      secn_dir = main_dir == "horz" ? "vert" : "horz"

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
      // sets an square shaped ship on the board

      drawable = false
      while (!drawable) {
        line1 = get_line(2, "vert")
        line2= get_line(2, "vert", line1[0]+1)
        horz = [line1[0], line2[0]]

        draw_line1 = this.is_drawable(board, line1, "vert")
        draw_line2 = this.is_drawable(board, line2, "vert")
        draw_horz = this.is_drawable(board, horz, "horz")

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

    set_box_color: function (board, box) {
      // sets a box color
      if (box.clicked) {
        box.color = "black"
      }

      if (this.game.attacker == board.id) {
        // green : blue
        box.backcolor = board.all_ships.includes(box.position) ? "#0cd840" : "#2196F3"
      }
      else {
        if (box.clicked) {
          // red : blue
          box.backcolor = board.all_ships.includes(box.position) ? "#f0200c" : "#2196F3"
        }
        else {
          box.backcolor = "grey" // grey
        }
      }
    },

    clicked_box: function (board_id, box_position) {
      // Carries out all the steps after a box is clicked
      
      board = this.game.boards[board_id]
      box = board.boxes[box_position]

      if (board.turn_taken || board_id == this.game.attacker || box.clicked) {
        return
      }

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
              this.game.news = this.game.news + " " + ship.name + " has been destroyed"
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

      this.game.state = board.sunk_ships == 4 ? 'ended': this.game.state
      this.set_box_color(board, box)

      // Save changes
      sessionStorage.setItem("game", JSON.stringify(this.game))
    },

    show_boards: function () {
      // Displays boards (For initial State "method.start_game" is used)
     
      this.game.state = "game"
      this.game.boards[this.game.attacker].turn_taken = false
      this.game.attacker = this.game.attacker == 0 ? 1 : 0
      this.game.boards.forEach(board => {
        board.boxes.forEach(box => {
          this.set_box_color(board, box)
        })
      })

      this.game.news = this.game.attacker == 0 ? "Player1 attacking" : "Player2 attacking"

      // Save changes
      sessionStorage.setItem("game", JSON.stringify(this.game))
    },
  },
})
