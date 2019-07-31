REM = 0; /*
@echo off
cls
title %~f0
cd %~dp0
if "%PROCESSOR_ARCHITECTURE%" EQU "x86" (
  call cscript.exe "%~f0" //Nologo //E:JScript "%~f0" %*
)
if "%PROCESSOR_ARCHITECTURE%" NEQ "x86" (
  call C:\Windows\SysWOW64\CScript.exe "%~f0" //Nologo //E:JScript "%~f0" %*
)
goto LBL_END
*/
var document = new ActiveXObject('htmlfile');
document.write(
  '<!DOCTYPE html><html><head><meta http-equiv=X-UA-Compatible content="IE=edge"><title></title></head><body></body></html>'
);
var window = document.parentWindow;
window.WScript = WScript;
window.GetObject = GetObject;
window.ActiveXObject = ActiveXObject;

var src = '{{source}}';
src = window.decodeURIComponent(window.escape(window.atob(src)));

var script = document.createElement('script');
script.text = src;
window.addEventListener('error', function(e) {
  if (e.error) {
    WScript.Echo(e.error.stack);
  } else {
    if (e.message) WScript.Echo(' Error:' + e.message);
    WScript.Echo('  line:', e.lineno);
    WScript.Echo('column:', e.colno);
  }
});
document.head.appendChild(script);
/*
:LBL_END
pause
exit
::*/
