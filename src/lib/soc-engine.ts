// ============================================================
// SOC Diagnostic Engine v4.1 — Professional Threshold Analysis
// PC Diagnostic Pro
// ============================================================
// Mesin analisis bergaya SOC yang mengevaluasi telemetri PC
// berdasarkan ambang batas ketat + korelasi antar komponen.
// v4.1: Fixed false-positive pada Event 41/1001 saat count=0
// ============================================================

// ============================================================
// INTERFACES
// ============================================================

export interface SOCData {
  computerName?: string;
  osVersion?: string;
  osBuild?: string;
  uptime?: string;

  cpuModel?: string;
  cpuCores?: number;
  cpuUsage?: number;
  cpuTemperature?: number;

  totalRAMMB?: number;
  availableRAMMB?: number;
  pagesPerSec?: number;

  totalStorageGB?: number;
  freeStorageGB?: number;
  diskUsage?: number;
  diskType?: string;
  diskHealth?: string;
  diskQueueLength?: number;
  diskActiveTime?: number;
  diskError7Count?: number;
  diskError153Count?: number;
  smartWarnings?: string[];
  smartReallocatedSectors?: number;

  gpuModel?: string;
  gpuDriver?: string;
  gpuTemperature?: number;

  networkLatency?: number;
  packetLoss?: number;
  dnsStatus?: string;

  kernelPower41Last24h?: number;
  bugCheck1001Last24h?: number;
  appCrash1000Last1h?: number;
  appCrash1002Last1h?: number;

  bsodHistory?: { code: string; date: string }[];
  criticalEvents?: number;
  antivirusEnabled?: boolean;
  windowsUpdateStatus?: string;
}

export interface SOCAnomaly {
  ruleId: string;
  severity: "KRITIS" | "PERINGATAN";
  komponen: string;
  deskripsi: string;
  nilaiAktual: number | string;
  ambangBatas: string;
  korelasi?: string[];
}

export interface SOCTriple {
  status_keseluruhan: "KRITIS" | "PERINGATAN" | "SEHAT";
  komponen_bermasalah: string[];
  akar_masalah: string;
  detail_anomali_ditemukan: SOCAnomaly[];
  rekomendasi_tindakan: string[];
}

// ============================================================
// HELPER
// ============================================================

function hasVal(v: number | undefined | null): v is number {
  return v !== undefined && v !== null && !isNaN(v);
}

// ============================================================
// RULES
// ============================================================

interface SOCRule {
  id: string;
  severity: "KRITIS" | "PERINGATAN";
  komponen: string;
  check: (d: SOCData) => boolean;
  deskripsi: (d: SOCData) => string;
  nilaiAktual: (d: SOCData) => number | string;
  ambangBatas: string;
  getCorrelation: (d: SOCData) => string[];
}

