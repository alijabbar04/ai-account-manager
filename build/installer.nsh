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
!macroend
