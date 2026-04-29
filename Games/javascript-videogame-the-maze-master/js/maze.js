var maze = function(cols, col_width) {
    this.wall_line_width = 5
    this.wall_line_color = '#042124'

    this.lock_image_file = './img/lock_blue.png'
    this.lock_image = new Image()
    this.lock_image.src = this.lock_image_file

    this.key_image_file = './img/key.png'
    this.key_image = new Image()
    this.key_image.src = this.key_image_file

    this.cols = cols
    this.rows = Math.floor(this.cols / 1.77777777778) - 1

    this.col_width = col_width
    this.cell_width = this.col_width - this.wall_line_width

    this.key_coordinates = []
    this.exit_coordinates = [this.cols - 1, this.rows - 1]

    this.horizontal_walls = []
    this.vertical_walls = []

    this.generate = function() {
        // Deterministic RNG so the maze layout stays identical every run.
        var seed = 424242 + this.cols * 31 + this.rows * 17
        var rand = function() {
            seed = (seed * 1664525 + 1013904223) >>> 0
            return seed / 4294967296
        }

        var n = this.rows * this.cols - 1

        if (n < 0) {
            alert('illegal maze dimensions')
            return
        }

        for (var j = 0; j < this.rows + 1; j++) {
            this.horizontal_walls[j] = []
        }

        for (var j = 0; j < this.rows + 1; j++) {
            this.vertical_walls[j] = []
        }

        var here = [
            Math.floor(rand() * this.rows),
            Math.floor(rand() * this.cols),
        ]
        var path = [here]

        var unvisited = []
        for (var j = 0; j < this.rows + 2; j++) {
            unvisited[j] = []

            for (var k = 0; k < this.cols + 1; k++) {
                unvisited[j].push(
                    j > 0 &&
                        j < this.rows + 1 &&
                        k > 0 &&
                        (j != here[0] + 1 || k != here[1] + 1)
                )
            }
        }

        while (0 < n) {
            var potential = [
                [here[0] + 1, here[1]],
                [here[0], here[1] + 1],
                [here[0] - 1, here[1]],
                [here[0], here[1] - 1],
            ]

            var neighbors = []

            for (var j = 0; j < 4; j++) {
                if (unvisited[potential[j][0] + 1][potential[j][1] + 1]) {
                    neighbors.push(potential[j])
                }
            }

            if (neighbors.length) {
                n = n - 1
                var next = neighbors[Math.floor(rand() * neighbors.length)]
                unvisited[next[0] + 1][next[1] + 1] = false
                if (next[0] == here[0])
                    this.horizontal_walls[next[0]][
                        (next[1] + here[1] - 1) / 2
                    ] = true
                else
                    this.vertical_walls[(next[0] + here[0] - 1) / 2][
                        next[1]
                    ] = true
                path.push((here = next))
            } else here = path.pop()
        }

        // Horizontal transition matrix
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.cols - 1; j++) {
                // console.log("Horizontal transition matrix de (%d,%d) a (%d,%d)", i, j, i, j + 1);
                if (!this.horizontal_walls[i][j]) {
                    this.horizontal_walls[i][j] = false
                }
                // console.log(Game.maze.horizontal_walls[i][j]);
            }
        }

        // Vertical transition matrix
        for (var i = 0; i < this.rows - 1; i++) {
            for (var j = 0; j < this.cols; j++) {
                // console.log("Vertical transition matrix de (%d,%d) a (%d,%d)", i, j, i + 1, j);
                if (!this.vertical_walls[i][j]) {
                    this.vertical_walls[i][j] = false
                }
                // console.log(Game.maze.vertical_walls[i][j]);
            }
        }

        // Generate the coordinates for the key
        var max = this.rows - 1
        var min = Math.floor(this.rows / 2)
        var range = max - min + 1 + min
        this.key_coordinates[0] = Math.floor(rand() * range)
        this.key_coordinates[1] = Math.floor(rand() * range)
    }

    this.getTotalWidth = function() {
        return this.col_width * this.cols + this.wall_line_width / 4
    }

    this.getTotalHeight = function() {
        return this.col_width * this.rows + this.wall_line_width / 4
    }

    this.render = function() {
        var exitX = this.exit_coordinates[0] * Game.maze.col_width + Game.maze.col_width / 4
        var exitY = this.exit_coordinates[1] * Game.maze.col_width + Game.maze.col_width / 4
        var itemSize = Game.maze.col_width * 0.5

        // Exit
        if (this.lock_image && this.lock_image.complete && this.lock_image.naturalWidth > 0) {
            Game.ctx.drawImage(
                this.lock_image,
                0,
                0,
                70,
                70,
                exitX,
                exitY,
                itemSize,
                itemSize
            )
        } else {
            Game.ctx.fillStyle = '#1d4ed8'
            Game.ctx.fillRect(exitX, exitY, itemSize, itemSize)
        }

        // Key
        if (!Game.player.has_key) {
            var keyX = this.key_coordinates[0] * Game.maze.col_width + Game.maze.col_width / 4
            var keyY = this.key_coordinates[1] * Game.maze.col_width + Game.maze.col_width / 4
            if (this.key_image && this.key_image.complete && this.key_image.naturalWidth > 0) {
                Game.ctx.drawImage(
                    this.key_image,
                    0,
                    0,
                    44,
                    44,
                    keyX,
                    keyY,
                    itemSize,
                    itemSize
                )
            } else {
                Game.ctx.beginPath()
                Game.ctx.fillStyle = '#eab308'
                Game.ctx.arc(
                    keyX + itemSize / 2,
                    keyY + itemSize / 2,
                    itemSize * 0.32,
                    0,
                    Math.PI * 2,
                    true
                )
                Game.ctx.fill()
            }
        }

        // Map Walls
        for (var i = 0; i < Game.maze.rows; i++) {
            for (var j = 0; j < Game.maze.cols; j++) {
                // Should we draw a wall at the right?
                if (j < Game.maze.cols - 1) {
                    if (!Game.maze.horizontal_walls[i][j]) {
                        Game.ctx.beginPath()
                        Game.ctx.strokeStyle = Game.maze.wall_line_color
                        Game.ctx.lineWidth = Game.maze.wall_line_width

                        Game.ctx.moveTo(
                            j * Game.maze.col_width + Game.maze.col_width,
                            Game.maze.col_width * i
                        )
                        Game.ctx.lineTo(
                            j * Game.maze.col_width + Game.maze.col_width,
                            Game.maze.col_width * i + Game.maze.col_width
                        )
                        Game.ctx.closePath()
                        Game.ctx.stroke()
                    }
                }

                // Should we draw a wall at the bottom?
                if (i < Game.maze.rows - 1) {
                    if (!Game.maze.vertical_walls[i][j]) {
                        Game.ctx.beginPath()
                        Game.ctx.strokeStyle = Game.maze.wall_line_color
                        Game.ctx.lineWidth = Game.maze.wall_line_width
                        Game.ctx.moveTo(
                            j * Game.maze.col_width -
                                Game.maze.wall_line_width / 2,
                            i * Game.maze.col_width + Game.maze.col_width
                        )
                        Game.ctx.lineTo(
                            j * Game.maze.col_width +
                                Game.maze.col_width +
                                Game.maze.wall_line_width / 2,
                            i * Game.maze.col_width + Game.maze.col_width
                        )
                        Game.ctx.closePath()
                        Game.ctx.stroke()
                    }
                }
            }
        }
    }
}
