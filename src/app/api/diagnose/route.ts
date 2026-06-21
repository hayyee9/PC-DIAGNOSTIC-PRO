import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeDiagnostic, type DiagnosticData } from "@/lib/diagnostic-engine";

// POST /api/diagnose - Menerima data diagnostik dan menganalisis
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Format JSON tidak valid. Pastikan data yang dikirim berformat JSON yang benar." },
        { status: 400 }
      );
    }

    // Sanitize numeric values - ensure they are numbers, not strings
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

    // Parse diagnostic data
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
      bsodHistory: Array.isArray(body.bsodHistory) ? body.bsodHistory : undefined,
      criticalEvents: num(body.criticalEvents),
      recentErrors: Array.isArray(body.recentErrors) ? body.recentErrors : undefined,
      importantServices: Array.isArray(body.importantServices) ? body.importantServices : undefined,
      startupPrograms: Array.isArray(body.startupPrograms) ? body.startupPrograms : undefined,
      userSymptoms: Array.isArray(body.userSymptoms) ? body.userSymptoms.map(String) : undefined,
      antivirusEnabled: bool(body.antivirusEnabled) ?? false,
      windowsUpdateStatus: str(body.windowsUpdateStatus),
      sfcResult: str(body.sfcResult),
      dismHealth: str(body.dismHealth),
    };

    // Run analysis
    const analysis = analyzeDiagnostic(diagnosticData);

    // Save to database
    const report = await db.diagnosticReport.create({
      data: {
        computerName: diagnosticData.computerName,
        osVersion: diagnosticData.osVersion || null,
        osBuild: diagnosticData.osBuild || null,
        cpuModel: diagnosticData.cpuModel || null,
        cpuCores: diagnosticData.cpuCores || null,
        totalRAMMB: diagnosticData.totalRAMMB || null,
        totalStorageGB: diagnosticData.totalStorageGB || null,
        gpuModel: diagnosticData.gpuModel || null,
        gpuDriver: diagnosticData.gpuDriver || null,
        systemInfo: JSON.stringify({
          uptime: diagnosticData.uptime,
          cpuUsage: diagnosticData.cpuUsage,
          cpuTemperature: diagnosticData.cpuTemperature,
          availableRAMMB: diagnosticData.availableRAMMB,
          freeStorageGB: diagnosticData.freeStorageGB,
          gpuTemperature: diagnosticData.gpuTemperature,
        }),
        hardwareInfo: JSON.stringify({
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
        eventLogs: JSON.stringify({
          bsodHistory: diagnosticData.bsodHistory,
          criticalEvents: diagnosticData.criticalEvents,
          recentErrors: diagnosticData.recentErrors,
        }),
        servicesStatus: JSON.stringify(diagnosticData.importantServices),
        startupPrograms: JSON.stringify(diagnosticData.startupPrograms),
        symptoms: JSON.stringify(diagnosticData.userSymptoms),
        issuesFound: JSON.stringify(analysis.issues.map(i => ({
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
        severityScore: analysis.overallSeverity,
        status: "completed",
      },
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
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
      computerInfo: {
        computerName: diagnosticData.computerName,
        osVersion: diagnosticData.osVersion,
        cpuModel: diagnosticData.cpuModel,
        totalRAMMB: diagnosticData.totalRAMMB,
        totalStorageGB: diagnosticData.totalStorageGB,
        gpuModel: diagnosticData.gpuModel,
      },
    });
  } catch (error) {
    console.error("Diagnostic analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menganalisis data diagnostik" },
      { status: 500 }
    );
  }
}

// GET /api/diagnose - Ambil semua laporan diagnostik
export async function GET() {
  try {
    const reports = await db.diagnosticReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      reports: reports.map(r => ({
        id: r.id,
        computerName: r.computerName,
        osVersion: r.osVersion,
        cpuModel: r.cpuModel,
        totalRAMMB: r.totalRAMMB,
        severityScore: r.severityScore,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Fetch reports error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil laporan" },
      { status: 500 }
    );
  }
}
