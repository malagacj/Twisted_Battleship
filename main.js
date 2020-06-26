function new_board () {
  board = [];
  for (i=0; i<64; i++) {
    board.push({"position": i, "value": "Miss", 'backcolor': 'grey', 'color': 'transparent'});
  }
  return board;
}

Vue.component("board", {
  props: ["b_data", "b_id"],
  template: `<div class="grid-container" style="margin-bottom: 5px;">
              <box v-for="box in b_data"
                   :key="box.position"
                   v-bind:position="box.position"
                   v-bind:value="box.value"
                   v-bind:backcolor="box.backcolor"
                   v-bind:color="box.color"
                   v-on:clicked="listened"

                   >
              </box>
             </div>`,
  methods: {
    listened: function (box_position) {
      this.$emit("clicked", this.b_id, box_position)
    },
  },

})

Vue.component("box", {
  props: ["position", "value", "backcolor", "color"],
  template: `<div v-on:click="clicky"
                  class="grid-item"
                  :style="{ backgroundColor: backcolor, color: color}"
                  >
              {{ value }}
             </div>`,
  methods: {
    clicky: function () {
      this.$emit('clicked', this.position)
    },
  },
})


var battleship_app = new Vue({
  el: "#battleship",
  data: {
    "boards": [{'board_id': 0, 'board_data': new_board(), 'ships': []},
               {'board_id': 1, 'board_data': new_board(), 'ships': []},
              ],
  },
  methods: {
    get_line: function (initial_point, direction='horz', length){
      var line = [];
      if (direction == 'horz') {
        for (i=0; i < length; i++) {
          line.push(initial_point + i)
        }
      }
      else {
        for (i=0; i < length; i++) {
          line.push(initial_point + i*8)
        }
      }
      return line
    },

    is_drawable: function(board, lines) {
      // Check if line is horizontally feasible (Line in the same row)
      lines.forEach(line => {
        line.forEach(position => {
          drawable = (line[line.length - 1]%8 > line[0]%8) ? true : false;
          if (!drawable) {
            return false;
          }
        })
      })

      // Check if line overlaps an existing line
      lines.forEach(line => {
        line.forEach(position => {
          if (board.ships.includes(position)) {
            return false;
          }
        })
      })

      return true;
    },

    set_line: function(board, length) {
      ini_box = Math.floor(Math.random() * 64);
      line1 = this.get_line(ini_box, 'horz', 4)
      line2 = this.get_line(ini_box, 'vert', 4)

      aaa = this.is_drawable(board, [[1,2,3], [4, 5, 6], [6,7,8]])
      console.log(aaa)
      drawable = false;

      while (!drawable) {
        ini_box = Math.floor(Math.random() * 64);
        fin_box = ini_box + length -1;
        drawable = (fin_box%8 > ini_box%8) ? true : false;

        if (!drawable) {
          continue;
        }

        var line = [];
        for (i=ini_box; i<=fin_box; i++) {
          if (!board.ships.includes(i)) { 
            line.push(i)
          }
        }

        if (line.length == length) {
          board.ships = board.ships.concat(line)
          board.ships.forEach(ship => {
            board.board_data[ship].value = 'Ship'
          })
          drawable = true;
        }
      }
    },

    clicked_box: function (board_id, box_position) {
      current_board = this.boards[board_id]
      current_box = current_board.board_data[box_position]

      current_box.color = 'black'
      current_box.backcolor = current_box.value == 'Miss' ? 'rgba(255, 255, 255, 0.8)' : 'red'

      if (current_box.value == 'Ship' && !current_board.ships.includes(box_position)) {
        current_board.ships.push(box_position)
      }
    },

    reset_boards: function () {
      this.boards.forEach(board => {
        board.ships = []
        board.board_data.forEach(box => {
          box.value = "Miss"
          box.backcolor = "grey"
          box.color = "transparent"
        })
       this.set_line(board, 4)
       this.set_line(board, 4)
      })
    },
  },
})

function set_line (set_boxes) {
  //Fix arrays
  drawable = false;
  counter = 1

  while (!drawable) {
    counter += 1;
    ini_box = Math.floor(Math.random() * 64);
    fin_box = ini_box + 3;
    drawable = (fin_box%8 > ini_box%8) ? true : false;

    if (!drawable) {
      continue;
    }

    var line = [];
    for (i=ini_box; i<=fin_box; i++) {
      if (!set_boxes.includes(i)) { 
        line.push(i)
      }
    }
  return line
  
  }

  //To simplify we will always draw lines left and down

  for (i=ini_box; i<=fin_box; i++) {
  
  }
  return "It is drawable"
}

