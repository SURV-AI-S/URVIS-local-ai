@echo off
setlocal

rem Edit these paths for your machine.
set "OLLAMA_DIR="
set "WEB_DIR=G:\URVIS\ollama-chat-ui-github"
set "WEB_PORT=3000"

rem Optional: stop an old Ollama process before starting a fresh one.
rem Remove the next line if you prefer to manage Ollama yourself.
taskkill /IM ollama.exe /F >nul 2>nul

if not "%OLLAMA_DIR%"=="" (
  if exist "%OLLAMA_DIR%\start-ollama.bat" (
    echo Starting Ollama from %OLLAMA_DIR%
    start "Ollama" "%OLLAMA_DIR%\start-ollama.bat"
  ) else (
    echo start-ollama.bat was not found in %OLLAMA_DIR%
    echo Edit OLLAMA_DIR at the top of this file or start Ollama manually.
  )
) else (
  echo OLLAMA_DIR is empty. Start Ollama manually or edit this script.
)

if not exist "%WEB_DIR%" (
  echo Web directory not found: %WEB_DIR%
  echo Edit WEB_DIR at the top of this file.
  pause
  exit /b 1
)

cd /d "%WEB_DIR%"
echo Starting web UI at http://127.0.0.1:%WEB_PORT%
start "URVIS Local AI Web Server" cmd /k py -m http.server %WEB_PORT%
start "" "http://127.0.0.1:%WEB_PORT%"

endlocal
