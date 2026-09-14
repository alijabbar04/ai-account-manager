!macro customFinishPage
  ; Defining customFinishPage replaces electron-builder's entire default finish
  ; page, so its "run the app when I'm done" behaviour is reproduced verbatim
  ; here before the extra checkbox is added.
  Function StartApp
    ${if} ${isUpdated}
      StrCpy $1 "--updated"
    ${else}
      StrCpy $1 ""
    ${endif}
    ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
  FunctionEnd

  ; This app is a dashboard over Claude Code (required), the Codex CLI and VS
  ; Code (both optional), and a new machine has none of them.
  ;
  ; The checkbox is UNCHECKED by default and only opens a visible PowerShell
  ; window running install-prerequisites.ps1, which lists what is missing, names
  ; the vendor packages, and asks again before installing anything. Installing
  ; other companies' software is a choice the user makes twice, on purpose -
  ; never a silent side effect of installing this app.
  Function InstallPrerequisites
    ExecShell "open" "powershell.exe" \
      '-NoExit -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\install-prerequisites.ps1"'
  FunctionEnd

  !define MUI_FINISHPAGE_RUN
  !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"

  !define MUI_FINISHPAGE_SHOWREADME
  !define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
  ; Keep this short: the finish-page checkbox label is clipped at roughly 30
  ; characters, and a truncated label reads as a bug. The script it opens
  ; explains what it would install.
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Install Claude Code and tools"
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION "InstallPrerequisites"

  !insertmacro MUI_PAGE_FINISH
!macroend

!macro customUnInstall
  ; Stop the per-user sidecar if an uninstall is started while the app is open.
  nsExec::ExecToLog '"$SYSDIR\taskkill.exe" /F /IM "AIAccountManager.Automation.exe"'

  ; Electron's user-level start-at-login entry must not outlive the app.
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "AI Account Manager"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ai-account-manager-desktop"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Claude Account Manager"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "claude-account-manager-desktop"

  ; Remove launcher metadata and stale locks, while deliberately preserving
  ; browser-profiles because they contain vendor-owned signed-in sessions.
  Delete "$APPDATA\ClaudeAccountManager\automation\session-profiles.json"
  RMDir /r "$APPDATA\ClaudeAccountManager\automation\profile-locks"

  ; Claude Code, the Codex CLI and VS Code are deliberately NOT uninstalled.
  ; This app may have offered to install them, but they are independent tools
  ; the user may well be using elsewhere - removing them here would be
  ; presumptuous and destructive.
!macroend
