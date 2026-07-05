@echo off
setlocal

echo Stopping ollama.exe if it is running...
taskkill /IM ollama.exe /F

echo.
echo Optional Python web server stop:
echo Killing python.exe may stop other Python servers or scripts on this machine.
choice /M "Stop python.exe processes too"
if errorlevel 2 goto done

taskkill /IM python.exe /F
taskkill /IM py.exe /F

:done
echo Done.
endlocal
