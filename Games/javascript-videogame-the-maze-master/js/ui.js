var UI = function() {
    var Button = function(value, x, y, w, h, context) {
        // create shadow box
        context.fillStyle = 'rgba(0, 0, 0, .15)'
        context.fillRect(x + 2, y + 2, w + 2, h + 2)

        context.fillStyle = '#333'
        context.fillRect(x, y, w, h)

        context.fillStyle = 'white'
        context.font = '20px Georgia'
        context.fillText(value, x + w / 2, y + h / 2 + 5)

        this.click = function(posx, posy) {
            if (posx >= x && posx <= x + w && posy >= y && posy <= y + h)
                return true
            return false
        }
    }
    
    this.backButton = null
    
    this.drawBackButton = function() {
        var buttonX = 10
        var buttonY = 10
        var buttonW = 120
        var buttonH = 42
        
        // Draw button shadow/3D effect
        Game.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        Game.ctx.fillRect(buttonX + 2, buttonY + 2, buttonW, buttonH)
        
        // Draw main button with red color
        Game.ctx.fillStyle = '#F97316'
        Game.ctx.fillRect(buttonX, buttonY, buttonW, buttonH)
        
        // Draw glossy top effect
        Game.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        Game.ctx.fillRect(buttonX, buttonY, buttonW, buttonH / 3)
        
        // Draw border
        Game.ctx.strokeStyle = '#FED7AA'
        Game.ctx.lineWidth = 2
        Game.ctx.strokeRect(buttonX, buttonY, buttonW, buttonH)
        
        // Draw text with shadow
        Game.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        Game.ctx.font = 'bold 15px Arial'
        Game.ctx.textAlign = 'center'
        Game.ctx.textBaseline = 'middle'
        Game.ctx.fillText('Reset Maze', buttonX + buttonW / 2 + 1, buttonY + buttonH / 2 + 1)
        
        // Draw main text
        Game.ctx.fillStyle = 'white'
        Game.ctx.font = 'bold 15px Arial'
        Game.ctx.fillText('Reset Maze', buttonX + buttonW / 2, buttonY + buttonH / 2)
        
        this.backButton = {
            x: buttonX,
            y: buttonY,
            w: buttonW,
            h: buttonH,
            click: function(posx, posy) {
                if (posx >= this.x && posx <= this.x + this.w && posy >= this.y && posy <= this.y + this.h)
                    return true
                return false
            }
        }
    }

    this.showWelcomeScreen = function() {
        // Directly start the game with Expert level (30 columns)
        Game.start(30)
    }

    this.showGameOverScreen = function() {
        this.createWindow(
            '#1c6a9e',
            '#fff',
            Game.canvas.width / 4,
            Game.canvas.height / 4
        )

        Game.ctx.font = 'bold 40px Georgia'
        Game.ctx.fillStyle = '#FFF'
        Game.ctx.textAlign = 'center'
        Game.ctx.fillText(
            'You escaped!',
            Game.canvas.width / 2,
            Game.canvas.height / 2
        )

        Game.ctx.font = 'bold 20px Georgia'
        Game.ctx.fillText(
            'Reload the page to play again',
            Game.canvas.width / 2,
            Game.canvas.height / 1.5
        )
    }

    this.createWindow = function(
        background_color,
        border_color,
        width,
        height
    ) {
        this.showMouse()

        Game.ctx.fillStyle = background_color
        Game.ctx.strokeStyle = border_color
        Game.ctx.lineWidth = 10

        Game.ctx.rect(
            width,
            height,
            Game.canvas.width / 2,
            Game.canvas.height / 2
        )
        Game.ctx.fill()
        Game.ctx.stroke()
    }

    this.showMouse = function() {
        canvas.style.cursor = 'pointer'
    }
}
