// ============================================================
// PC Diagnostic Knowledge Base & Analysis Engine
// Menyimpan database masalah, gejala, dan solusi Windows 10/11
// ============================================================

export interface DiagnosticIssue {
  id: string;
  category: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  symptoms: string[];
  indicators: string[];
  description: string;
  solutions: Solution[];
}

export interface Solution {
  title: string;
  steps: string[];
  difficulty: "mudah" | "sedang" | "lanjutan";
  requiresReboot: boolean;
  estimatedTime: string;
  successRate: number;
}

// ============================================================
// KNOWLEDGE BASE - Database Masalah Komputer Windows 10/11
// ============================================================

export const KNOWLEDGE_BASE: DiagnosticIssue[] = [
  // ==================== CPU & PROCESSOR ====================
  {
    id: "cpu-overheating",
    category: "CPU & Processor",
    title: "CPU Overheating (Suhu CPU Terlalu Tinggi)",
    severity: "critical",
    symptoms: [
      "Komputer sering mati sendiri tanpa peringatan",
      "Performa sangat lambat saat berat",
      "Fan berbunyi sangat keras terus-menerus",
      "Komputer tidak bisa boot (thermal shutdown)"
    ],
    indicators: [
      "cpuTemperature > 90",
      "highFanSpeed",
      "thermalThrottling"
    ],
    description: "CPU mengalami overheating yang dapat menyebabkan kerusakan permanen jika tidak ditangani. Biasanya disebabkan oleh pasta thermal yang sudah kering, fan yang rusak, atau sirkulasi udara yang buruk di casing.",
    solutions: [
      {
        title: "Bersihkan Debu dari Heatsink & Fan CPU",
        steps: [
          "Matikan komputer dan cabut kabel power",
          "Buka casing komputer",
          "Gunakan kaleng udara bertekanan untuk membersihkan debu dari heatsink CPU",
          "Bersihkan juga fan CPU dari debu yang menempel",
          "Pastikan kipas bisa berputar dengan bebas",
          "Tutup casing dan nyalakan kembali"
        ],
        difficulty: "sedang",
        requiresReboot: false,
        estimatedTime: "15-30 menit",
        successRate: 60
      },
      {
        title: "Ganti Pasta Thermal CPU",
        steps: [
          "Matikan komputer dan cabut kabel power",
          "Lepas heatsink dari CPU (hati-hati, jangan merusak motherboard)",
          "Bersihkan sisa pasta thermal lama menggunakan alkohol isopropil dan kain mikrofiber",
          "Oleskan pasta thermal baru (ukuran sebesar biji kacang polong di tengah CPU)",
          "Pasang kembali heatsink dengan tekanan merata",
          "Tutup casing dan nyalakan kembali"
        ],
        difficulty: "lanjutan",
        requiresReboot: false,
        estimatedTime: "30-45 menit",
        successRate: 85
      },
      {
        title: "Perbaiki Sirkulasi Udara Casing",
        steps: [
          "Pastikan komputer tidak ditempatkan di ruang sempit tanpa ventilasi",
          "Periksa apakah semua fan casing berfungsi",
          "Atur kabel agar tidak menghalangi aliran udara",
          "Pertimbangkan menambahkan fan intake/exhaust tambahan",
          "Pastikan intake fan tidak terhalang oleh debu"
        ],
        difficulty: "mudah",
        requiresReboot: false,
        estimatedTime: "15-20 menit",
        successRate: 50
      }
    ]
  },
  {
    id: "cpu-high-usage",
    category: "CPU & Processor",
    title: "CPU Usage Selalu Tinggi (100%)",
    severity: "high",
    symptoms: [
      "Komputer sangat lambat dalam semua tugas",
      "Task Manager menunjukkan CPU selalu di 90-100%",
      "Fan selalu berputar kencang",
      "Aplikasi sangat lama untuk membuka atau merespons"
    ],
    indicators: [
      "cpuUsage > 90",
      "systemResponsiveness < 50",
      "highDPCorInterrupt"
    ],
    description: "Penggunaan CPU yang terus-menerus tinggi bisa disebabkan oleh proses nakal (rogue process), malware, driver yang bermasalah, atau Windows Update yang berjalan di background. Ini bukan masalah hardware melainkan masalah software.",
    solutions: [
      {
        title: "Identifikasi & Hentikan Proses Penyebab",
        steps: [
          "Buka Task Manager (Ctrl+Shift+Esc)",
          "Klik tab 'Details' untuk melihat proses yang memakan CPU",
          "Sortir berdasarkan kolom 'CPU' (klik header kolom)",
          "Klik kanan proses yang penggunaan CPU-nya tinggi",
          "Pilih 'End Task' untuk menghentikannya",
          "Perhatikan nama proses untuk investigasi lebih lanjut"
        ],
        difficulty: "mudah",
        requiresReboot: false,
        estimatedTime: "5-10 menit",
        successRate: 70
      },
      {
        title: "Scan & Hapus Malware",
        steps: [
          "Jalankan Windows Security (Built-in antivirus)",
          "Klik 'Virus & threat protection'",
          "Pilih 'Quick scan' terlebih dahulu",
          "Jika ditemukan, lakukan 'Full scan' untuk pembersihan menyeluruh",
          "Atau gunakan Malwarebytes Free sebagai scanner tambahan",
          "Setelah scan selesai, restart komputer"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "30-60 menit",
        successRate: 75
      },
      {
        title: "Perbaiki Windows System Files",
        steps: [
          "Buka Command Prompt sebagai Administrator",
          "Jalankan: sfc /scannow (tunggu hingga selesai, bisa 15-30 menit)",
          "Setelah selesai, jalankan: DISM /Online /Cleanup-Image /RestoreHealth",
          "Tunggu proses DISM selesai (bisa 30-60 menit)",
          "Restart komputer",
          "Periksa kembali penggunaan CPU di Task Manager"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "60-90 menit",
        successRate: 65
      }
    ]
  },

  // ==================== RAM / MEMORY ====================
  {
    id: "ram-insufficient",
    category: "RAM & Memory",
    title: "RAM Tidak Cukup (Memory Low)",
    severity: "high",
    symptoms: [
      "Komputer sangat lambat saat membuka banyak aplikasi",
      "Muncul notifikasi 'Your computer is low on memory'",
      "Aplikasi sering not responding atau force close",
      "Hard disk selalu bekerja keras (100% disk usage)"
    ],
    indicators: [
      "availableRAM < 1000",
      "memoryUsage > 90",
      "pageFileUsage > 80"
    ],
    description: "RAM yang tidak mencukupi menyebabkan Windows menggunakan pagefile (virtual memory) di hard disk yang jauh lebih lambat dari RAM fisik. Ini adalah penyebab paling umum dari komputer yang terasa sangat lambat, terutama pada PC dengan 4GB RAM atau kurang.",
    solutions: [
      {
        title: "Tutup Aplikasi yang Tidak Diperlukan",
        steps: [
          "Buka Task Manager (Ctrl+Shift+Esc)",
          "Klik tab 'Processes'",
          "Sortir berdasarkan kolom 'Memory'",
          "Klik kanan aplikasi yang tidak digunakan dan pilih 'End Task'",
          "Nonaktifkan auto-start aplikasi di tab 'Startup'",
          "Klik kanan aplikasi yang tidak perlu auto-start > Disable"
        ],
        difficulty: "mudah",
        requiresReboot: false,
        estimatedTime: "5 menit",
        successRate: 40
      },
      {
        title: "Optimalkan Penggunaan Visual Effects",
        steps: [
          "Buka Start Menu > ketik 'Performance' > pilih 'Adjust the appearance and performance of Windows'",
          "Di tab Visual Effects, pilih 'Adjust for best performance'",
          "Atau pilih 'Custom' dan centang hanya: 'Show thumbnails instead of icons', 'Smooth edges of screen fonts'",
          "Klik Apply > OK",
          "Restart komputer untuk perubahan efek penuh"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "10 menit",
        successRate: 30
      },
      {
        title: "Tambah Kapasitas RAM",
        steps: [
          "Periksa tipe RAM yang komputer gunakan (DDR3, DDR4, DDR5)",
          "Buka Task Manager > tab 'Performance' > 'Memory' untuk melihat tipe & slot",
          "Pastikan ada slot RAM kosong di motherboard",
          "Beli RAM tambahan dengan spesifikasi yang sama (frekuensi & tipe)",
          "Pasang RAM baru di slot kosong (perhatikan garis notch)",
          "Nyalakan komputer dan periksa di Task Manager bahwa RAM terdeteksi"
        ],
        difficulty: "sedang",
        requiresReboot: false,
        estimatedTime: "15-30 menit",
        successRate: 95
      }
    ]
  },
  {
    id: "ram-defective",
    category: "RAM & Memory",
    title: "RAM Rusak / Defective",
    severity: "critical",
    symptoms: [
      "Blue Screen of Death (BSOD) dengan error MEMORY_MANAGEMENT",
      "Komputer restart sendiri secara acak",
      "File sering corrupt tanpa alasan jelas",
      "Aplikasi crash dengan error yang tidak konsisten"
    ],
    indicators: [
      "bsodCode contains MEMORY_MANAGEMENT",
      "bsodCode contains PAGE_FAULT_IN_NONPAGED_AREA",
      "randomRestarts",
      "fileCorruption"
    ],
    description: "RAM yang rusak adalah salah satu penyebab terberat masalah komputer yang sulit dikenali karena gejalanya mirip dengan banyak masalah lain. Gejala bisa random dan tidak konsisten, membuat diagnosis manual sangat sulit dilakukan.",
    solutions: [
      {
        title: "Jalankan Windows Memory Diagnostic",
        steps: [
          "Klik Start > ketik 'Windows Memory Diagnostic' > Enter",
          "Pilih 'Restart now and check for problems'",
          "Komputer akan restart dan memulai diagnostic",
          "Tunggu proses selesai (biasanya 10-20 menit)",
          "Setelah restart, cek notifikasi hasil di system tray",
          "Jika ditemukan masalah, lanjutkan ke solusi berikutnya"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "20-30 menit",
        successRate: 50
      },
      {
        title: "Test RAM Satu per Satu",
        steps: [
          "Matikan komputer dan buka casing",
          "Jika ada 2+ stick RAM, lepaskan semua kecuali satu",
          "Nyalakan komputer dan gunakan normal selama beberapa hari",
          "Jika masalah tidak muncul, stick yang terpasang kemungkinan baik",
          "Ganti dengan stick lain dan ulangi test",
          "Stick yang menyebabkan masalah saat dipasang = RAM rusak"
        ],
        difficulty: "sedang",
        requiresReboot: false,
        estimatedTime: "30 menit + observasi",
        successRate: 90
      },
      {
        title: "Ganti RAM yang Rusak",
        steps: [
          "Identifikasi stick RAM yang rusak dari solusi di atas",
          "Catat spesifikasi RAM (tipe, kecepatan, kapasitas)",
          "Beli RAM pengganti dengan spesifikasi identik",
          "Lepas RAM lama dan pasang yang baru",
          "Nyalakan komputer dan verifikasi di BIOS/Task Manager"
        ],
        difficulty: "sedang",
        requiresReboot: false,
        estimatedTime: "15-20 menit",
        successRate: 100
      }
    ]
  },

  // ==================== STORAGE / DISK ====================
  {
    id: "disk-failing",
    category: "Storage & Disk",
    title: "Hard Disk / SSD Mulai Rusak (Failing)",
    severity: "critical",
    symptoms: [
      "Komputer sangat lambat terutama saat membuka file",
      "Sering muncul error 'Delayed Write Failed'",
      "File tiba-tiba hilang atau corrupt",
      "Klik-klik atau bunyi aneh dari hard disk",
      "BSOD dengan error DISK-related"
    ],
    indicators: [
      "smartStatus != OK",
      "reallocatedSectorsCount > 0",
      "pendingSectorCount > 0",
      "diskReadErrors > 0",
      "diskTemperature > 60"
    ],
    description: "Storage yang mulai rusak (failing) adalah masalah paling berbahaya karena bisa menyebabkan kehilangan data permanen. SMART (Self-Monitoring, Analysis, and Reporting Technology) memberikan peringatan dini sebelum disk benar-benar mati, tetapi banyak orang mengabaikan indikator ini.",
    solutions: [
      {
        title: "BACKUP DATA SEGERA (PRIORITAS UTAMA)",
        steps: [
          "SEGERA backup semua data penting ke drive eksternal atau cloud",
          "Prioritaskan: dokumen, foto, video, file kerja",
          "Jangan menyimpan file baru ke disk yang dicurigai rusak",
          "Gunakan robocopy untuk backup bulk: robocopy C:\\Data D:\\Backup /MIR /Z",
          "Setelah backup selesai, baru lanjutkan ke solusi di bawah",
          "CATATAN: Jangan menunda backup! Disk bisa mati kapan saja"
        ],
        difficulty: "mudah",
        requiresReboot: false,
        estimatedTime: "Bervariasi tergantung jumlah data",
        successRate: 100
      },
      {
        title: "Cek SMART Status Detail",
        steps: [
          "Download dan install CrystalDiskInfo (gratis)",
          "Buka aplikasi dan lihat status disk (Good/Caution/Bad)",
          "Perhatikan attribute: Reallocated Sectors, Pending Sectors, Uncorrectable Sectors",
          "Jika ada nilai > 0 pada attribute di atas, disk sudah mulai rusak",
          "Periksa juga temperatur disk (normal: 30-50°C, warning: > 55°C)",
          "Screenshot hasilnya sebagai dokumentasi"
        ],
        difficulty: "mudah",
        requiresReboot: false,
        estimatedTime: "10 menit",
        successRate: 90
      },
      {
        title: "Ganti Disk dengan yang Baru",
        steps: [
          "Beli SSD/HDD baru (disarankan SSD untuk performa)",
          "Clone disk lama ke disk baru menggunakan Macrium Reflect (gratis)",
          "Atau install Windows fresh ke disk baru dan restore data dari backup",
          "Jika menggunakan clone: buka Macrium Reflect > Clone this disk > pilih disk baru",
          "Setelah clone selesai, ganti disk lama dengan yang baru",
          "Boot dan verifikasi semua data dan sistem berjalan normal"
        ],
        difficulty: "sedang",
        requiresReboot: true,
        estimatedTime: "60-120 menit",
        successRate: 100
      }
    ]
  },
  {
    id: "disk-100-usage",
    category: "Storage & Disk",
    title: "Disk Usage Selalu 100%",
    severity: "high",
    symptoms: [
      "Task Manager menunjukkan disk usage 100% terus-menerus",
      "Komputer sangat lambat terutama saat boot",
      "Loading aplikasi sangat lama",
      "Kursor sering berubah menjadi loading circle"
    ],
    indicators: [
      "diskUsage > 95",
      "slowBoot",
      "highDiskQueueLength"
    ],
    description: "Disk usage 100% di Windows 10/11 adalah masalah yang sangat umum. Penyebabnya bisa beragam: Windows Update di background, SuperFetch/SysMain yang agresif, antivirus scanning, atau disk yang memang sudah lemah (terutama HDD lama). Pada SSD masalah ini biasanya lebih ringan.",
    solutions: [
      {
        title: "Nonaktifkan SysMain (SuperFetch)",
        steps: [
          "Buka Start Menu > ketik 'Services' > Enter",
          "Cari 'SysMain' di daftar services",
          "Klik kanan > Properties",
          "Ubah Startup type menjadi 'Disabled'",
          "Klik 'Stop' untuk menghentikan service",
          "Klik Apply > OK"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "5 menit",
        successRate: 60
      },
      {
        title: "Periksa & Hentikan Windows Update Background",
        steps: [
          "Buka Settings > Update & Security > Windows Update",
          "Klik 'Pause updates' untuk sementara menghentikan auto-update",
          "Buka Services > cari 'Windows Update'",
          "Klik kanan > Stop (sementara)",
          "Periksa apakah disk usage turun setelah menghentikan Windows Update",
          "Jika ya, tunggu update selesai atau jadwalkan update di waktu idle"
        ],
        difficulty: "mudah",
        requiresReboot: false,
        estimatedTime: "10 menit",
        successRate: 50
      },
      {
        title: "Upgrade ke SSD (Jika masih menggunakan HDD)",
        steps: [
          "Jika komputer masih menggunakan HDD, upgrade ke SSD akan mengatasi masalah ini secara drastis",
          "SSD memiliki kecepatan baca/tulis 5-10x lebih cepat dari HDD",
          "Clone OS dari HDD ke SSD menggunakan Macrium Reflect",
          "Atau install fresh Windows di SSD baru",
          "Setelah upgrade, disk usage 100% biasanya hilang total"
        ],
        difficulty: "sedang",
        requiresReboot: true,
        estimatedTime: "60-120 menit",
        successRate: 95
      }
    ]
  },

  // ==================== DRIVER ====================
  {
    id: "driver-corrupted",
    category: "Driver & Software",
    title: "Driver Corrupt atau Tidak Kompatibel",
    severity: "high",
    symptoms: [
      "Blue Screen of Death (BSOD) dengan error DRIVER_*",
      "Perangkat tidak terdeteksi di Device Manager (ikon kuning)",
      "Hardware tertentu tidak berfungsi (sound, wifi, dll)",
      "Komputer crash setelah update atau install software"
    ],
    indicators: [
      "bsodCode contains DRIVER",
      "deviceManagerErrors > 0",
      "deviceNotWorking"
    ],
    description: "Driver adalah perangkat lunak penghubung antara hardware dan Windows. Driver yang corrupt, outdated, atau tidak kompatibel adalah penyebab #1 dari BSOD pada Windows 10/11. Masalah ini sering muncul setelah update Windows atau install software baru.",
    solutions: [
      {
        title: "Update Driver melalui Device Manager",
        steps: [
          "Klik kanan Start Menu > Device Manager",
          "Cari perangkat dengan ikon kuning (tanda seru)",
          "Klik kanan perangkat > Update driver",
          "Pilih 'Search automatically for drivers'",
          "Jika Windows tidak menemukan, kunjungi website produsen hardware",
          "Download dan install driver terbaru dari website resmi"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "15-30 menit",
        successRate: 70
      },
      {
        title: "Uninstall & Clean Install Driver",
        steps: [
          "Buka Device Manager > cari perangkat bermasalah",
          "Klik kanan > Uninstall device",
          "Centang 'Attempt to remove the driver for this device'",
          "Restart komputer",
          "Windows akan otomatis menginstall driver default",
          "Jika masih bermasalah, install driver terbaru dari website produsen"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "15-20 menit",
        successRate: 80
      },
      {
        title: "Gunakan DDU (Display Driver Uninstaller) untuk GPU",
        steps: [
          "Download DDU dari website resmi (wagnardsoft.com)",
          "Boot ke Safe Mode (Windows+I > Recovery > Restart now > Advanced > Safe Mode)",
          "Jalankan DDU dan pilih 'Clean and restart'",
          "Setelah restart, install driver GPU terbaru dari NVIDIA/AMD/Intel",
          "DDU menghapus semua sisa driver lama yang bisa menyebabkan konflik"
        ],
        difficulty: "sedang",
        requiresReboot: true,
        estimatedTime: "30-45 menit",
        successRate: 90
      }
    ]
  },

  // ==================== WINDOWS SYSTEM ====================
  {
    id: "corrupted-system-files",
    category: "Windows System",
    title: "File Sistem Windows Rusak (Corrupted)",
    severity: "high",
    symptoms: [
      "Windows Update selalu gagal",
      "Beberapa fitur Windows tidak berfungsi (Start Menu, Settings, dll)",
      "Komputer sering crash atau freeze",
      "Aplikasi Windows Store tidak bisa dibuka"
    ],
    indicators: [
      "sfcResults contains violations",
      "dismHealth != healthy",
      "windowsUpdateFailing",
      "windowsFeaturesBroken"
    ],
    description: "File sistem Windows yang rusak bisa disebabkan oleh crash, power failure saat update, malware, atau disk yang bermasalah. Gejalanya sangat bervariasi dan seringkali sulit diprediksi karena file yang rusak bisa berdampak ke fitur yang berbeda-beda.",
    solutions: [
      {
        title: "Jalankan System File Checker (SFC)",
        steps: [
          "Buka Command Prompt sebagai Administrator (Start > ketik 'cmd' > Ctrl+Shift+Enter)",
          "Ketik: sfc /scannow",
          "Tunggu proses scan selesai (15-30 menit, jangan tutup window)",
          "Jika ditemukan corrupted files, SFC akan mencoba memperbaikinya",
          "Setelah selesai, restart komputer",
          "Jika masih bermasalah, lanjutkan ke langkah DISM di bawah"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "30-45 menit",
        successRate: 70
      },
      {
        title: "Jalankan DISM Repair",
        steps: [
          "Buka Command Prompt sebagai Administrator",
          "Jalankan perintah pertama: DISM /Online /Cleanup-Image /CheckHealth",
          "Jika ada masalah, jalankan: DISM /Online /Cleanup-Image /ScanHealth",
          "Terakhir, jalankan repair: DISM /Online /Cleanup-Image /RestoreHealth",
          "Tunggu hingga selesai (bisa 30-60 menit, butuh koneksi internet)",
          "Restart komputer",
          "Setelah restart, jalankan SFC lagi: sfc /scannow"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "60-120 menit",
        successRate: 85
      },
      {
        title: "Repair Install Windows (In-Place Upgrade)",
        steps: [
          "Download Windows 10/11 ISO dari website Microsoft",
          "Jalankan Media Creation Tool atau mount ISO",
          "Jalankan setup.exe dari ISO (saat Windows masih berjalan)",
          "Pilih 'Upgrade this PC now' (BUKAN Custom install)",
          "Ikuti wizard dan pilih 'Keep personal files and apps'",
          "Proses ini memperbaiki semua file Windows tanpa menghapus data"
        ],
        difficulty: "sedang",
        requiresReboot: true,
        estimatedTime: "60-120 menit",
        successRate: 90
      }
    ]
  },
  {
    id: "bsod-unexpected",
    category: "Windows System",
    title: "Blue Screen of Death (BSOD) - Various Errors",
    severity: "critical",
    symptoms: [
      "Layar biru dengan error code muncul tiba-tiba",
      "Komputer restart otomatis setelah BSOD",
      "BSOD terjadi secara random, tidak bisa diprediksi",
      "Dump file dibuat di C:\\Windows\\Minidump"
    ],
    indicators: [
      "bsodDetected",
      "minidumpFiles > 0",
      "unexpectedShutdown"
    ],
    description: "BSOD adalah mekanisme proteksi Windows ketika terjadi error fatal yang tidak bisa dipulihkan. Error code pada BSOD memberikan petunjuk tentang penyebabnya. Dump file yang dibuat bisa dianalisis untuk menemukan driver atau komponen yang menyebabkan crash.",
    solutions: [
      {
        title: "Analisis Minidump File",
        steps: [
          "Download BlueScreenView (nirsoft.net, gratis)",
          "Buka aplikasi dan file minidump akan otomatis dimuat",
          "Periksa kolom 'Caused By Driver' untuk menemukan driver penyebab",
          "Periksa juga 'Bug Check Code' untuk tipe error",
          "Screenshot hasil analisis untuk referensi",
          "Berdasarkan driver penyebab, update atau uninstall driver tersebut"
        ],
        difficulty: "sedang",
        requiresReboot: false,
        estimatedTime: "15-20 menit",
        successRate: 75
      },
      {
        title: "Periksa Memory (RAM)",
        steps: [
          "Banyak BSOD disebabkan oleh RAM yang rusak",
          "Jalankan Windows Memory Diagnostic (lihat solusi RAM defective)",
          "Atau gunakan memtest86+ (lebih akurat, boot dari USB)",
          "Jika RAM ditemukan bermasalah, ganti modul yang rusak",
          "Setelah perbaikan, monitor selama beberapa hari"
        ],
        difficulty: "sedang",
        requiresReboot: true,
        estimatedTime: "30-60 menit",
        successRate: 80
      },
      {
        title: "Uninstall Update Windows Terbaru (Jika BSOD mulai muncul setelah update)",
        steps: [
          "Buka Settings > Update & Security > View update history",
          "Klik 'Uninstall updates' di atas",
          "Di 'Microsoft Windows Updates', uninstall update terbaru",
          "Atau gunakan System Restore ke titik sebelum update",
          "Restart komputer",
          "Setelah stabil, tunggu update yang sudah diperbaiki oleh Microsoft"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "20-30 menit",
        successRate: 60
      }
    ]
  },

  // ==================== NETWORK ====================
  {
    id: "network-dns-issue",
    category: "Jaringan & Internet",
    title: "Masalah DNS (Internet Tersambung Tapi Tidak Bisa Browsing)",
    severity: "medium",
    symptoms: [
      "Wifi/LAN terhubung tapi browser tidak bisa membuka website",
      "Ping ke IP berhasil tapi ping ke domain gagal",
      "Error 'DNS_PROBE_FINISHED_NXDOMAIN' di browser",
      "Beberapa website bisa dibuka, yang lain tidak"
    ],
    indicators: [
      "pingIP success but pingDomain fail",
      "dnsResolutionFail",
      "nslookupTimeout"
    ],
    description: "Masalah DNS adalah salah satu masalah jaringan paling umum. DNS adalah 'phonebook' internet yang menerjemahkan nama domain (google.com) menjadi IP address. Jika DNS bermasalah, komputer tidak bisa 'mencari' alamat website meskipun koneksi internet fisiknya baik.",
    solutions: [
      {
        title: "Ganti DNS Server ke Google DNS",
        steps: [
          "Buka Settings > Network & Internet > Change adapter options",
          "Klik kanan koneksi aktif > Properties",
          "Pilih 'Internet Protocol Version 4 (TCP/IPv4)' > Properties",
          "Pilih 'Use the following DNS server addresses'",
          "Preferred DNS: 8.8.8.8",
          "Alternate DNS: 8.8.4.4",
          "Klik OK > OK",
          "Buka CMD dan jalankan: ipconfig /flushdns"
        ],
        difficulty: "mudah",
        requiresReboot: false,
        estimatedTime: "5-10 menit",
        successRate: 90
      },
      {
        title: "Reset Winsock & Network Stack",
        steps: [
          "Buka Command Prompt sebagai Administrator",
          "Jalankan: netsh winsock reset",
          "Jalankan: netsh int ip reset",
          "Jalankan: ipconfig /flushdns",
          "Jalankan: ipconfig /release",
          "Jalankan: ipconfig /renew",
          "Restart komputer"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "10 menit",
        successRate: 70
      }
    ]
  },
  {
    id: "network-high-latency",
    category: "Jaringan & Internet",
    title: "Koneksi Internet Lambat / Latency Tinggi",
    severity: "medium",
    symptoms: [
      "Web loading sangat lambat meskipun kecepatan paket tinggi",
      "Video streaming buffer terus-menerus",
      "Game online lag (ping tinggi)",
      "Video call putus-putus"
    ],
    indicators: [
      "ping > 100ms",
      "packetLoss > 2%",
      "jitter > 50ms"
    ],
    description: "Latency tinggi bisa disebabkan oleh banyak faktor: jarak ke server, kualitas koneksi ISP, router yang lemah, interference wifi, atau bahkan malware yang menggunakan bandwidth. Analisis perlu dilakukan dari komputer user hingga jaringan ISP.",
    solutions: [
      {
        title: "Diagnosis & Optimasi Koneksi",
        steps: [
          "Jalankan: tracert google.com untuk melihat rute koneksi",
          "Jalankan: ping -n 50 8.8.8.8 untuk test latency konsisten",
          "Jalankan: pathping 8.8.8.8 untuk deteksi packet loss per hop",
          "Jika loss tinggi di hop pertama = masalah router/WiFi",
          "Jika loss tinggi di hop ISP = hubungi ISP",
          "Coba ganti ke koneksi LAN (kabel) jika menggunakan WiFi"
        ],
        difficulty: "mudah",
        requiresReboot: false,
        estimatedTime: "15 menit",
        successRate: 60
      },
      {
        title: "Optimasi WiFi & Router",
        steps: [
          "Jika menggunakan WiFi: dekatkan ke router atau gunakan extender",
          "Ganti channel WiFi (hindari channel yang ramai, gunakan WiFi Analyzer app)",
          "Gunakan band 5GHz jika tersedia (lebih cepat, lebih pendek jangkauan)",
          "Restart router (cabut power 30 detik, colok kembali)",
          "Update firmware router ke versi terbaru",
          "Nonaktifkan QoS jika tidak diperlukan (bisa membatasi kecepatan)"
        ],
        difficulty: "mudah",
        requiresReboot: false,
        estimatedTime: "20 menit",
        successRate: 55
      }
    ]
  },

  // ==================== GPU ====================
  {
    id: "gpu-driver-crash",
    category: "GPU & Display",
    title: "GPU Driver Crash (Screen Flicker / Black Screen)",
    severity: "high",
    symptoms: [
      "Layar berkedip/flicker secara acak",
      "Black screen sesaat lalu kembali normal",
      "Error 'Display driver stopped responding and has recovered'",
      "Performa grafis sangat buruk atau turun drastis"
    ],
    indicators: [
      "eventLog contains nvlddmkm",
      "eventLog contains amdkmdap",
      "eventLog contains Display driver stopped",
      "gpuRecoveries > 0"
    ],
    description: "GPU driver crash bisa disebabkan oleh driver yang outdated, overheating GPU, power supply yang tidak mencukupi, atau GPU yang sudah rusak. Error 'Display driver stopped responding' adalah TDR (Timeout Detection and Recovery) - Windows mendeteksi GPU tidak merespons dan mencoba merestart driver.",
    solutions: [
      {
        title: "Update GPU Driver ke Versi Terbaru",
        steps: [
          "Kunjungi website resmi: NVIDIA (nvidia.com/drivers), AMD (amd.com/support), atau Intel",
          "Gunakan tool auto-detect di website untuk menemukan driver yang tepat",
          "Download dan install driver terbaru",
          "Pilih 'Custom install' > centang 'Perform clean installation'",
          "Setelah instalasi selesai, restart komputer",
          "Monitor selama beberapa hari apakah masalah terulang"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "20-30 menit",
        successRate: 65
      },
      {
        title: "Periksa Suhu & Power Supply GPU",
        steps: [
          "Download GPU-Z (techpowerup.com/gpuz, gratis)",
          "Monitor suhu GPU saat gaming atau rendering",
          "Normal: idle 30-50°C, load 60-85°C. Warning: > 90°C",
          "Jika suhu terlalu tinggi: bersihkan debu dari GPU, cek fan",
          "Periksa apakah power supply mencukupi (periksa rekomendasi watt GPU)",
          "Jika PSU kurang daya, upgrade ke PSU dengan watt lebih tinggi"
        ],
        difficulty: "sedang",
        requiresReboot: false,
        estimatedTime: "20-30 menit",
        successRate: 70
      }
    ]
  },

  // ==================== BOOT ====================
  {
    id: "slow-boot",
    category: "Performa & Startup",
    title: "Boot Time Sangat Lambat",
    severity: "medium",
    symptoms: [
      "Komputer butuh lebih dari 2-3 menit untuk boot",
      "Setelah tampil desktop, masih harus menunggu lama agar responsif",
      "Hard disk bekerja keras saat startup",
      "Banyak program otomatis berjalan saat startup"
    ],
    indicators: [
      "bootTime > 120 seconds",
      "highStartupPrograms",
      "slowPostBoot"
    ],
    description: "Boot yang lambat biasanya disebabkan oleh kombinasi: terlalu banyak program startup, service Windows yang tidak perlu, HDD yang lambat, atau malware. Windows 10/11 memiliki fitur Fast Startup yang membantu, tetapi jika masalah persisten, perlu investigasi lebih lanjut.",
    solutions: [
      {
        title: "Kurangi Program Startup",
        steps: [
          "Buka Task Manager > tab 'Startup' (Windows 10) atau 'Startup apps' (Windows 11)",
          "Klik kanan program yang tidak perlu berjalan saat startup > Disable",
          "Nonaktifkan: updater yang tidak penting, cloud apps, chat apps, dll",
          "Biarkan: antivirus, driver GPU (jika ada)",
          "Restart komputer dan ukur perubahan boot time",
          "Atau gunakan: Settings > Apps > Startup untuk versi Windows 11"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "10-15 menit",
        successRate: 50
      },
      {
        title: "Optimasi Windows Services di Startup",
        steps: [
          "Buka Start > ketik 'services.msc' > Enter",
          "Nonaktifkan services yang tidak diperlukan:",
          "  - Connected User Experiences and Telemetry (telemetry)",
          "  - Diagnostic Policy Service (jika tidak diperlukan)",
          "  - Downloaded Maps Manager",
          "  - Windows Search (jika tidak sering search file)",
          "Untuk setiap service: klik kanan > Properties > Startup type: Disabled",
          "JANGAN nonaktifkan: Windows Update, Security Center, DNS Client"
        ],
        difficulty: "sedang",
        requiresReboot: true,
        estimatedTime: "20 menit",
        successRate: 40
      },
      {
        title: "Aktifkan Fast Startup & Defragment",
        steps: [
          "Buka Control Panel > Power Options > Choose what power buttons do",
          "Klik 'Change settings that are currently unavailable'",
          "Centang 'Turn on fast startup (recommended)' > Save",
          "Jika menggunakan HDD: jalankan Disk Defragmenter secara berkala",
          "Jika menggunakan SSD: jalankan TRIM: CMD > 'optimiz' selesai",
          "Restart dan periksa perubahan"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "10 menit",
        successRate: 35
      }
    ]
  },

  // ==================== MALWARE ====================
  {
    id: "malware-infection",
    category: "Keamanan",
    title: "Infeksi Malware / Virus",
    severity: "critical",
    symptoms: [
      "Komputer sangat lambat tanpa alasan jelas",
      "Muncul pop-up iklan atau program yang tidak dikenal",
      "Program antivirus ter-nonaktif atau tidak bisa dibuka",
      "Penggunaan data internet tinggi tanpa aktivitas user",
      "File atau folder menghilang atau berubah"
    ],
    indicators: [
      "antivirusDisabled",
      "unknownProcesses",
      "highNetworkUsage",
      "suspiciousRegistryChanges",
      "browserHijacked"
    ],
    description: "Malware bisa menyebabkan hampir semua gejala masalah komputer. Dari sekedar membuat lambat hingga mencuri data pribadi. Deteksi malware membutuhkan tools khusus karena malware modern dirancang untuk menghindari deteksi dan menyembunyikan diri.",
    solutions: [
      {
        title: "Scan Lengkap dengan Windows Defender Offline",
        steps: [
          "Buka Windows Security > Virus & threat protection",
          "Pilih 'Scan options' > 'Microsoft Defender Offline scan'",
          "Klik 'Scan now' (komputer akan restart ke mode offline)",
          "Scan ini lebih ampuh karena berjalan di luar Windows",
          "Tunggu scan selesai (bisa 15-60 menit)",
          "Setelah selesai, lakukan full scan online juga"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "60-90 menit",
        successRate: 70
      },
      {
        title: "Scan dengan Malwarebytes Anti-Malware",
        steps: [
          "Download Malwarebytes Free dari website resmi (malwarebytes.com)",
          "Install dan update database terbaru",
          "Pilih 'Full scan' (lebih menyeluruh dari quick scan)",
          "Setelah scan selesai, karantina semua threat yang ditemukan",
          "Restart komputer",
          "Lakukan scan kedua untuk memastikan malware sudah bersih"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "60-120 menit",
        successRate: 85
      },
      {
        title: "Scan dengan AdwCleaner (Browser Hijacker)",
        steps: [
          "Download AdwCleaner dari website Malwarebytes",
          "Jalankan scan (tidak perlu install)",
          "AdwCleaner mendeteksi adware, toolbar, dan browser hijacker",
          "Klik 'Clean' untuk menghapus semua yang ditemukan",
          "Restart komputer (AdwCleaner akan membersihkan saat startup)",
          "Periksa browser: hapus extension yang tidak dikenal"
        ],
        difficulty: "mudah",
        requiresReboot: true,
        estimatedTime: "15-20 menit",
        successRate: 80
      }
    ]
  },

  // ==================== POWER SUPPLY ====================
  {
    id: "psu-unstable",
    category: "Power Supply",
    title: "Power Supply Tidak Stabil (Voltase Naik Turun)",
    severity: "critical",
    symptoms: [
      "Komputer restart sendiri saat bermain game atau rendering",
      "BSOD saat beban berat tetapi normal saat idle",
      "Kipas PSU berbunyi tidak normal (bunyi berderit)",
      "USB device sering disconnect-sendiri",
      "Komputer tidak mau menyala sama sekali"
    ],
    indicators: [
      "randomRestart under load",
      "bsod under load only",
      "usbDisconnect",
      "psuWhine",
      "voltageFluctuation"
    ],
    description: "Power supply yang tidak stabil adalah penyebab paling berbahaya karena bisa merusak semua komponen lain (motherboard, GPU, storage). Voltase yang tidak stabil menyebabkan signal noise yang memicu error random di semua komponen. Sayangnya, PSU bermasalah sulit dideteksi tanpa alat pengukuran khusus.",
    solutions: [
      {
        title: "Diagnosis Sementara (Tanpa Alat)",
        steps: [
          "Periksa apakah masalah terjadi hanya saat beban berat (gaming, rendering)",
          "Coba cabut peripheral yang tidak perlu (USB eksternal, speaker, dll)",
          "Jika komputer stabil tanpa peripheral tambahan, PSU mungkin sudah lemah",
          "Periksa kabel power: pastikan semua tercolok dengan baik",
          "Jika PSU berumur > 5 tahun, kemungkinan besar sudah perlu diganti",
          "Hindari menggunakan colokan/strip yang berbagi dengan perangkat besar (AC, kulkas)"
        ],
        difficulty: "mudah",
        requiresReboot: false,
        estimatedTime: "15-30 menit + observasi",
        successRate: 40
      },
      {
        title: "Ganti Power Supply",
        steps: [
          "Catat kebutuhan daya: jumlah total watt dari semua komponen",
          "Pilih PSU dengan rating 80 PLUS (Bronze/Silver/Gold/Platinum)",
          "Beli PSU dengan kapasitas 20-30% lebih besar dari kebutuhan aktual",
          "Ketika mengganti: catat koneksi semua kabel untuk referensi",
          "Lepas koneksi PSU lama, pasang PSU baru satu per satu",
          "Pastikan semua kabel (24-pin ATX, 8-pin CPU, 6/8-pin GPU, SATA, Molex) terhubung"
        ],
        difficulty: "lanjutan",
        requiresReboot: false,
        estimatedTime: "30-60 menit",
        successRate: 95
      }
    ]
  }
];

// ============================================================
// ANALYSIS ENGINE - Menganalisis data diagnostik
// ============================================================

export interface DiagnosticData {
  // System info
  computerName?: string;
  osVersion?: string;
  osBuild?: string;
  uptime?: string;
  
  // Hardware
  cpuModel?: string;
  cpuCores?: number;
  cpuUsage?: number;
  cpuTemperature?: number;
  totalRAMMB?: number;
  availableRAMMB?: number;
  totalStorageGB?: number;
  freeStorageGB?: number;
  gpuModel?: string;
  gpuDriver?: string;
  gpuTemperature?: number;
  
  // Disk health
  diskType?: string;
  diskHealth?: string;
  smartWarnings?: string[];
  diskUsage?: number;
  
  // Network
  networkLatency?: number;
  packetLoss?: number;
  dnsStatus?: string;
  
  // Event logs
  bsodHistory?: Array<{code: string; date: string}>;
  criticalEvents?: number;
  recentErrors?: Array<{source: string; message: string; date: string}>;
  
  // Services
  importantServices?: Array<{name: string; status: string}>;
  
  // Startup
  startupPrograms?: Array<{name: string; enabled: boolean}>;
  
  // User-reported symptoms
  userSymptoms?: string[];
  
  // Additional
  antivirusEnabled?: boolean;
  windowsUpdateStatus?: string;
  sfcResult?: string;
  dismHealth?: string;
}

export interface AnalysisResult {
  issues: Array<{
    issue: DiagnosticIssue;
    confidence: number; // 0-100, how confident the engine is
    matchedSymptoms: string[];
    matchedIndicators: string[];
  }>;
  overallSeverity: number; // 0-100
  summary: string;
  recommendations: string[];
}

// Keyword mapping for flexible symptom matching
// Maps user-friendly symptom phrases to known issue IDs
const SYMPTOM_KEYWORD_MAP: Record<string, string[]> = {
  // CPU & Processor
  "cpu-overheating": ["panas", "overheat", "suhu tinggi", "hangus", "mati sendiri", "therm", "fan keras", "kipas keras", "kipas berisik", "fan berisik", "restart sendiri tanpa peringatan"],
  "cpu-high-usage": ["lambat semua", "cpu tinggi", "100%", "prosesor tinggi", "tanggap lambat", "task manager", "respond lambat", "mematikan proses", "task manager cpu"],
  // RAM
  "ram-insufficient": ["ram tidak cukup", "memory low", "memori rendah", "ram habis", "kurang ram", "ram rendah", "ram low", "memori tidak cukuk"],
  "ram-defective": ["blue screen", "bsod", "memory_management", "page_fault", "restart acak", "restart random", "file corrupt", "file rusak", "random crash"],
  // Disk
  "disk-failing": ["bunyi aneh", "klik klik", "clicking", "file hilang", "disk bunyi", "hardisk bunyi", "delayed write", "write failed"],
  "disk-100-usage": ["disk 100", "100% disk", "disk usage tinggi", "loading lama", "loading circle", "harddisk 100", "hdd 100", "ssd 100", "loading circle terus"],
  // Driver
  "driver-corrupted": ["device manager kuning", "ikon kuning", "tanda seru", "perangkat tidak terdeteksi", "device manager error", "driver error"],
  // Windows
  "corrupted-system-files": ["windows update gagal", "update gagal", "fitur tidak berfungsi", "start menu rusak", "setting rusak", "windows rusak", "store tidak bisa", "windows bermasalah"],
  "bsod-unexpected": ["blue screen", "bsod", "layar biru", "blue screen of death", "minidump", "dump file"],
  // Network
  "network-dns-issue": ["internet tersambung tapi tidak bisa browsing", "dns", "tidak bisa browsing", "dns error", "nxdomain", "tidak bisa buka web", "wifi terhubung tapi tidak bisa", "lan terhubung tapi tidak bisa"],
  "network-high-latency": ["internet lambat", "buffer", "lag", "latensi", "latency", "putus putus", "video call buruk", "ping tinggi", "jitter"],
  // GPU
  "gpu-driver-crash": ["layar berkedip", "flicker", "screen flicker", "black screen", "layar hitam", "display driver stopped", "gpu crash", "layar mati"],
  // Performance
  "slow-boot": ["boot lambat", "startup lambat", "nyala lambat", "loading lama", "boot time", "nyalain lama", "hidup lambat"],
  // Security
  "malware-infection": ["pop-up", "popup", "iklan", "ads", "virus", "malware", "antivirus mati", "antivirus nonaktif", "program tidak dikenal", "data tinggi", "browser redirect", "hijack"],
  // Power
  "psu-unstable": ["restart gaming", "bsod gaming", "psu", "power supply", "usb disconnect", "kipas psu bunyi", "psu bunyi", "voltase", "tidak mau nyala"],
};

function matchSymptomsByKeywords(userSymptoms: string[], issueId: string): string[] {
  const keywords = SYMPTOM_KEYWORD_MAP[issueId];
  if (!keywords) return [];
  const matched: string[] = [];
  for (const symptom of userSymptoms) {
    const symptomLower = symptom.toLowerCase();
    for (const keyword of keywords) {
      if (symptomLower.includes(keyword) || keyword.includes(symptomLower)) {
        if (!matched.includes(symptom)) {
          matched.push(symptom);
        }
        break; // One match per user symptom is enough
      }
    }
  }
  return matched;
}

export function analyzeDiagnostic(data: DiagnosticData): AnalysisResult {
  const issues: AnalysisResult['issues'] = [];
  
  // Analyze each known issue against the data
  for (const knownIssue of KNOWLEDGE_BASE) {
    const matchedSymptoms: string[] = [];
    const matchedIndicators: string[] = [];
    
    // Check user-reported symptoms using flexible keyword matching
    if (data.userSymptoms && data.userSymptoms.length > 0) {
      const keywordMatches = matchSymptomsByKeywords(data.userSymptoms, knownIssue.id);
      matchedSymptoms.push(...keywordMatches);
      
      // Also do a broader text overlap check
      for (const symptom of data.userSymptoms) {
        const symptomLower = symptom.toLowerCase();
        // Extract key words from user symptom (2+ chars, skip common words)
        const words = symptomLower.split(/\s+/).filter(w => w.length > 2 && !["yang", "dan", "atau", "untuk", "pada", "dari", "yang", "dengan", "tidak", "sudah", "akan", "bisa", "ada", "ini", "itu", "sangat", "sering", "terus"].includes(w));
        for (const knownSymptom of knownIssue.symptoms) {
          const knownLower = knownSymptom.toLowerCase();
          const knownWords = knownLower.split(/\s+/).filter(w => w.length > 2);
          // Check if any significant word overlaps
          const overlap = words.filter(w => knownWords.some(kw => kw === w || (kw.length > 4 && w.includes(kw)) || (w.length > 4 && kw.includes(w))));
          if (overlap.length >= 1) {
            if (!matchedSymptoms.includes(symptom)) {
              matchedSymptoms.push(symptom);
            }
          }
        }
      }
    }
    
    // Check quantitative indicators
    // CPU Temperature
    if (data.cpuTemperature && data.cpuTemperature > 80) {
      if (knownIssue.indicators.some(i => i.includes("cpuTemperature") || i.includes("thermalThrottling"))) {
        matchedIndicators.push(`Suhu CPU tinggi: ${data.cpuTemperature}°C`);
      }
    }
    
    // CPU Usage
    if (data.cpuUsage && data.cpuUsage > 85) {
      if (knownIssue.indicators.some(i => i.includes("cpuUsage") || i.includes("systemResponsiveness"))) {
        matchedIndicators.push(`CPU usage tinggi: ${data.cpuUsage}%`);
      }
    }
    
    // RAM
    if (data.availableRAMMB && data.totalRAMMB) {
      const ramPercent = ((data.totalRAMMB - data.availableRAMMB) / data.totalRAMMB) * 100;
      if (ramPercent > 85 && knownIssue.indicators.some(i => i.includes("memoryUsage"))) {
        matchedIndicators.push(`RAM usage sangat tinggi: ${ramPercent.toFixed(0)}%`);
      }
      if (data.availableRAMMB < 1500 && knownIssue.indicators.some(i => i.includes("availableRAM"))) {
        matchedIndicators.push(`RAM tersedia rendah: ${data.availableRAMMB} MB`);
      }
    }
    
    // Disk usage
    if (data.diskUsage && data.diskUsage > 90) {
      if (knownIssue.indicators.some(i => i.includes("diskUsage"))) {
        matchedIndicators.push(`Disk usage tinggi: ${data.diskUsage}%`);
      }
    }
    
    // Disk health
    if (data.smartWarnings && data.smartWarnings.length > 0) {
      if (knownIssue.id === 'disk-failing') {
        matchedIndicators.push(`SMART warnings: ${data.smartWarnings.join(', ')}`);
      }
    }
    if (data.diskHealth && data.diskHealth.toLowerCase() !== "ok" && data.diskHealth.toLowerCase() !== "healthy" && knownIssue.id === 'disk-failing') {
      matchedIndicators.push(`Disk health tidak OK: ${data.diskHealth}`);
    }
    
    // Network
    if (data.networkLatency && data.networkLatency > 100) {
      if (knownIssue.indicators.some(i => i.includes("ping"))) {
        matchedIndicators.push(`Latensi tinggi: ${data.networkLatency}ms`);
      }
    }
    
    // Packet loss
    if (data.packetLoss && data.packetLoss > 2) {
      if (knownIssue.indicators.some(i => i.includes("packetLoss"))) {
        matchedIndicators.push(`Packet loss: ${data.packetLoss}%`);
      }
    }
    
    // DNS
    if (data.dnsStatus && (data.dnsStatus.toLowerCase().includes("fail") || data.dnsStatus.toLowerCase().includes("timeout"))) {
      if (knownIssue.id === 'network-dns-issue') {
        matchedIndicators.push(`DNS Status: ${data.dnsStatus}`);
      }
    }
    
    // BSOD
    if (data.bsodHistory && Array.isArray(data.bsodHistory) && data.bsodHistory.length > 0) {
      for (const bsod of data.bsodHistory) {
        // Safe extraction: handle string, object with .code, or fallback
        let bsodCode = '';
        if (typeof bsod === 'string') {
          bsodCode = bsod;
        } else if (bsod && typeof bsod === 'object') {
          bsodCode = String(bsod.code ?? '');
          // If code is still empty, try other common fields
          if (!bsodCode && bsod.errorCode) bsodCode = String(bsod.errorCode);
          if (!bsodCode && bsod.BugCheckCode) bsodCode = String(bsod.BugCheckCode);
          if (!bsodCode && bsod.message) bsodCode = String(bsod.message);
        } else {
          bsodCode = String(bsod ?? '');
        }
        const bsodLower = bsodCode.toLowerCase();
        if (bsodLower) {
          // Check against specific BSOD codes
          if (knownIssue.id === 'ram-defective' && (bsodLower.includes('memory_management') || bsodLower.includes('page_fault'))) {
            matchedIndicators.push(`BSOD: ${bsodCode}`);
          }
          if (knownIssue.id === 'gpu-driver-crash' && (bsodLower.includes('nvlddmkm') || bsodLower.includes('video') || bsodLower.includes('display'))) {
            matchedIndicators.push(`BSOD: ${bsodCode}`);
          }
          if (knownIssue.id === 'driver-corrupted' && bsodLower.includes('driver')) {
            matchedIndicators.push(`BSOD: ${bsodCode}`);
          }
        }
      }
      // General BSOD detection for the BSOD issue
      if (knownIssue.id === 'bsod-unexpected') {
        matchedIndicators.push(`Riwayat BSOD: ${data.bsodHistory.length} kejadian`);
      }
    }
    
    // System files
    if (data.sfcResult && data.sfcResult.toLowerCase().includes("violation") && knownIssue.indicators.some(i => i.includes("sfc"))) {
      matchedIndicators.push("SFC menemukan file corrupt");
    }
    if (data.dismHealth && (data.dismHealth.toLowerCase().includes("error") || data.dismHealth.toLowerCase().includes("corrupt")) && knownIssue.indicators.some(i => i.includes("dism"))) {
      matchedIndicators.push("DISM menemukan masalah");
    }
    
    // Antivirus
    if (data.antivirusEnabled === false && knownIssue.indicators.some(i => i.includes("antivirusDisabled"))) {
      matchedIndicators.push("Antivirus dinonaktifkan");
    }
    
    // Windows Update
    if (data.windowsUpdateStatus && data.windowsUpdateStatus.toLowerCase().includes("fail") && knownIssue.id === 'corrupted-system-files') {
      matchedIndicators.push("Windows Update gagal");
    }
    
    // Critical events
    if (data.criticalEvents && data.criticalEvents > 5 && knownIssue.id === 'corrupted-system-files') {
      matchedIndicators.push(`Banyak event critical: ${data.criticalEvents}`);
    }
    
    // If we have matches, calculate confidence
    if (matchedSymptoms.length > 0 || matchedIndicators.length > 0) {
      const symptomWeight = 0.6;
      const indicatorWeight = 0.4;
      const maxPossibleSymptoms = Math.max(knownIssue.symptoms.length, 1);
      const maxPossibleIndicators = Math.max(knownIssue.indicators.length, 1);
      
      const symptomScore = Math.min(matchedSymptoms.length / maxPossibleSymptoms, 1);
      const indicatorScore = Math.min(matchedIndicators.length / maxPossibleIndicators, 1);
      
      const confidence = Math.round(
        (symptomScore * symptomWeight + indicatorScore * indicatorWeight) * 100
      );
      
      // Lower threshold to 15 for keyword-matched results
      if (confidence >= 15) {
        issues.push({
          issue: knownIssue,
          confidence: Math.min(Math.max(confidence, 30), 95), // At least 30% for any match
          matchedSymptoms: [...new Set(matchedSymptoms)],
          matchedIndicators: [...new Set(matchedIndicators)],
        });
      }
    }
  }
  
  // Sort by confidence
  issues.sort((a, b) => b.confidence - a.confidence);
  
  // Calculate overall severity
  const severityMap: Record<string, number> = { critical: 100, high: 75, medium: 50, low: 25 };
  let overallSeverity = 0;
  if (issues.length > 0) {
    overallSeverity = Math.round(
      issues.reduce((sum, i) => {
        const base = severityMap[i.issue.severity] || 50;
        return sum + base * (i.confidence / 100);
      }, 0) / issues.length
    );
  }
  
  // Generate summary
  const summary = generateSummary(issues, overallSeverity);
  
  // Generate recommendations
  const recommendations = generateRecommendations(issues);
  
  return { issues, overallSeverity, summary, recommendations };
}

function generateSummary(issues: AnalysisResult['issues'], severity: number): string {
  if (issues.length === 0) {
    return "Tidak ditemukan masalah signifikan berdasarkan data diagnostik yang diberikan. Komputer dalam kondisi baik.";
  }
  
  const criticalCount = issues.filter(i => i.issue.severity === "critical").length;
  const highCount = issues.filter(i => i.issue.severity === "high").length;
  const mediumCount = issues.filter(i => i.issue.severity === "medium").length;
  
  let summary = `Ditemukan ${issues.length} masalah potensial. `;
  
  if (criticalCount > 0) {
    summary += `${criticalCount} masalah KRITIS yang memerlukan penanganan segera. `;
  }
  if (highCount > 0) {
    summary += `${highCount} masalah prioritas tinggi. `;
  }
  if (mediumCount > 0) {
    summary += `${mediumCount} masalah prioritas sedang. `;
  }
  
  summary += "Skor keseluruhan: " + (severity >= 80 ? "SANGAT KRITIS" : severity >= 60 ? "TINGGI" : severity >= 40 ? "SEDANG" : "RENDAH");
  
  return summary;
}

function generateRecommendations(issues: AnalysisResult['issues']): string[] {
  const recommendations: string[] = [];
  
  if (issues.length === 0) {
    recommendations.push("Lakukan pemeriksaan rutin secara berkala untuk menjaga kesehatan komputer.");
    recommendations.push("Pastikan Windows Update selalu aktif dan terbaru.");
    recommendations.push("Lakukan backup data secara rutin.");
    return recommendations;
  }
  
  // Prioritize by severity
  const sorted = [...issues].sort((a, b) => {
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return sevOrder[a.issue.severity] - sevOrder[b.issue.severity];
  });
  
  for (const { issue } of sorted) {
    if (issue.solutions.length > 0) {
      recommendations.push(`${issue.title}: ${issue.solutions[0].title} (${issue.solutions[0].estimatedTime})`);
    }
  }
  
  // General recommendations
  if (issues.some(i => i.issue.category === "Storage & Disk")) {
    recommendations.push("SEGERA backup data penting jika ada indikasi masalah storage.");
  }
  if (issues.some(i => i.issue.category === "CPU & Processor" && i.issue.id === "cpu-overheating")) {
    recommendations.push("Hindari penggunaan komputer berat sampai masalah overheating ditangani.");
  }
  
  return recommendations;
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return "destructive";
    case "high": return "warning";
    case "medium": return "secondary";
    case "low": return "default";
    default: return "default";
  }
}

export function getSeverityLabel(severity: string): string {
  switch (severity) {
    case "critical": return "Kritis";
    case "high": return "Tinggi";
    case "medium": return "Sedang";
    case "low": return "Rendah";
    default: return "Tidak diketahui";
  }
}