const CRITICAL_RULES: SOCRule[] = [
  {
    id: "CRIT-KP41",
    severity: "KRITIS",
    komponen: "OS / Power",
    check: (d) => hasVal(d.kernelPower41Last24h) && d.kernelPower41Last24h! > 0,
    deskripsi: (d) => `Event ID 41 (Kernel-Power) terdeteksi ${d.kernelPower41Last24h}x dalam 24 jam - sistem mati mendadak/tidak bersih shutdown`,
    nilaiAktual: (d) => `${d.kernelPower41Last24h} kejadian`,
    ambangBatas: "0 kejadian (ideal tidak ada)",
    getCorrelation: () => ["CRIT-BC1001", "WARN-DISK7", "WARN-DISK153", "WARN-CPUTEMP"],
  },
  {
    id: "CRIT-BC1001",
    severity: "KRITIS",
    komponen: "OS / BSOD",
    check: (d) => hasVal(d.bugCheck1001Last24h) && d.bugCheck1001Last24h! > 0,
    deskripsi: (d) => `Bug Check (BSOD) Event ID 1001 terdeteksi ${d.bugCheck1001Last24h}x dalam 24 jam`,
    nilaiAktual: (d) => `${d.bugCheck1001Last24h} kejadian`,
    ambangBatas: "0 kejadian",
    getCorrelation: () => ["CRIT-KP41", "WARN-DISK7", "WARN-DISK153"],
  },
  {
    id: "CRIT-DISK7",
    severity: "KRITIS",
    komponen: "Disk / Storage",
    check: (d) => hasVal(d.diskError7Count) && d.diskError7Count! > 0,
    deskripsi: (d) => `Disk bad block error (Event 7): ${d.diskError7Count} kejadian - kemungkinan fisik disk rusak`,
    nilaiAktual: (d) => `${d.diskError7Count} error`,
    ambangBatas: "0 error",
    getCorrelation: () => ["CRIT-DISK153", "CRIT-SMART"],
  },
  {
    id: "CRIT-DISK153",
    severity: "KRITIS",
    komponen: "Disk / Storage",
    check: (d) => hasVal(d.diskError153Count) && d.diskError153Count! >= 3,
    deskripsi: (d) => `Disk write error (Event 153): ${d.diskError153Count} kejadian - gagal menulis/flush data ke disk`,
    nilaiAktual: (d) => `${d.diskError153Count} error`,
    ambangBatas: ">= 3 error (CRITICAL)",
    getCorrelation: () => ["CRIT-DISK7", "CRIT-SMART", "CRIT-KP41"],
  },
  {
    id: "CRIT-SMART",
    severity: "KRITIS",
    komponen: "Disk / S.M.A.R.T.",
    check: (d) => hasVal(d.smartReallocatedSectors) && d.smartReallocatedSectors! > 0,
    deskripsi: (d) => `S.M.A.R.T. Reallocated Sectors = ${d.smartReallocatedSectors} - disk memiliki bad sector yang sudah dialokasikan ulang`,
    nilaiAktual: (d) => `${d.smartReallocatedSectors} sector`,
    ambangBatas: "0 sector (ideal)",
    getCorrelation: () => ["CRIT-DISK7", "CRIT-DISK153"],
  },
  {
    id: "CRIT-CPUTEMP",
    severity: "KRITIS",
    komponen: "CPU / Thermal",
    check: (d) => hasVal(d.cpuTemperature) && d.cpuTemperature! > 90,
    deskripsi: (d) => `Suhu CPU ${d.cpuTemperature}C - melebihi batas thermal throttling`,
    nilaiAktual: (d) => `${d.cpuTemperature}C`,
    ambangBatas: "> 90C",
    getCorrelation: () => ["WARN-CPUHIGH", "WARN-RAMLOW"],
  },
];

