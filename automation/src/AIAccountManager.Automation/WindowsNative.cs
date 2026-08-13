using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using Microsoft.Win32.SafeHandles;

namespace AIAccountManager.Automation;

internal static class WindowsNative
{
    internal const uint ProcessQueryLimitedInformation = 0x1000;
    internal const uint TokenQuery = 0x0008;
    internal const uint WineventOutOfContext = 0x0000;
    internal const uint EventSystemForeground = 0x0003;
    internal const uint EventObjectShow = 0x8002;
    internal const uint EventObjectNameChange = 0x800C;
    internal const uint GaRoot = 2;
    internal const int ObjidWindow = 0;
    internal const int ObjidClient = unchecked((int)0xFFFFFFFC);
    private const uint DesktopReadObjects = 0x0001;
    private const int UoiName = 2;
    private const int ErrorInsufficientBuffer = 122;
    private const int AppmodelErrorNoPackage = 15700;

    internal delegate void WinEventDelegate(
        IntPtr hook,
        uint eventType,
        IntPtr hwnd,
        int objectId,
        int childId,
        uint eventThread,
        uint eventTime);

    internal delegate bool EnumWindowsDelegate(IntPtr hwnd, IntPtr parameter);

    [StructLayout(LayoutKind.Sequential)]
    internal struct Point
    {
        internal int X;
        internal int Y;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct TokenElevation
    {
        internal int TokenIsElevated;
    }

    private enum TokenInformationClass
    {
        TokenElevation = 20,
        TokenIntegrityLevel = 25,
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct SidAndAttributes
    {
        internal IntPtr Sid;
        internal int Attributes;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private sealed class WinTrustFileInfo : IDisposable
    {
        internal uint StructSize = (uint)Marshal.SizeOf<WinTrustFileInfo>();
        internal IntPtr FilePath;
        internal IntPtr FileHandle = IntPtr.Zero;
        internal IntPtr KnownSubject = IntPtr.Zero;

        internal WinTrustFileInfo(string filePath)
        {
            FilePath = Marshal.StringToCoTaskMemUni(filePath);
        }

        public void Dispose()
        {
            if (FilePath != IntPtr.Zero)
            {
                Marshal.FreeCoTaskMem(FilePath);
                FilePath = IntPtr.Zero;
            }
        }
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private sealed class WinTrustData : IDisposable
    {
        internal uint StructSize = (uint)Marshal.SizeOf<WinTrustData>();
        internal IntPtr PolicyCallbackData = IntPtr.Zero;
        internal IntPtr SipClientData = IntPtr.Zero;
        internal uint UiChoice = 2;
        internal uint RevocationChecks = 0;
        internal uint UnionChoice = 1;
        internal IntPtr FileInfoPtr;
        internal uint StateAction = 0;
        internal IntPtr StateData = IntPtr.Zero;
        internal string? UrlReference = null;
        internal uint ProviderFlags = 0x00000100;
        internal uint UiContext = 0;

        internal WinTrustData(WinTrustFileInfo fileInfo)
        {
            FileInfoPtr = Marshal.AllocCoTaskMem(Marshal.SizeOf<WinTrustFileInfo>());
            Marshal.StructureToPtr(fileInfo, FileInfoPtr, false);
        }

        public void Dispose()
        {
            if (FileInfoPtr != IntPtr.Zero)
            {
                Marshal.DestroyStructure<WinTrustFileInfo>(FileInfoPtr);
                Marshal.FreeCoTaskMem(FileInfoPtr);
                FileInfoPtr = IntPtr.Zero;
            }
        }
    }

    [DllImport("user32.dll")]
    internal static extern IntPtr SetWinEventHook(
        uint eventMinimum,
        uint eventMaximum,
        IntPtr eventHook,
        WinEventDelegate callback,
        uint processId,
        uint threadId,
        uint flags);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool UnhookWinEvent(IntPtr hook);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool EnumWindows(EnumWindowsDelegate callback, IntPtr parameter);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool IsWindowVisible(IntPtr hwnd);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr hwnd, StringBuilder text, int maximum);

    [DllImport("user32.dll")]
    internal static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint processId);

    [DllImport("user32.dll")]
    internal static extern IntPtr GetAncestor(IntPtr hwnd, uint flags);

    [DllImport("user32.dll")]
    internal static extern IntPtr WindowFromPoint(Point point);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool GetCursorPos(out Point point);

    [DllImport("user32.dll")]
    private static extern IntPtr OpenInputDesktop(uint flags, bool inherit, uint desiredAccess);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CloseDesktop(IntPtr desktop);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetUserObjectInformation(
        IntPtr handle,
        int index,
        StringBuilder information,
        int length,
        out int needed);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern IntPtr OpenProcess(uint desiredAccess, bool inherit, uint processId);

