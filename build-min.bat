@echo off
cd "%~dp0"

for %%a in (%*) do set /a num+=1

if not defined num goto end

if not %~x1 == .js goto end

set ROLLUP_INPUT=%~f1
set ROLLUP_MIN=true

call npm run build

:end

pause
exit