const WARNING_RULES: SOCRule[] = [
  {
    id: "WARN-CPUHIGH",
    severity: "PERINGATAN",
    komponen: "CPU",
    check: (d) => hasVal(d.cpuUsage) && d.cpuUsage! > 95,
    deskripsi: (d) => `Penggunaan CPU ${d.cpuUsage}% - mendekati batas maksimum`,
    nilaiAktual: (d) => `${d.cpuUsage}%`,
    ambangBatas: "> 95%",
    getCorrelation: () => ["WARN-RAMLOW", "WARN-DISKQ"],
  },
  {
    id: "WARN-RAMLOW",
    severity: "PERINGATAN",
    komponen: "RAM / Memory",
    check: (d) => {
      if (!hasVal(d.totalRAMMB) || !hasVal(d.availableRAMMB)) return false;
      const usagePercent = ((d.totalRAMMB - d.availableRAMMB) / d.totalRAMMB) * 100;
      return usagePercent > 95 && hasVal(d.pagesPerSec) && d.pagesPerSec! > 500;
    },
    deskripsi: () => `RAM hampir penuh (>95%) dengan Pages/sec tinggi - sistem melakukan heavy paging`,
    nilaiAktual: (d) => {
      if (!hasVal(d.totalRAMMB) || !hasVal(d.availableRAMMB)) return "N/A";
      return `${(((d.totalRAMMB - d.availableRAMMB) / d.totalRAMMB) * 100).toFixed(1)}% terpakai, Pages/sec: ${d.pagesPerSec ?? 0}`;
    },
    ambangBatas: "RAM >95% + Pages/sec > 500",
    getCorrelation: () => ["WARN-CPUHIGH", "WARN-DISKQ"],
  },
  {
    id: "WARN-DISKQ",
    severity: "PERINGATAN",
    komponen: "Disk / I/O",
    check: (d) => hasVal(d.diskQueueLength) && d.diskQueueLength! > 3 && hasVal(d.diskActiveTime) && d.diskActiveTime! > 95,
    deskripsi: (d) => `Disk I/O bottleneck: Queue=${d.diskQueueLength}, Active=${d.diskActiveTime}%`,
    nilaiAktual: (d) => `Queue: ${d.diskQueueLength}, Active: ${d.diskActiveTime}%`,
    ambangBatas: "Queue > 3 + Active > 95%",
    getCorrelation: () => ["WARN-CPUHIGH", "WARN-RAMLOW", "WARN-DISK153"],
  },
  {
    id: "WARN-APP CRASH",
    severity: "PERINGATAN",
    komponen: "Software / Stability",
    check: (d) => {
      const total = (d.appCrash1000Last1h ?? 0) + (d.appCrash1002Last1h ?? 0);
      return total > 5;
    },
    deskripsi: (d) => `Aplikasi crash ${((d.appCrash1000Last1h ?? 0) + (d.appCrash1002Last1h ?? 0))}x dalam 1 jam terakhir`,
    nilaiAktual: (d) => `${((d.appCrash1000Last1h ?? 0) + (d.appCrash1002Last1h ?? 0))} crash/jam`,
    ambangBatas: "> 5 crash/jam",
    getCorrelation: () => ["WARN-RAMLOW", "WARN-DISKUSAGE"],
  },
  {
    id: "WARN-DISKUSAGE",
    severity: "PERINGATAN",
    komponen: "Disk / Kapasitas",
    check: (d) => hasVal(d.diskUsage) && d.diskUsage! > 90,
    deskripsi: (d) => `Penggunaan disk ${d.diskUsage}% - kapasitas hampir penuh`,
    nilaiAktual: (d) => `${d.diskUsage}%`,
    ambangBatas: "> 90%",
    getCorrelation: () => ["WARN-DISKQ", "WARN-RAMLOW"],
  },
  {
    id: "WARN-CPUTEMP-W",
    severity: "PERINGATAN",
    komponen: "CPU / Thermal",
    check: (d) => hasVal(d.cpuTemperature) && d.cpuTemperature! >= 80 && d.cpuTemperature! <= 90,
    deskripsi: (d) => `Suhu CPU ${d.cpuTemperature}C - mendekati batas thermal throttling`,
    nilaiAktual: (d) => `${d.cpuTemperature}C`,
    ambangBatas: "80-90C",
    getCorrelation: () => ["WARN-CPUHIGH"],
  },
  {
    id: "WARN-AV",
    severity: "PERINGATAN",
    komponen: "Security",
    check: (d) => d.antivirusEnabled === false,
    deskripsi: () => `Antivirus/Windows Defender tidak aktif - komputer tidak terlindungi`,
    nilaiAktual: () => "Nonaktif",
    ambangBatas: "Harus Aktif",
    getCorrelation: () => [],
  },
  {
    id: "WARN-NETWORK",
    severity: "PERINGATAN",
    komponen: "Network",
    check: (d) => d.dnsStatus !== "OK",
    deskripsi: (d) => `DNS Status: ${d.dnsStatus ?? "Unknown"} - ada masalah resolusi DNS`,
    nilaiAktual: (d) => d.dnsStatus ?? "Unknown",
    ambangBatas: "OK",
    getCorrelation: () => [],
  },
  // Event 153 < 3 = WARNING (bukan critical)
  {
    id: "WARN-DISK153",
    severity: "PERINGATAN",
    komponen: "Disk / Storage",
    check: (d) => hasVal(d.diskError153Count) && d.diskError153Count! >= 1 && d.diskError153Count! < 3,
    deskripsi: (d) => `Disk write error (Event 153): ${d.diskError153Count} kejadian - perlu dipantau`,
    nilaiAktual: (d) => `${d.diskError153Count} error`,
    ambangBatas: "1-2 error (WARNING), >= 3 (CRITICAL)",
    getCorrelation: () => ["CRIT-DISK7", "CRIT-SMART"],
  },
];

// ============================================================
// ANALYSIS
// ============================================================

