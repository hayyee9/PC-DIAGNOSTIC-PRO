import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { analyzeDiagnostic, type DiagnosticData } from "@/lib/diagnostic-engine";
import { analyzeSOC, type SOCData } from "@/lib/soc-engine";
import { v4 as uuidv4 } from "uuid";

// POST /api/diagnose - Menerima data diagnostik dan menganalisis
export async function POST(request: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Format JSON tidak valid. Pastikan data yang dikirim berformat JSON yang benar." },
        { status: 400, headers }
      );
    }

    const num = (v: unknown): number | undefined => {
      if (v === undefined || v === null || v === "") return undefined;
      const n = typeof v === "number" ? v : Number(v);
      return isNaN(n) ? undefined : n;
    };

    const str = (v: unknown): string | undefined => {
      if (v === undefined || v === null || v === "") return undefined;
      return String(v);
    };

    const bool = (v: unknown): boolean | undefined => {
      if (v === undefined || v === null) return undefined;
      return Boolean(v);
    };

    // Parse diagnostic data (Knowledge Base engine)
    const diagnosticData: DiagnosticData = {
      computerName: str(body.computerName) || "Unknown PC",
      osVersion: str(body.osVersion),
      osBuild: str(body.osBuild),
      uptime: str(body.uptime),
      cpuModel: str(body.cpuModel),
      cpuCores: num(body.cpuCores),
      cpuUsage: num(body.cpuUsage),
      cpuTemperature: num(body.cpuTemperature),
      totalRAMMB: num(body.totalRAMMB),
      availableRAMMB: num(body.availableRAMMB),
      totalStorageGB: num(body.totalStorageGB),
      freeStorageGB: num(body.freeStorageGB),
      gpuModel: str(body.gpuModel),
      gpuDriver: str(body.gpuDriver),
      gpuTemperature: num(body.gpuTemperature),
      diskType: str(body.diskType),
      diskHealth: str(body.diskHealth),
      smartWarnings: Array.isArray(body.smartWarnings) ? body.smartWarnings.map(String) : undefined,
      diskUsage: num(body.diskUsage),
      networkLatency: num(body.networkLatency),
      packetLoss: num(body.packetLoss),
      dnsStatus: str(body.dnsStatus),
      bsodHistory: (() => {
        if (!body.bsodHistory) return undefined;
        const raw = Array.isArray(body.bsodHistory) ? body.bsodHistory :
          (typeof body.bsodHistory === 'object' ? [body.bsodHistory] : undefined);
        if (!raw) return undefined;
        return raw
          .filter((b: unknown) => b != null)
          .map((b: Record<string, unknown>) => {
            const code = typeof b === 'string' ? b : String(b?.code ?? b?.errorCode ?? b?.BugCheckCode ?? b?.message ?? '');
            const date = String(b?.date ?? '');
            return { code, date };
          });
      })(),
      criticalEvents: num(body.criticalEvents),
      recentErrors: Array.isArray(body.recentErrors) ? body.recentErrors :
        (body.recentErrors && typeof body.recentErrors === 'object' ? [body.recentErrors] : undefined),
      importantServices: Array.isArray(body.importantServices) ? body.importantServices :
        (body.importantServices && typeof body.importantServices === 'object' ? [body.importantServices] : undefined),
      startupPrograms: Array.isArray(body.startupPrograms) ? body.startupPrograms :
        (body.startupPrograms && typeof body.startupPrograms === 'object' ? [body.startupPrograms] : undefined),
      userSymptoms: Array.isArray(body.userSymptoms) ? body.userSymptoms.map(String) : undefined,
      antivirusEnabled: bool(body.antivirusEnabled) ?? false,
      windowsUpdateStatus: str(body.windowsUpdateStatus),
      sfcResult: str(body.sfcResult),
      dismHealth: str(body.dismHealth),
    };

    // Run BOTH analysis engines
    const analysis = analyzeDiagnostic(diagnosticData);

    // SOC Analysis (v4.1)
    const socData: SOCData = {
      ...diagnosticData,
      pagesPerSec: num(body.pagesPerSec),
      diskQueueLength: num(body.diskQueueLength),
      diskActiveTime: num(body.diskActiveTime),
      diskError7Count: num(body.diskError7Count),
      diskError153Count: num(body.diskError153Count),
      smartReallocatedSectors: num(body.smartReallocatedSectors),
      kernelPower41Last24h: num(body.kernelPower41Last24h),
      bugCheck1001Last24h: num(body.bugCheck1001Last24h),
      appCrash1000Last1h: num(body.appCrash1000Last1h),
      appCrash1002Last1h: num(body.appCrash1002Last1h),
    };
    const socAnalysis = analyzeSOC(socData);

    // Save to Supabase
    const reportId = uuidv4();
    const supabase = getSupabase();

    const { error: dbError } = await supabase.from('diagnostic_reports').insert({
      id: reportId,
      computer_name: diagnosticData.computerName,
      os_version: diagnosticData.osVersion || null,
      os_build: diagnosticData.osBuild || null,
      cpu_model: diagnosticData.cpuModel || null,
      cpu_cores: diagnosticData.cpuCores || null,
      total_ram_mb: diagnosticData.totalRAMMB || null,
      total_storage_gb: diagnosticData.totalStorageGB || null,
      gpu_model: diagnosticData.gpuModel || null,
      gpu_driver: diagnosticData.gpuDriver || null,
      system_info: JSON.stringify({
        uptime: diagnosticData.uptime,
        cpuUsage: diagnosticData.cpuUsage,
        cpuTemperature: diagnosticData.cpuTemperature,
        availableRAMMB: diagnosticData.availableRAMMB,
        freeStorageGB: diagnosticData.freeStorageGB,
        gpuTemperature: diagnosticData.gpuTemperature,
      }),
      hardware_info: JSON.stringify({
        diskType: diagnosticData.diskType,
        diskHealth: diagnosticData.diskHealth,
        smartWarnings: diagnosticData.smartWarnings,
        diskUsage: diagnosticData.diskUsage,
        networkLatency: diagnosticData.networkLatency,
        packetLoss: diagnosticData.packetLoss,
        dnsStatus: diagnosticData.dnsStatus,
        antivirusEnabled: diagnosticData.antivirusEnabled,
        windowsUpdateStatus: diagnosticData.windowsUpdateStatus,
      }),
      event_logs: JSON.stringify({
        bsodHistory: diagnosticData.bsodHistory,
        criticalEvents: diagnosticData.criticalEvents,
        recentErrors: diagnosticData.recentErrors,
      }),
      services_status: JSON.stringify(diagnosticData.importantServices),
      startup_programs: JSON.stringify(diagnosticData.startupPrograms),
      symptoms: JSON.stringify(diagnosticData.userSymptoms),
      issues_found: JSON.stringify(analysis.issues.map(i => ({
        id: i.issue.id,
        category: i.issue.category,
        title: i.issue.title,
        severity: i.issue.severity,
        confidence: i.confidence,
        matchedSymptoms: i.matchedSymptoms,
        matchedIndicators: i.matchedIndicators,
      }))),
      solutions: JSON.stringify(analysis.issues.map(i => ({
        issueTitle: i.issue.title,
        description: i.issue.description,
        solutions: i.issue.solutions,
      }))),
      severity_score: analysis.overallSeverity,
      status: "completed",
      soc_status: socAnalysis.status_keseluruhan,
      soc_components: JSON.stringify(socAnalysis.komponen_bermasalah),
      soc_root_cause: socAnalysis.akar_masalah,
      soc_anomalies: JSON.stringify(socAnalysis.detail_anomali_ditemukan),
      soc_recommendations: JSON.stringify(socAnalysis.rekomendasi_tindakan),
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      // Jangan crash — tetap return analysis walau DB gagal
    }

    return NextResponse.json({
      success: true,
      reportId,
      analysis: {
        issues: analysis.issues.map(i => ({
          id: i.issue.id,
          category: i.issue.category,
          title: i.issue.title,
          severity: i.issue.severity,
          confidence: i.confidence,
          matchedSymptoms: i.matchedSymptoms,
          matchedIndicators: i.matchedIndicators,
          description: i.issue.description,
          solutions: i.issue.solutions,
        })),
        overallSeverity: analysis.overallSeverity,
        summary: analysis.summary,
        recommendations: analysis.recommendations,
      },
      socAnalysis,
      computerInfo: {
        computerName: diagnosticData.computerName,
        osVersion: diagnosticData.osVersion,
        cpuModel: diagnosticData.cpuModel,
        totalRAMMB: diagnosticData.totalRAMMB,
        totalStorageGB: diagnosticData.totalStorageGB,
        gpuModel: diagnosticData.gpuModel,
      },
    }, { headers });
  } catch (error) {
    console.error("Diagnostic analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menganalisis data diagnostik" },
      { status: 500, headers }
    );
  }
}

// GET /api/diagnose - Ambil semua laporan diagnostik
export async function GET() {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const supabase = getSupabase();

    const { data: reports, error } = await supabase
      .from('diagnostic_reports')
      .select('id, computer_name, os_version, cpu_model, total_ram_mb, severity_score, soc_status, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Gagal mengambil laporan: " + error.message },
        { status: 500, headers }
      );
    }

    return NextResponse.json({
      success: true,
      reports: (reports || []).map(r => ({
        id: r.id,
        computerName: r.computer_name,
        osVersion: r.os_version,
        cpuModel: r.cpu_model,
        totalRAMMB: r.total_ram_mb,
        severityScore: r.severity_score,
        socStatus: r.soc_status,
        status: r.status,
        createdAt: r.created_at,
      })),
    }, { headers });
  } catch (error) {
    console.error("Fetch reports error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil laporan" },
      { status: 500, headers }
    );
  }
}

// OPTIONS /api/diagnose - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}