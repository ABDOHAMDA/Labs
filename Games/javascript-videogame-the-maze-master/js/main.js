window.onload = function() {
    canvas = document.getElementById('canvas')
    canvas.width = 1080
    canvas.height = 620
    canvas.style.margin = 'auto'

    Game.init(canvas)
    Game.start() // Start with adaptive size per screen
}

var Game = {
    canvas: null,
    ctx: null,
    ui: null,
    player: null,
    maze: null,
    paused: false,
    reqanimationreference: null,
    activeColumns: 30,
    phase: 'record', // record | replay | solved
    recordedMoves: [],
    replayMoves: [],
    targetHash: '',
    labSolvedSubmitted: false,
    session: null,
    isHandlingSolve: false,

    init: function(canvas) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.ui = new UI()
        this.session = this.readSessionFromUrl()

        this.ui.showWelcomeScreen()
    },

    readSessionFromUrl: function() {
        var p = new URLSearchParams(window.location.search)
        return {
            labId: Number(p.get('labId') || 42),
            token: p.get('token') || '',
            userId: Number(p.get('userId') || 0),
            deviceBind: p.get('device_bind') || '',
            macAddress: p.get('mac_address') || '',
            clientLocalIp: p.get('client_local_ip') || '',
        }
    },

    getAdaptiveColumns: function() {
        return 30
    },

    start: function(_columns) {
        this.paused = false
        if (this.reqanimationreference) {
            window.cancelAnimationFrame(this.reqanimationreference)
            this.reqanimationreference = null
        }

        var columns = _columns || this.getAdaptiveColumns()
        var column_width = Math.floor(this.canvas.width / columns)
        this.activeColumns = columns

        this.maze = new maze(columns, column_width)
        this.maze.generate()

        this.canvas.width = this.maze.getTotalWidth()
        this.canvas.height = this.maze.getTotalHeight()

        this.player = new player(0, 0)

        Input.init()

        // Draw immediately once so maze appears even before first RAF tick.
        this.render()
        this.reqanimationreference = window.requestAnimationFrame(Game.update)
        this.updateHud('Record your path by solving the maze once.')
    },
    
    goBackToMenu: function() {
        this.resetAttempt('Manual reset: start again from the beginning.')
    },

    resetAttempt: function(message) {
        this.paused = false
        if (this.player) {
            this.player.x = 0
            this.player.y = 0
            this.player.has_key = false
            this.player.speed_counter = 0
        }
        if (this.phase === 'record') {
            this.recordedMoves = []
        } else if (this.phase === 'replay') {
            this.replayMoves = []
        }
        if (this.reqanimationreference) {
            window.cancelAnimationFrame(this.reqanimationreference)
        }
        this.reqanimationreference = window.requestAnimationFrame(Game.update)
        this.updateHud(message || '')
    },

    onPlayerStep: function(direction) {
        if (this.phase === 'record') {
            this.recordedMoves.push(direction)
            this.updateHud('Recording path... Moves: ' + this.recordedMoves.length)
            return
        }
        if (this.phase !== 'replay') return

        this.replayMoves.push(direction)
        var idx = this.replayMoves.length - 1
        if (this.recordedMoves[idx] !== direction) {
            this.updateHud('Wrong step. Try again from start with the same hash path.')
            window.alert('Wrong move sequence. Restarting from the beginning.')
            this.resetAttempt('Replay failed. Start again and follow the same path.')
            return
        }
        this.updateHud('Replay mode: ' + this.replayMoves.length + '/' + this.recordedMoves.length + ' moves matched.')
    },

    onMazeSolved: async function() {
        if (this.isHandlingSolve) return
        this.isHandlingSolve = true
        try {
            if (this.phase === 'record') {
                var basePath = this.recordedMoves.join('')
                if (!basePath) {
                    this.resetAttempt('No path recorded. Move and try again.')
                    return
                }
                this.targetHash = await this.hashText(basePath)
                this.phase = 'replay'
                this.replayMoves = []
                this.updateHud('Target hash: ' + this.targetHash + ' | Re-solve using the exact same path.')
                this.showMessage(
                    'First solve saved. Path hash: ' + this.targetHash +
                    '. Now solve again with EXACT same path until hash matches.'
                )
                this.resetAttempt('Replay mode active. Follow the same path to match hash.')
                return
            }

            if (this.phase !== 'replay') return

            var replayPath = this.replayMoves.join('')
            if (replayPath !== this.recordedMoves.join('')) {
                this.showMessage('Path differs from first run. Restarting from beginning.')
                this.resetAttempt('Path mismatch. Try again to reach same hash.')
                return
            }

            var replayHash = await this.hashText(replayPath)
            if (replayHash !== this.targetHash) {
                this.showMessage('Hash mismatch. Restarting from beginning.')
                this.resetAttempt('Hash mismatch. Try again.')
                return
            }

            this.phase = 'solved'
            this.updateHud('Hash matched: ' + replayHash + ' | Submitting solve...')
            var result = await this.submitLabSolved()
            if (result.ok) {
                this.updateHud('Lab solved successfully. Points earned: ' + result.points)
                this.showMessage('Lab solved successfully. Points: ' + result.points)
            } else {
                this.updateHud('Solved locally but submit failed: ' + result.message)
                this.showMessage('Solved locally but submission failed: ' + result.message)
            }
        } catch (e) {
            this.updateHud('Error while processing hash flow. Restarting attempt.')
            this.showMessage('An internal error happened while generating/verifying hash. Restarting attempt.')
            this.phase = this.targetHash ? 'replay' : 'record'
            this.resetAttempt('Recovered from error. Try again.')
        } finally {
            this.isHandlingSolve = false
        }
    },

    updateHud: function(message) {
        var panel = document.getElementById('hash-panel')
        if (!panel) return
        var phaseLabel = this.phase === 'record' ? 'Phase 1 (Record)' : this.phase === 'replay' ? 'Phase 2 (Replay)' : 'Solved'
        var hashText = this.targetHash ? ('Hash: ' + this.targetHash) : 'Hash: (not generated yet)'
        panel.textContent = phaseLabel + ' | ' + hashText + (message ? ' | ' + message : '')
    },

    showMessage: function(text) {
        var box = document.getElementById('game-message')
        if (!box) return
        box.style.display = 'block'
        box.textContent = text
    },

    hashText: async function(value) {
        try {
            if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
                var enc = new TextEncoder()
                var data = enc.encode(value)
                var digest = await window.crypto.subtle.digest('SHA-256', data)
                var bytes = Array.from(new Uint8Array(digest))
                return bytes.map(function(b) {
                    return b.toString(16).padStart(2, '0')
                }).join('')
            }
        } catch (_) {
            // fallback below
        }

        // Deterministic fallback hash if SubtleCrypto is unavailable.
        var h = 2166136261
        for (var i = 0; i < value.length; i++) {
            h ^= value.charCodeAt(i)
            h = Math.imul(h, 16777619)
        }
        var hex = (h >>> 0).toString(16).padStart(8, '0')
        return (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 64)
    },

    submitLabSolved: async function() {
        if (this.labSolvedSubmitted) {
            return { ok: true, points: 0, message: 'Already submitted.' }
        }
        var payload = {
            lab_id: Number(this.session.labId || 42),
            flag: 'FLAG{MAZE_MASTER_HASH_42}',
            user_id: Number(this.session.userId || 0),
            access_token: this.session.token || '',
            device_bind: this.session.deviceBind || '',
            mac_address: this.session.macAddress || '',
            client_local_ip: this.session.clientLocalIp || '',
        }
        try {
            var res = await fetch('http://localhost/HackMe/server/api/submit_flag.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            var raw = await res.text()
            var data = {}
            try {
                data = raw ? JSON.parse(raw) : {}
            } catch (_) {}
            var msg = data.message || ''
            var accepted =
                !!data.success ||
                msg === 'FLAG_CAPTURED' ||
                msg === 'LAB_ALREADY_SOLVED' ||
                msg === 'FLAG_ALREADY_SUBMITTED'
            if (!accepted) {
                return { ok: false, points: 0, message: data.detail || msg || 'Invalid response' }
            }
            var isFirst = msg === 'FLAG_CAPTURED'
            var pts = isFirst ? Number(data.points || 180) : 0
            var safePoints = Number.isFinite(pts) && pts > 0 ? pts : 0
            this.labSolvedSubmitted = true
            if (window.opener) {
                window.opener.postMessage(
                    { type: 'HACKME_LAB_SOLVED', labId: Number(this.session.labId || 42), lab_id: Number(this.session.labId || 42), points: safePoints },
                    '*'
                )
                window.opener.postMessage({ type: 'LAB_SOLVED', labId: Number(this.session.labId || 42) }, '*')
            }
            return { ok: true, points: safePoints, message: 'Lab solved.' }
        } catch (_) {
            return { ok: false, points: 0, message: 'Network error while submitting.' }
        }
    },
}

Game.update = function() {
    this.reqanimationreference = window.requestAnimationFrame(Game.update)
    // One move per physical key press, including very quick taps.
    // Fallback to key state if consumePressed is unavailable (old cached input.js).
    var dirs = ['up', 'down', 'left', 'right']
    for (var i = 0; i < dirs.length; i++) {
        var d = dirs[i]
        var shouldMove = false
        if (Input && typeof Input.consumePressed === 'function') {
            shouldMove = Input.consumePressed(d)
        } else if (Input && typeof Input.isPressed === 'function') {
            shouldMove = !!Input.isPressed(d)
        }
        if (shouldMove) {
            Game.player.move(d)
        }
    }

    Game.render()
}

Game.render = function() {
    this.ctx.clearRect(0, 0, canvas.width, canvas.height)
    this.maze.render()
    this.player.render()
}