export function analyzeSOC(data: SOCData): SOCTriple {
  const allAnomalies: SOCAnomaly[] = [];
  const triggeredRuleIds = new Set<string>();

  // Check all rules
  for (const rule of [...CRITICAL_RULES, ...WARNING_RULES]) {
    if (rule.check(data)) {
      triggeredRuleIds.add(rule.id);
      // Add correlation info
      const correlatedRules = rule.getCorrelation(data).filter(id => triggeredRuleIds.has(id) || !triggeredRuleIds.has(rule.id));
      allAnomalies.push({
        ruleId: rule.id,
        severity: rule.severity,
        komponen: rule.komponen,
        deskripsi: rule.deskripsi(data),
        nilaiAktual: rule.nilaiAktual(data),
        ambangBatas: rule.ambangBatas,
        korelasi: rule.getCorrelation(data).filter(id =>
          // Show correlation only to other triggered rules OR rules that could be related
          triggeredRuleIds.has(id) || CRITICAL_RULES.some(r => r.id === id && r.check(data))
        ),
      });
    }
  }

  // If no anomalies, return HEALTHY immediately
  if (allAnomalies.length === 0) {
    return {
      status_keseluruhan: "SEHAT",
      komponen_bermasalah: [],
      akar_masalah: "Tidak ditemukan anomali signifikan. Komputer dalam kondisi sehat berdasarkan analisis SOC threshold.",
      detail_anomali_ditemukan: [],
      rekomendasi_tindakan: [
        "Lanjutkan pemantauan rutin secara berkala",
        "Pastikan Windows Update tetap aktif",
      ],
    };
  }

  // Determine overall status
  const hasCritical = allAnomalies.some(a => a.severity === "KRITIS");
  const status_keseluruhan: SOCTriple["status_keseluruhan"] = hasCritical ? "KRITIS" : "PERINGATAN";

  // Unique affected components
  const komponen_bermasalah = [...new Set(allAnomalies.map(a => a.komponen))];

  // Root cause analysis — priority: Thermal > Hardware/Disk > Software > Network > OS
  const rootCauses: { priority: number; text: string }[] = [];

  if (allAnomalies.some(a => a.komponen.includes("Thermal") || a.komponen.includes("CPU") && a.ruleId.includes("TEMP"))) {
    rootCauses.push({
      priority: 1,
      text: "Thermal issue (suhu tinggi) - kemungkinan pendingin tidak optimal atau thermal paste sudah aus"
    });
  }

  if (allAnomalies.some(a => a.komponen.includes("Disk") || a.komponen.includes("S.M.A.R.T.") || a.komponen.includes("Storage"))) {
    const disk153 = allAnomalies.find(a => a.ruleId === "CRIT-DISK153" || a.ruleId === "WARN-DISK153");
    const smart = allAnomalies.find(a => a.ruleId === "CRIT-SMART");
    const disk7 = allAnomalies.find(a => a.ruleId === "CRIT-DISK7");

    if (smart) {
      rootCauses.push({ priority: 2, text: "Disk mengalami kerusakan fisik (S.M.A.R.T. bad sector) - umur disk mendekati akhir hayat" });
    } else if (disk153 && disk153.severity === "KRITIS") {
      rootCauses.push({ priority: 2, text: "Disk mengalami error write/flush yang sering - kemungkinan bad block atau kabel SATA bermasalah" });
    } else if (disk153 && disk153.severity === "PERINGATAN") {
      rootCauses.push({ priority: 2, text: "Disk mengalami sesekali error write - perlu dipantau, kemungkinan awal degradasi" });
    } else if (disk7) {
      rootCauses.push({ priority: 2, text: "Disk mengalami bad block error (Event 7) - ada sektor rusak pada disk" });
    } else {
      rootCauses.push({ priority: 2, text: "Disk mengalami tekanan I/O tinggi atau kapasitas hampir penuh" });
    }
  }

  if (allAnomalies.some(a => a.komponen.includes("RAM") || a.komponen.includes("Memory"))) {
    rootCauses.push({ priority: 3, text: "Memori (RAM) hampir penuh dengan paging tinggi - kemungkinan aplikasi boros memori atau memory leak" });
  }

  if (allAnomalies.some(a => a.komponen.includes("Security"))) {
    rootCauses.push({ priority: 3, text: "Antivirus tidak aktif - komputer rentan terhadap malware" });
  }

  if (allAnomalies.some(a => a.komponen.includes("Network"))) {
    rootCauses.push({ priority: 4, text: "Masalah jaringan/DNS - dapat mempengaruhi konektivitas internet" });
  }

  if (allAnomalies.some(a => a.komponen.includes("OS") || a.komponen.includes("Power") || a.komponen.includes("BSOD"))) {
    const kp41 = allAnomalies.find(a => a.ruleId === "CRIT-KP41");
    const bc1001 = allAnomalies.find(a => a.ruleId === "CRIT-BC1001");
    if (kp41) {
      rootCauses.push({ priority: 0, text: `Kernel-Power Event 41 terdeteksi ${data.kernelPower41Last24h}x - sistem mengalami shutdown tidak bersih, kemungkinan disebabkan oleh masalah hardware (disk/power supply/overheat)` });
    }
    if (bc1001) {
      rootCauses.push({ priority: 0, text: `BSOD (Bug Check) terdeteksi ${data.bugCheck1001Last24h}x - ada driver atau hardware yang menyebabkan crash sistem` });
    }
  }

  if (allAnomalies.some(a => a.komponen.includes("Software") || a.komponen.includes("Stability"))) {
    rootCauses.push({ priority: 3, text: "Aplikasi sering crash - kemungkinan kompatibilitas software atau resource tidak cukup" });
  }

  // Sort by priority
  rootCauses.sort((a, b) => a.priority - b.priority);
  const akar_masalah = rootCauses.length > 0
    ? rootCauses.map(r => r.text).join(". ") + "."
    : "Anomali terdeteksi namun akar masalah belum dapat dipastikan dari data yang tersedia.";

  // Recommendations
  const rekomendasi_tindakan: string[] = [];

  if (allAnomalies.some(a => a.komponen.includes("Disk") || a.komponen.includes("S.M.A.R.T."))) {
    rekomendasi_tindakan.push("BACKUP DATA SEGERA ke disk eksternal atau cloud storage");
    rekomendasi_tindakan.push("Jalankan 'chkdsk /f /r' di Command Prompt (Administrator) untuk scan dan repair bad sector");
    rekomendasi_tindakan.push("Pertimbangkan untuk mengganti disk jika error terus berulang");
  }

  if (allAnomalies.some(a => a.komponen.includes("Thermal") || a.ruleId.includes("TEMP"))) {
    rekomendasi_tindakan.push("Bersihkan debu dari heatsink dan kipas pendingin CPU");
    rekomendasi_tindakan.push("Periksa apakah thermal paste perlu diganti");
    rekomendasi_tindakan.push("Pastikan ventilasi laptop/PC tidak terblokir");
  }

  if (allAnomalies.some(a => a.komponen.includes("OS") || a.komponen.includes("Power"))) {
    rekomendasi_tindakan.push("Periksa power supply - pastikan kabel power kencang dan PSU berfungsi baik");
    rekomendasi_tindakan.push("Update semua driver terutama chipset dan storage controller");
  }

  if (allAnomalies.some(a => a.komponen.includes("RAM"))) {
    rekomendasi_tindakan.push("Tutup aplikasi yang tidak diperlukan untuk mengurangi beban RAM");
    rekomendasi_tindakan.push("Pertimbangkan upgrade RAM jika penggunaan konsisten tinggi");
  }

  if (allAnomalies.some(a => a.komponen.includes("Security"))) {
    rekomendasi_tindakan.push("Aktifkan kembali Windows Defender atau antivirus pihak ketiga");
  }

  if (allAnomalies.some(a => a.komponen.includes("Network"))) {
    rekomendasi_tindakan.push("Restart router/modem dan flush DNS: 'ipconfig /flushdns'");
  }

  if (rekomendasi_tindakan.length === 0) {
    rekomendasi_tindakan.push("Pantau perkembangan anomali dan jalankan diagnostic ulang dalam 24 jam");
  }

  return {
    status_keseluruhan,
    komponen_bermasalah,
    akar_masalah,
    detail_anomali_ditemukan: allAnomalies,
    rekomendasi_tindakan,
  };
}