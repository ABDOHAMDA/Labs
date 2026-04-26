# Start all Training Labs game stacks locally (Windows-friendly; no Linux-only npm deps in Games).
# Prerequisites: Node.js, .NET 8 SDK. Stop other processes on these ports if needed: 4005, 4010, 4011, 5000, 8080.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# 1) Games hub (Vite) — "War / mixed vulns" lab
Push-Location (Join-Path $root "Games")
if (-not (Test-Path "node_modules")) { npm install }
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", "cd '$pwd'; npm run dev -- --host 127.0.0.1 --port 4005"
Pop-Location

# 2) Hack the Sudoku — .NET API + Vite
Push-Location (Join-Path $root "Games\hack-the-sudoku\backend")
$env:ASPNETCORE_URLS = "http://127.0.0.1:8080"
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", "cd '$pwd'; `$env:ASPNETCORE_URLS='http://127.0.0.1:8080'; dotnet run --no-launch-profile"
Pop-Location
Start-Sleep -Seconds 2
Push-Location (Join-Path $root "Games\hack-the-sudoku\frontend")
if (-not (Test-Path "node_modules")) { npm install }
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", "cd '$pwd'; npm run dev -- --host 127.0.0.1 --port 4011"
Pop-Location

# 3) BLACK_BOX / Frogger — config API + Vite
Push-Location (Join-Path $root "BLACK_BOX\game\config-api")
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", "cd '$pwd'; node server.js"
Pop-Location
Start-Sleep -Seconds 1
Push-Location (Join-Path $root "BLACK_BOX\game")
if (-not (Test-Path "node_modules")) { npm install }
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", "cd '$pwd'; npm run dev -- --host 127.0.0.1 --port 4010"
Pop-Location

Write-Host "Started (minimized windows). Open:"
Write-Host "  Games hub:        http://127.0.0.1:4005/"
Write-Host "  Hack the Sudoku:  http://127.0.0.1:4011/  (API http://127.0.0.1:8080/)"
Write-Host "  Frogger (BLACK_BOX): http://127.0.0.1:4010/  (config http://127.0.0.1:5000/api/game-config)"
Write-Host "Docker alternative:  docker compose up -d --build  (in each of Games, Games\hack-the-sudoku, BLACK_BOX\game)"
