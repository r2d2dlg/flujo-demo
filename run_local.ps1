# --- Instructions ---
Write-Host "--- Local Development Setup ---" -ForegroundColor Yellow
Write-Host "This script will install dependencies and start the backend and frontend servers."
Write-Host "IMPORTANT: Before running, make sure you have created:"
Write-Host "1. A '.env' file in the 'backend' directory with your database credentials."
Write-Host "2. A '.env.local' file in the 'frontend' directory with VITE_API_BASE_URL=http://localhost:8000"
Write-Host "---------------------------------"
Read-Host -Prompt "Press Enter to continue if you have created the files"

# --- Backend Setup ---
Write-Host "`n📦 Setting up backend..." -ForegroundColor Cyan
if (-not (Test-Path "backend/requirements.txt")) {
    Write-Host "❌ backend/requirements.txt not found!" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 'python' command not found. Please make sure Python is installed and in your PATH." -ForegroundColor Red
    exit 1
}
Write-Host "Installing backend dependencies from requirements.txt..."
python -m pip install -r backend/requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed." -ForegroundColor Green

# --- Frontend Setup ---
Write-Host "`n🎨 Setting up frontend..." -ForegroundColor Cyan
if (-not (Test-Path "frontend/package.json")) {
    Write-Host "❌ frontend/package.json not found!" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 'npm' command not found. Please make sure Node.js and npm are installed and in your PATH." -ForegroundColor Red
    exit 1
}
Write-Host "Installing frontend dependencies..."
Push-Location -Path "frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies." -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Frontend dependencies installed." -ForegroundColor Green
Pop-Location

# --- Start Servers ---
Write-Host "`n🚀 Starting servers..." -ForegroundColor Green

# Start Backend in a new PowerShell window
Write-Host "Starting backend server... (A new window will open)"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Write-Host '--- Backend Server ---'; cd backend; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# Start Frontend in a new PowerShell window
Write-Host "Starting frontend server... (A new window will open)"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Write-Host '--- Frontend Server ---'; cd frontend; npm run dev"

Write-Host "`n🎉 Setup complete! Your local environment should be up and running shortly."
Write-Host "Backend will be available at http://localhost:8000"
Write-Host "Frontend will be available at http://localhost:5173 (or another port if 5173 is busy)." 