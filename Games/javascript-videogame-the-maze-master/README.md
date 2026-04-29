# Introduction
A simple 2D maze game written in pure Javascript. Use the arrow keys or the gamepad to get the key and scape. You can play this game on [https://the-maze.cscazorla.es/](https://the-maze.cscazorla.es/)

![GitHub Logo](/img/screenshot.png)


# The maze
Everytime the game is loaded a new maze is generated using the simple [Depth-first search algorithm](https://en.wikipedia.org/wiki/Maze_generation_algorithm#Depth-first_search):

1. Start at a random cell.
2. Mark the current cell as visited, and get a list of its neighbors. For each neighbor, starting with a randomly selected neighbor:
    - If that neighbor hasn't been visited, remove the wall between this cell and that neighbor, and then recurse with that neighbor as the current cell.

# Tiles
Tiles from https://opengameart.org/content/platformer-art-deluxe

# To Do
- Enable camera view
- Render screen on window resize