<#
.SYNOPSIS
    PC Diagnostic Collector Script
    Script ringan untuk mengumpulkan data diagnostik komputer Windows 10/11

.DESCRIPTION
    Script ini HANYA MEMBACA data komputer, TIDAK mengubah apapun.
    Data dikumpulkan dan disimpan sebagai file JSON di Desktop.

.NOTES
    - Tidak memerlukan instalasi apapun
    - Tidak memerlukan hak administrator
    - Output: File JSON di folder Desktop
    - Estimasi waktu: 30-60 detik
    - JANGAN Tutup jendela ini sampai selesai!

.AUTHOR
    PC Diagnostic Pro
.VERSION
    2.0.0
#>

# ============================================================
# SETUP: Pastikan window tidak tertutup otomatis
# ============================================================
try {
    # Set window title agar mudah dikenali
    $Host.UI.RawUI.WindowTitle = "PC Diagnostic Pro - Sedang Mengumpulkan Data..."

    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "  PC Diagnostic Pro - Data Collector v2.0" -ForegroundColor Cyan
    Write-Host "  Mengumpulkan data diagnostik komputer..." -ForegroundColor Cyan
    Write-Host "  JANGAN TUTUP jendela ini sampai selesai!" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""

    # ============================================================
    # Konfigurasi Output
    # ============================================================
    $OutputFolder = [Environment]::GetFolderPath("Desktop")
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $OutputFile = Join-Path $OutputFolder "pc-diagnostic-$Timestamp.json"

    $DiagnosticData = @{}

    # ============================================================
    # 1. SISTEM OPERASI
    # ============================================================
    Write-Host "[1/10] Sistem Operasi..." -ForegroundColor Yellow -NoNewline

    $OS = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction SilentlyContinue
    $ComputerSystem = Get-CimInstance -ClassName Win32_ComputerSystem -ErrorAction SilentlyContinue

    $DiagnosticData.computerName = if ($ComputerSystem.Name) { $ComputerSystem.Name } else { "Unknown" }
    $DiagnosticData.osVersion = if ($OS.Caption) { "$($OS.Caption)" } else { "Unknown" }
    $DiagnosticData.osBuild = if ($OS.BuildNumber) { $OS.BuildNumber } else { "Unknown" }
    $DiagnosticData.uptime = if ($OS.LastBootUpTime) {
        $uptime = (Get-Date) - $OS.LastBootUpTime
        "$($uptime.Days) hari $($uptime.Hours) jam $($uptime.Minutes) menit"
    } else { "Unknown" }

    Write-Host " OK" -ForegroundColor Green

    # ============================================================
    # 2. CPU
    # ============================================================
    Write-Host "[2/10] CPU / Prosesor..." -ForegroundColor Yellow -NoNewline

    $CPU = Get-CimInstance -ClassName Win32_Processor -ErrorAction SilentlyContinue

    $DiagnosticData.cpuModel = if ($CPU.Name) { $CPU.Name.Trim() } else { "Unknown" }
    $DiagnosticData.cpuCores = if ($CPU.NumberOfLogicalProcessors) { $CPU.NumberOfLogicalProcessors } else { 0 }

    # CPU Usage (sample over 2 seconds)
    try {
        $cpu1 = (Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction Stop).CounterSamples.CookedValue
        Start-Sleep -Seconds 2
        $cpu2 = (Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction Stop).CounterSamples.CookedValue
        $DiagnosticData.cpuUsage = [math]::Round(($cpu1 + $cpu2) / 2, 1)
    } catch {
        $DiagnosticData.cpuUsage = 0
    }

    # CPU Temperature (hanya jika tersedia)
    try {
        $Temp = Get-CimInstance -Namespace "root\wmi" -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop
        $DiagnosticData.cpuTemperature = [math]::Round(($Temp.CurrentTemperature[0] - 2732) / 10, 1)
    } catch {
        $DiagnosticData.cpuTemperature = 0
    }

    Write-Host " OK" -ForegroundColor Green

    # ============================================================
    # 3. RAM / MEMORY
    # ============================================================
    Write-Host "[3/10] RAM / Memori..." -ForegroundColor Yellow -NoNewline

    if ($OS) {
        $DiagnosticData.totalRAMMB = [math]::Round($OS.TotalVisibleMemorySize / 1024, 0)
        $DiagnosticData.availableRAMMB = [math]::Round($OS.FreePhysicalMemory / 1024, 0)
    } else {
        $DiagnosticData.totalRAMMB = 0
        $DiagnosticData.availableRAMMB = 0
    }

    Write-Host " OK" -ForegroundColor Green

    # ============================================================
    # 4. STORAGE / DISK
    # ============================================================
    Write-Host "[4/10] Storage / Disk..." -ForegroundColor Yellow -NoNewline

    $Disks = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DriveType=3" -ErrorAction SilentlyContinue
    $PhysicalDisks = Get-CimInstance -ClassName Win32_DiskDrive -ErrorAction SilentlyContinue

    $TotalStorageGB = 0
    $FreeStorageGB = 0
    $DiskInfo = @()

    foreach ($Disk in $Disks) {
        $TotalStorageGB += [math]::Round($Disk.Size / 1GB, 1)
        $FreeStorageGB += [math]::Round($Disk.FreeSpace / 1GB, 1)
        $DiskInfo += @{
            drive = $Disk.DeviceID
            totalGB = [math]::Round($Disk.Size / 1GB, 1)
            freeGB = [math]::Round($Disk.FreeSpace / 1GB, 1)
            usedPercent = if ($Disk.Size -gt 0) { [math]::Round((($Disk.Size - $Disk.FreeSpace) / $Disk.Size) * 100, 1) } else { 0 }
        }
    }

    $DiagnosticData.totalStorageGB = $TotalStorageGB
    $DiagnosticData.freeStorageGB = $FreeStorageGB
    $DiagnosticData.diskUsage = if ($DiskInfo.Count -gt 0) { ($DiskInfo | Measure-Object -Property usedPercent -Maximum).Maximum } else { 0 }

    # Disk Type
    $DiagnosticData.diskType = "Unknown"
    try {
        $MediaType = Get-CimInstance -ClassName Win32_DiskDrive | Select-Object -First 1 -ExpandProperty MediaType
        if ($MediaType -match "SSD|Solid State") { $DiagnosticData.diskType = "SSD" }
        elseif ($MediaType -match "Fixed hard") { $DiagnosticData.diskType = "HDD" }
    } catch {}

    # Disk Health
    $DiagnosticData.diskHealth = "OK"
    $DiagnosticData.smartWarnings = @()
    try {
        foreach ($pd in $PhysicalDisks) {
            if ($pd.Status -ne "OK") {
                $DiagnosticData.diskHealth = $pd.Status
                $DiagnosticData.smartWarnings += "Disk status: $($pd.Status)"
            }
        }
    } catch {}

    Write-Host " OK" -ForegroundColor Green

    # ============================================================
    # 5. GPU
    # ============================================================
    Write-Host "[5/10] GPU / VGA..." -ForegroundColor Yellow -NoNewline

    $GPU = Get-CimInstance -ClassName Win32_VideoController -ErrorAction SilentlyContinue | Select-Object -First 1

    $DiagnosticData.gpuModel = if ($GPU.Name) { $GPU.Name.Trim() } else { "Unknown" }
    $DiagnosticData.gpuDriver = if ($GPU.DriverVersion) { $GPU.DriverVersion } else { "Unknown" }
    $DiagnosticData.gpuTemperature = 0

    Write-Host " OK" -ForegroundColor Green

    # ============================================================
    # 6. JARINGAN / NETWORK
    # ============================================================
    Write-Host "[6/10] Jaringan / Internet..." -ForegroundColor Yellow -NoNewline

    $DiagnosticData.networkLatency = 0
    $DiagnosticData.packetLoss = 0

    try {
        $PingResult = New-Object System.Net.NetworkInformation.Ping
        $Reply = $PingResult.Send("8.8.8.8", 3000)
        $DiagnosticData.networkLatency = $Reply.RoundtripTime

        $Pings = 1..5 | ForEach-Object {
            try { $PingResult.Send("8.8.8.8", 2000) } catch { $null }
        }
        $FailedPings = ($Pings | Where-Object { $_ -eq $null -or $_.Status -ne "Success" }).Count
        $DiagnosticData.packetLoss = [math]::Round(($FailedPings / 5) * 100, 1)
    } catch {
        $DiagnosticData.networkLatency = -1
        $DiagnosticData.packetLoss = -1
    }

    $DiagnosticData.dnsStatus = "OK"
    try {
        $DnsTest = Resolve-DnsName "google.com" -ErrorAction Stop
    } catch {
        $DiagnosticData.dnsStatus = "FAIL"
    }

    Write-Host " OK" -ForegroundColor Green

    # ============================================================
    # 7. EVENT LOGS
    # ============================================================
    Write-Host "[7/10] Event Logs / Log Sistem..." -ForegroundColor Yellow -NoNewline

    $DiagnosticData.bsodHistory = @()
    $DiagnosticData.criticalEvents = 0
    $DiagnosticData.recentErrors = @()

    try {
        # BSOD from BugCheck source
        $BSODEvents = Get-EventLog -LogName System -Source "BugCheck" -ErrorAction SilentlyContinue |
            Select-Object -First 10 TimeGenerated, Message

        foreach ($bsod in $BSODEvents) {
            $code = ""
            if ($bsod.Message -match "0x([0-9a-fA-F]+)") { $code = $matches[1] }
            $DiagnosticData.bsodHistory += @{
                code = $code
                date = $bsod.TimeGenerated.ToString("yyyy-MM-dd HH:mm:ss")
            }
        }

        # Kernel power events (unexpected shutdown)
        $KernelBSOD = Get-WinEvent -FilterHashtable @{LogName="System"; ProviderName="Microsoft-Windows-Kernel-Power"; Id=41} -MaxEvents 5 -ErrorAction SilentlyContinue
        foreach ($event in $KernelBSOD) {
            $DiagnosticData.bsodHistory += @{
                code = "KERNEL_POWER_41"
                date = $event.TimeCreated.ToString("yyyy-MM-dd HH:mm:ss")
            }
        }

        # Critical events (last 7 days)
        $SevenDaysAgo = (Get-Date).AddDays(-7)
        $CriticalCount = (Get-WinEvent -FilterHashtable @{LogName="System"; Level=1; StartTime=$SevenDaysAgo} -ErrorAction SilentlyContinue | Measure-Object).Count
        $DiagnosticData.criticalEvents = $CriticalCount

        # Recent errors (last 24 hours)
        $OneDayAgo = (Get-Date).AddDays(-1)
        $ErrorEvents = Get-WinEvent -FilterHashtable @{LogName="System"; Level=2; StartTime=$OneDayAgo} -MaxEvents 10 -ErrorAction SilentlyContinue |
            Select-Object TimeCreated, ProviderName, Message

        foreach ($err in $ErrorEvents) {
            $DiagnosticData.recentErrors += @{
                source = $err.ProviderName
                message = if ($err.Message.Length -gt 200) { $err.Message.Substring(0, 200) } else { $err.Message }
                date = $err.TimeCreated.ToString("yyyy-MM-dd HH:mm:ss")
            }
        }
    } catch {
        Write-Host " (sebagian tidak tersedia)" -ForegroundColor DarkYellow -NoNewline
    }

    Write-Host " OK" -ForegroundColor Green

    # ============================================================
    # 8. SERVICES & STARTUP
    # ============================================================
    Write-Host "[8/10] Services & Startup..." -ForegroundColor Yellow -NoNewline

    $DiagnosticData.importantServices = @()

    $ImportantServiceNames = @(
        @{ Name = "Windows Update"; Service = "wuauserv" },
        @{ Name = "Security Center"; Service = "wscsvc" },
        @{ Name = "DNS Client"; Service = "Dnscache" },
        @{ Name = "SysMain"; Service = "SysMain" },
        @{ Name = "Windows Defender"; Service = "WinDefend" },
        @{ Name = "Remote Procedure Call"; Service = "RpcSs" },
        @{ Name = "Plug and Play"; Service = "PlugPlay" }
    )

    foreach ($svc in $ImportantServiceNames) {
        $Service = Get-Service -Name $svc.Service -ErrorAction SilentlyContinue
        if ($Service) {
            $DiagnosticData.importantServices += @{
                name = $svc.Name
                status = $Service.Status.ToString()
            }
        }
    }

    $DiagnosticData.startupPrograms = @()
    try {
        $StartupApps = Get-CimInstance -ClassName Win32_StartupCommand -ErrorAction SilentlyContinue
        foreach ($app in $StartupApps) {
            $DiagnosticData.startupPrograms += @{ name = $app.Name; enabled = $true }
        }
    } catch {}

    Write-Host " OK" -ForegroundColor Green

    # ============================================================
    # 9. ANTIVIRUS & SECURITY
    # ============================================================
    Write-Host "[9/10] Keamanan..." -ForegroundColor Yellow -NoNewline

    $DiagnosticData.antivirusEnabled = $false

    try {
        $AV = Get-CimInstance -Namespace "root\SecurityCenter2" -ClassName AntiVirusProduct -ErrorAction SilentlyContinue
        if ($AV) { $DiagnosticData.antivirusEnabled = $true }
    } catch {}

    $DiagnosticData.windowsUpdateStatus = "Unknown"
    try {
        $UpdateSession = New-Object -ComObject Microsoft.Update.Session -ErrorAction Stop
        $UpdateSearcher = $UpdateSession.CreateUpdateSearcher()
        $PendingUpdates = $UpdateSearcher.Search("IsInstalled=0 and Type='Software'")
        $DiagnosticData.windowsUpdateStatus = if ($PendingUpdates.Updates.Count -eq 0) { "Up to date" } else { "$($PendingUpdates.Updates.Count) updates pending" }
    } catch {
        $DiagnosticData.windowsUpdateStatus = "Cannot check"
    }

    Write-Host " OK" -ForegroundColor Green

    # ============================================================
    # 10. ADMIN CHECK
    # ============================================================
    Write-Host "[10/10] Info Sistem..." -ForegroundColor Yellow -NoNewline

    $IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    $DiagnosticData.sfcResult = "Not checked"
    $DiagnosticData.dismHealth = "Not checked"

    Write-Host " OK" -ForegroundColor Green

    # ============================================================
    # OUTPUT - Simpan ke file JSON
    # ============================================================
    Write-Host ""
    Write-Host "Menyimpan hasil..." -ForegroundColor Cyan

    $JSON = $DiagnosticData | ConvertTo-Json -Depth 5 -Compress:$false
    $JSON | Out-File -FilePath $OutputFile -Encoding UTF8 -Force

    $fileSize = (Get-Item $OutputFile -ErrorAction SilentlyContinue).Length
    if ($fileSize -gt 0) {
        Write-Host ""
        Write-Host "================================================" -ForegroundColor Green
        Write-Host "  BERHASIL!" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "  File JSON tersimpan di:" -ForegroundColor White
        Write-Host "  $OutputFile" -ForegroundColor Yellow
        Write-Host "  Ukuran: $([math]::Round($fileSize / 1KB, 1)) KB" -ForegroundColor White
        Write-Host ""
        Write-Host "  LANGKAH SELANJUTNYA:" -ForegroundColor Cyan
        Write-Host "  1. Kirim file ini ke admin / teknisi" -ForegroundColor White
        Write-Host "  2. Admin akan upload file ke PC Diagnostic Pro" -ForegroundColor White
        Write-Host "  3. Hasil analisis akan menunjukkan masalah & solusi" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "  ERROR: File tidak berhasil dibuat!" -ForegroundColor Red
        Write-Host "  Coba jalankan ulang sebagai Administrator." -ForegroundColor Yellow
        Write-Host ""
    }

} catch {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "  TERJADI ERROR!" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Pesan error:" -ForegroundColor Yellow
    Write-Host "  $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Solusi:" -ForegroundColor Yellow
    Write-Host "  1. Klik kanan file .bat > Run as Administrator" -ForegroundColor White
    Write-Host "  2. Pastikan komputer terhubung internet" -ForegroundColor White
    Write-Host "  3. Coba restart komputer lalu jalankan ulang" -ForegroundColor White
    Write-Host ""
}

# ============================================================
# JANGAN TUTUP - Tunggu user tekan tombol
# ============================================================
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tekan tombol APA SAJA untuk menutup jendela ini..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
