param([Parameter(Mandatory=$true)][int]$OwnerId)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
# No credentials or command lines are read. Only path, PID, parent and start time.
# Standard Windows PowerShell compiles P/Invoke; no installed .NET SDK is needed.
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
public class AamQuietNative {
  public class Row { public int pid; public int parentPid; public string startedAt; public string name; public string executablePath; }
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  struct Entry { public uint size, usage, pid; public UIntPtr heap; public uint module, threads, parent; public int priority; public uint flags; [MarshalAs(UnmanagedType.ByValTStr, SizeConst=260)] public string exe; }
  [StructLayout(LayoutKind.Sequential)] struct Power { public uint Version, ControlMask, StateMask; }
  delegate bool WindowCallback(IntPtr hwnd, IntPtr arg);
  [StructLayout(LayoutKind.Sequential)] struct LastInput { public uint Size, Tick; }
  [DllImport("user32.dll")] static extern bool GetLastInputInfo(ref LastInput input);
  static uint launchInput;
  static int launchTick;
  [DllImport("kernel32.dll", SetLastError=true)] static extern IntPtr CreateToolhelp32Snapshot(uint flags, uint pid);
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode)] static extern bool Process32FirstW(IntPtr h, ref Entry entry);
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode)] static extern bool Process32NextW(IntPtr h, ref Entry entry);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
  [DllImport("kernel32.dll")] static extern bool SetProcessInformation(IntPtr h, int kind, ref Power power, uint size);
  [DllImport("kernel32.dll")] static extern bool GetProcessInformation(IntPtr h, int kind, ref Power power, uint size);
  [DllImport("user32.dll")] static extern bool EnumWindows(WindowCallback callback, IntPtr arg);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
  [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr hwnd, int mode);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hwnd);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr hwnd, uint msg, IntPtr wparam, IntPtr lparam);
  public static readonly ConcurrentQueue<string> Input = new ConcurrentQueue<string>();
  public static volatile bool InputClosed;
  public static bool Degraded;
  class Saved { public string Started; public ProcessPriorityClass Priority; public Power Power; public bool HasPower; }
  static Dictionary<int,Saved> saved = new Dictionary<int,Saved>();
  public static void StartReader() {
    var thread = new Thread(() => { try { string line; while ((line=Console.ReadLine()) != null) Input.Enqueue(line); } catch {} finally { InputClosed=true; } });
    thread.IsBackground=true; thread.Start();
  }
  public static string Read() { string line; return Input.TryDequeue(out line) ? line : null; }
  public static Row[] Snapshot() {
    IntPtr h=IntPtr.Zero;
    try {
      h=CreateToolhelp32Snapshot(2,0);
      if(h==new IntPtr(-1)) throw new InvalidOperationException();
      Entry e=new Entry(); e.size=(uint)Marshal.SizeOf(typeof(Entry));
      if(!Process32FirstW(h,ref e)) throw new InvalidOperationException();
      var rows=new List<Row>();
      do {
        if(!String.Equals(e.exe,"Antigravity.exe",StringComparison.OrdinalIgnoreCase) && !String.Equals(e.exe,"language_server.exe",StringComparison.OrdinalIgnoreCase)) continue;
        try { using(var p=Process.GetProcessById((int)e.pid)) {
          rows.Add(new Row { pid=p.Id, parentPid=(int)e.parent, startedAt=p.StartTime.ToUniversalTime().Ticks.ToString(), name=e.exe, executablePath=p.MainModule.FileName });
        }} catch { throw new InvalidOperationException("Process identity unavailable"); }
      } while(Process32NextW(h,ref e));
      return rows.ToArray();
    } finally { if(h!=IntPtr.Zero && h!=new IntPtr(-1)) { try { CloseHandle(h); } catch {} } }
  }
  static Process Verified(Row r) {
    try { var p=Process.GetProcessById(r.pid);
      // Pin the original kernel object before validation; Kill/priority calls
      // must not reopen a reused numeric PID after its previous owner exits.
      try { var pinned=p.Handle; } catch { p.Dispose(); return null; }
      if(p.StartTime.ToUniversalTime().Ticks.ToString()==r.startedAt && String.Equals(p.MainModule.FileName,r.executablePath,StringComparison.OrdinalIgnoreCase)) return p;
      p.Dispose();
    } catch {} return null;
  }
  public static Row Launch(string exe) {
    try { var input=new LastInput { Size=8 }; GetLastInputInfo(ref input); launchInput=input.Tick; launchTick=Environment.TickCount; } catch {}
    // ShellExecute honours SW_HIDE; exact executable, no shell command or args.
    var start=new ProcessStartInfo(exe); start.UseShellExecute=true; start.WindowStyle=ProcessWindowStyle.Hidden;
    using(var p=Process.Start(start)) {
      if(p==null) return null;
      return new Row { pid=p.Id, parentPid=Process.GetCurrentProcess().Id, startedAt=p.StartTime.ToUniversalTime().Ticks.ToString(), name="Antigravity.exe", executablePath=exe };
    }
  }
  public static void Windows(Row[] rows, int mode) {
    if(mode==0 && Degraded) mode=7;
    try { if(!EnumWindows((hwnd,arg) => {
      try { uint id; GetWindowThreadProcessId(hwnd,out id);
        foreach(var row in rows) if(row.pid==id) {
          using(var p=Verified(row)) { if(p==null) break;
            if(mode==-1) { PostMessage(hwnd,0x0010,IntPtr.Zero,IntPtr.Zero); }
            else {
              try { ShowWindow(hwnd,mode);
                // ShowWindow returns previous visibility, not success.
                if(mode==0 && IsWindowVisible(hwnd)) { Degraded=true; ShowWindow(hwnd,7); }
              } catch { Degraded=true; try { ShowWindow(hwnd,7); } catch {} }
            }
          } break;
        }
      } catch {} return true;
    },IntPtr.Zero)) throw new InvalidOperationException(); } catch {
      Degraded=true;
      foreach(var row in rows) try { using(var p=Verified(row)) if(p!=null && mode!=-1) ShowWindow(p.MainWindowHandle,7); } catch {}
    }
  }
  public static bool Foreground(Row[] rows) {
    try {
      // An automatic Electron re-show is not a user handover. Require recent
      // keyboard/mouse input newer than the launch and a foreground owned HWND.
      var input=new LastInput { Size=8 };
      if(!GetLastInputInfo(ref input) || input.Tick==launchInput || unchecked((uint)Environment.TickCount-input.Tick)>1500 || unchecked((int)(input.Tick-(uint)launchTick))<0) return false;
      uint id; GetWindowThreadProcessId(GetForegroundWindow(),out id);
      foreach(var row in rows) if(row.pid==id) { using(var p=Verified(row)) { if(p!=null) return true; } }
    } catch {} return false;
  }
  public static void Throttle(Row[] rows, bool restore) {
    foreach(var row in rows) try { using(var p=Verified(row)) {
      if(p==null) continue;
      Saved old;
      if(restore) {
        if(saved.TryGetValue(row.pid,out old) && old.Started==row.startedAt) {
          try { p.PriorityClass=(old.Priority==ProcessPriorityClass.Idle || old.Priority==ProcessPriorityClass.BelowNormal) ? ProcessPriorityClass.Normal : old.Priority; } catch {}
          try { var power=old.Power; if(!old.HasPower) power=new Power { Version=1 };
            // Children may inherit EcoQoS from the background parent.
            power.ControlMask |= 1; power.StateMask &= ~1u;
            SetProcessInformation(p.Handle,4,ref power,12); } catch {}
        }
        saved.Remove(row.pid); continue;
      }
      if(!saved.TryGetValue(row.pid,out old) || old.Started!=row.startedAt) {
        old=new Saved { Started=row.startedAt, Priority=p.PriorityClass, Power=new Power { Version=1 } };
        try { old.HasPower=GetProcessInformation(p.Handle,4,ref old.Power,12); } catch {}
        saved[row.pid]=old;
      }
      try { p.PriorityClass=ProcessPriorityClass.Idle; } catch { try { p.PriorityClass=ProcessPriorityClass.BelowNormal; } catch { Degraded=true; } }
      try { var power=new Power { Version=1, ControlMask=1, StateMask=1 }; if(!SetProcessInformation(p.Handle,4,ref power,12)) Degraded=true; } catch { Degraded=true; }
      if(Degraded) Windows(new Row[] {row},7);
    }} catch { Degraded=true; Windows(new Row[] {row},7); }
  }
  public static void Force(Row[] rows) {
    foreach(var row in rows) try { using(var p=Verified(row)) if(p!=null) p.Kill(); } catch {}
  }
}
'@
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
try { $owner = Get-Process -Id $OwnerId; $ownerStart = $owner.StartTime.ToUniversalTime().Ticks } catch { exit }
[AamQuietNative]::StartReader()
$owned = @{}
$exe = $null
$launchedAt = $null
$activated = $false
$closingAt = $null
$lastThrottle = [datetime]::MinValue
$done = $false
function Get-Owned { return ,([AamQuietNative+Row[]]@($owned.Values)) }
function Release-Owned {
  $script:activated = $true
  [AamQuietNative]::Throttle((Get-Owned), $true)
  [AamQuietNative]::Windows((Get-Owned), 5)
  $script:owned.Clear()
}
function Refresh-Owned {
  $rows = [AamQuietNative]::Snapshot()
  foreach ($key in @($script:owned.Keys)) {
    if (-not @($rows | Where-Object { ($_.pid.ToString() + ':' + $_.startedAt) -eq $key }).Count) { $script:owned.Remove($key) }
  }
  do {
    $added = $false
    foreach ($row in $rows) {
      $key = $row.pid.ToString() + ':' + $row.startedAt
      if ($script:owned.ContainsKey($key)) { continue }
      $server = if ($script:exe) { Join-Path (Split-Path $script:exe) 'resources\bin\language_server.exe' } else { '' }
      if (($row.executablePath -ieq $script:exe -or $row.executablePath -ieq $server) -and
          @($script:owned.Values | Where-Object { $_.pid -eq $row.parentPid -and [long]$_.startedAt -le [long]$row.startedAt }).Count) {
        $script:owned[$key] = $row
        $added = $true
      }
    }
  } while ($added)
  if ($script:owned.Count -gt 0) {
    $outside = @($rows | Where-Object { $_.executablePath -ieq $script:exe -and -not $script:owned.ContainsKey($_.pid.ToString() + ':' + $_.startedAt) }).Count -gt 0
    # Foreground plus fresh input detects reuse of Electron\'s existing window,
    # while automatic re-show remains subject to the sixty-second hide loop.
    # Only a separate user-started Antigravity process releases ownership now.
    # Focus is not used: Antigravity takes focus by itself while starting, which
    # wrongly handed the hidden copy back. "Open Antigravity" on the card shows it.
    if ($outside) { Release-Owned }
  }
  return @($rows)
}
try {
  while (-not $done) {
    try {
      $alive = $false
      try { $p = Get-Process -Id $OwnerId; $alive = $p.StartTime.ToUniversalTime().Ticks -eq $ownerStart } catch {}
      if ((-not $alive -or [AamQuietNative]::InputClosed) -and -not $closingAt) {
        $closingAt = [datetime]::UtcNow
        [AamQuietNative]::Windows((Get-Owned), -1)
      }
      $rows = @(Refresh-Owned)
      if ($closingAt -and ([datetime]::UtcNow - $closingAt).TotalSeconds -ge 5) {
        [AamQuietNative]::Force((Get-Owned)); $owned.Clear(); break
      }
      if ($owned.Count -gt 0 -and -not $closingAt) {
        if (([datetime]::UtcNow - $launchedAt).TotalSeconds -lt 60) { [AamQuietNative]::Windows((Get-Owned), 0) }
        if (([datetime]::UtcNow - $launchedAt).TotalSeconds -lt 180 -and ([datetime]::UtcNow - $lastThrottle).TotalSeconds -ge 1) {
          [AamQuietNative]::Throttle((Get-Owned), $false); $lastThrottle = [datetime]::UtcNow
        }
      }
    } catch {
      # Discovery/Win32 failure must never broaden ownership. Minimise known
      # windows and continue; the next successful snapshot revalidates identities.
      [AamQuietNative]::Windows((Get-Owned), 7)
    }
    # A denied snapshot cannot suppress owner-death cleanup indefinitely.
    if ($closingAt -and ([datetime]::UtcNow - $closingAt).TotalSeconds -ge 5) {
      [AamQuietNative]::Force((Get-Owned)); $owned.Clear(); break
    }
    $line = [AamQuietNative]::Read()
    if ($line) {
      $request = $null
      try {
        $request = $line | ConvertFrom-Json
        $result = $null
        switch ($request.action) {
          'snapshot' { $result = @{ processes = @(Refresh-Owned); activated = $activated } }
          'launch' {
            if ($owned.Count -eq 0 -and -not $activated -and -not $closingAt) {
              $candidate = [IO.Path]::GetFullPath([string]$request.executable)
              if ((Split-Path $candidate -Leaf) -ine 'Antigravity.exe' -or -not (Test-Path -LiteralPath $candidate -PathType Leaf)) { throw 'Invalid executable' }
              $rows = [AamQuietNative]::Snapshot()
              if (-not @($rows | Where-Object { $_.executablePath -ieq $candidate }).Count) {
                $exe = $candidate
                $root = [AamQuietNative]::Launch($exe)
                if ($root) {
                  $owned[$root.pid.ToString() + ':' + $root.startedAt] = $root
                  $launchedAt = [datetime]::UtcNow
                  [AamQuietNative]::Windows((Get-Owned), 0)
                  [AamQuietNative]::Throttle((Get-Owned), $false)
                  $result = $root
                }
              }
            }
          }
          'manage' {
            # Ignore caller PIDs: the helper independently derives the owned tree.
            $null = Refresh-Owned
            if ($request.hide) { [AamQuietNative]::Windows((Get-Owned), 0) }
            if ($request.throttle) { [AamQuietNative]::Throttle((Get-Owned), $false) }
          }
          'release' { Release-Owned }
          'close' {
            $null = Refresh-Owned
            [AamQuietNative]::Windows((Get-Owned), -1)
            if (-not $closingAt) { $closingAt = [datetime]::UtcNow }
          }
          'force' { $null = Refresh-Owned; [AamQuietNative]::Force((Get-Owned)); $owned.Clear() }
          'stop' { if ($owned.Count -gt 0) { throw 'Still managed' }; $done = $true }
          default { throw 'Unknown action' }
        }
        @{ id = $request.id; ok = $true; result = $result } | ConvertTo-Json -Depth 6 -Compress | ForEach-Object { [Console]::WriteLine($_) }
      } catch {
        if ($request) { [Console]::WriteLine((@{ id = $request.id; ok = $false } | ConvertTo-Json -Compress)) }
      }
    }
    if ($launchedAt -and ([datetime]::UtcNow - $launchedAt).TotalSeconds -ge 60) { Start-Sleep -Milliseconds 500 } else { Start-Sleep -Milliseconds 100 }
  }
} finally {
  if ($owned.Count -gt 0) {
    [AamQuietNative]::Windows((Get-Owned), -1)
    Start-Sleep -Seconds 5
    try { $null = Refresh-Owned } catch {}
    [AamQuietNative]::Force((Get-Owned))
  }
}
