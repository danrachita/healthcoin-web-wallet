@echo off
tasklist /fi "imagename eq healthcoind.exe" | find /i "healthcoind.exe" > nul
if not errorlevel 1 (echo 1) else (
  echo 0
)
