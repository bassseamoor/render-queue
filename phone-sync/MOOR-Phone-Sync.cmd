@echo off
REM Pull apps from your phone into this PC's Moor. First run asks for
REM your Moor folder and a GitHub token, then remembers them.
python "%~dp0phone-sync.py"
pause
