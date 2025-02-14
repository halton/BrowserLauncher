!macro customInstall
  WriteRegStr HKCR "Browser Launcher" "" "Browser Launcher"
  WriteRegStr HKCR "Browser Launcher\DefaultIcon" "" "$INSTDIR\Browser Launcher.exe"
!macroend