    [DllImport("kernel32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CloseHandle(IntPtr handle);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetPackageFamilyName(
        IntPtr process,
        ref uint packageFamilyNameLength,
        StringBuilder? packageFamilyName);

    [DllImport("advapi32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool OpenProcessToken(IntPtr process, uint desiredAccess, out IntPtr token);

    [DllImport("advapi32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetTokenInformation(
        IntPtr token,
        TokenInformationClass informationClass,
        IntPtr information,
        int informationLength,
        out int returnLength);

    [DllImport("advapi32.dll")]
    private static extern IntPtr GetSidSubAuthorityCount(IntPtr sid);

    [DllImport("advapi32.dll")]
    private static extern IntPtr GetSidSubAuthority(IntPtr sid, uint index);

    [DllImport("wintrust.dll", ExactSpelling = true, PreserveSig = true)]
    private static extern int WinVerifyTrust(
        IntPtr hwnd,
        [MarshalAs(UnmanagedType.LPStruct)] Guid actionId,
        WinTrustData data);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool GetNamedPipeClientProcessId(
        SafePipeHandle pipe,
        out uint clientProcessId);

    internal static IEnumerable<IntPtr> TopLevelWindows()
    {
        var windows = new List<IntPtr>();
        EnumWindows((hwnd, _) =>
        {
            if (hwnd != IntPtr.Zero && IsWindowVisible(hwnd)) windows.Add(hwnd);
            return true;
        }, IntPtr.Zero);
        return windows;
    }

    internal static string WindowTitle(IntPtr hwnd)
    {
        var builder = new StringBuilder(512);
        _ = GetWindowText(hwnd, builder, builder.Capacity);
        return Redactor.Text(builder.ToString(), 120);
    }

    internal static bool IsDefaultInputDesktop()
    {
        var desktop = OpenInputDesktop(0, false, DesktopReadObjects);
        if (desktop == IntPtr.Zero) return false;
        try
        {
            var name = new StringBuilder(128);
            return GetUserObjectInformation(desktop, UoiName, name, name.Capacity, out _) &&
                   name.ToString().Equals("Default", StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            CloseDesktop(desktop);
        }
    }

    internal static ProcessIdentitySnapshot CaptureIdentity(int processId)
    {
        string processName = string.Empty;
        string executablePath = string.Empty;
        try
        {
            using var process = Process.GetProcessById(processId);
            processName = Redactor.Label(process.ProcessName, 80);
            executablePath = Path.GetFullPath(process.MainModule?.FileName ?? string.Empty);
        }
        catch
        {
            // An inaccessible or exiting process never becomes trusted.
        }

        var packageFamily = PackageFamily(processId);
        var (signatureValid, publisher) = Signature(executablePath);
        var (isElevated, integrity) = Integrity(processId);
        return new ProcessIdentitySnapshot(
            processId,
            processName,
            executablePath,
            Redactor.Text(publisher, 180),
            Redactor.Label(packageFamily, 120),
            signatureValid,
            integrity,
            isElevated,
            !IsDefaultInputDesktop());
    }

    private static string PackageFamily(int processId)
    {
        var process = OpenProcess(ProcessQueryLimitedInformation, false, (uint)processId);
        if (process == IntPtr.Zero) return string.Empty;
        try
        {
            uint length = 0;
            var result = GetPackageFamilyName(process, ref length, null);
            if (result == AppmodelErrorNoPackage) return string.Empty;
            if (result != ErrorInsufficientBuffer || length is 0 or > 512) return string.Empty;
            var builder = new StringBuilder((int)length);
            return GetPackageFamilyName(process, ref length, builder) == 0
                ? builder.ToString()
                : string.Empty;
        }
        finally
        {
            CloseHandle(process);
        }
    }

    private static (bool IsElevated, string Integrity) Integrity(int processId)
    {
        var process = OpenProcess(ProcessQueryLimitedInformation, false, (uint)processId);
        if (process == IntPtr.Zero) return (true, "unknown");
        try
        {
            if (!OpenProcessToken(process, TokenQuery, out var token)) return (true, "unknown");
            try
            {
                var elevationSize = Marshal.SizeOf<TokenElevation>();
                var elevationPtr = Marshal.AllocHGlobal(elevationSize);
                try
                {
                    var elevated = !GetTokenInformation(token, TokenInformationClass.TokenElevation,
                        elevationPtr, elevationSize, out _) ||
                        Marshal.PtrToStructure<TokenElevation>(elevationPtr).TokenIsElevated != 0;
                    var integrity = ReadIntegrity(token);
                    return (elevated, integrity);
                }
                finally
                {
                    Marshal.FreeHGlobal(elevationPtr);
                }
            }
            finally
            {
                CloseHandle(token);
            }
        }
        finally
        {
            CloseHandle(process);
        }
    }

    private static string ReadIntegrity(IntPtr token)
    {
        _ = GetTokenInformation(token, TokenInformationClass.TokenIntegrityLevel,
            IntPtr.Zero, 0, out var needed);
        if (needed <= 0) return "unknown";
        var buffer = Marshal.AllocHGlobal(needed);
        try
        {
            if (!GetTokenInformation(token, TokenInformationClass.TokenIntegrityLevel,
                    buffer, needed, out _)) return "unknown";
            var sid = Marshal.PtrToStructure<SidAndAttributes>(buffer).Sid;
            var count = Marshal.ReadByte(GetSidSubAuthorityCount(sid));
            var rid = (uint)Marshal.ReadInt32(GetSidSubAuthority(sid, (uint)(count - 1)));
            return rid switch
            {
                >= 0x4000 => "system",
                >= 0x3000 => "high",
                >= 0x2000 => "medium",
                >= 0x1000 => "low",
                _ => "untrusted",
            };
        }
        finally
        {
            Marshal.FreeHGlobal(buffer);
        }
    }

    private static (bool Valid, string Publisher) Signature(string executablePath)
    {
        if (string.IsNullOrWhiteSpace(executablePath) || !File.Exists(executablePath))
            return (false, string.Empty);
        var valid = false;
        try
        {
            using var file = new WinTrustFileInfo(executablePath);
            using var data = new WinTrustData(file);
            valid = WinVerifyTrust(IntPtr.Zero,
                new Guid("00AAC56B-CD44-11d0-8CC2-00C04FC295EE"), data) == 0;
        }
        catch
        {
            valid = false;
        }

        try
        {
            using var certificate = new X509Certificate2(X509Certificate.CreateFromSignedFile(executablePath));
            return (valid, certificate.Subject);
        }
        catch
        {
            return (false, string.Empty);
        }
    }
}
