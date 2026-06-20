import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeDiagnostic, type DiagnosticData } from "@/lib/diagnostic-engine";

// POST /api/diagnose - Menerima data diagnostik dan menganalisis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Parse diagnostic data
    const diagnosticData: DiagnosticData = {
      computerName: body.computerName || "Unknown PC",
      osVersion: body.osVersion,
      osBuild: body.osBuild,
      uptime: body.uptime,
      cpuModel: body.cpuModel,
      cpuCores: body.cpuCores,
      cpuUsage: body.cpuUsage,
      cpuTemperature: body.cpuTemperature,
      totalRAMMB: body.totalRAMMB,
      availableRAMMB: body.availableRAMMB,
      totalStorageGB: body.totalStorageGB,
      freeStorageGB: body.freeStorageGB,
      gpuModel: body.gpuModel,
      gpuDriver: body.gpuDriver,
      gpuTemperature: body.gpuTemperature,
      diskType: body.diskType,
      diskHealth: body.diskHealth,
      smartWarnings: body.smartWarnings,
      diskUsage: body.diskUsage,
      networkLatency: body.networkLatency,
      packetLoss: body.packetLoss,
      dnsStatus: body.dnsStatus,
      bsodHistory: body.bsodHistory,
      criticalEvents: body.criticalEvents,
      recentErrors: body.recentErrors,
      importantServices: body.importantServices,
      startupPrograms: body.startupPrograms,
      userSymptoms: body.userSymptoms,
      antivirusEnabled: body.antivirusEnabled,
      windowsUpdateStatus: body.windowsUpdateStatus,
      sfcResult: body.sfcResult,
      dismHealth: body.dismHealth,
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
