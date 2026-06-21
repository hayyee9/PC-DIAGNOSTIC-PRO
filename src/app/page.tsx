"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Thermometer,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  Clock,
  Activity,
  Shield,
  Upload,
  FileText,
  History,
  Wrench,
  Zap,
  Search,
  Loader2,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface AnalysisIssue {
  id: string;
  category: string;
  title: string;
  severity: string;
  confidence: number;
  matchedSymptoms: string[];
  matchedIndicators: string[];
  description: string;
  solutions: {
    title: string;
    steps: string[];
    difficulty: string;
    requiresReboot: boolean;
    estimatedTime: string;
    successRate: number;
  }[];
}

interface AnalysisResult {
  issues: AnalysisIssue[];
  overallSeverity: number;
  summary: string;
  recommendations: string[];
}

interface ComputerInfo {
  computerName: string;
  osVersion: string;
  cpuModel: string;
  totalRAMMB: number;
  totalStorageGB: number;
  gpuModel: string;
}

interface DiagnosticForm {
  computerName: string;
  osVersion: string;
  cpuModel: string;
  cpuCores: number;
  cpuUsage: number;
  cpuTemperature: number;
  totalRAMMB: number;
  availableRAMMB: number;
  totalStorageGB: number;
  freeStorageGB: number;
  gpuModel: string;
  gpuDriver: string;
  gpuTemperature: number;
  diskType: string;
  diskUsage: number;
  diskHealth: string;
  smartWarnings: string[];
  networkLatency: number;
  packetLoss: number;
  dnsStatus: string;
  antivirusEnabled: boolean;
  windowsUpdateStatus: string;
  userSymptoms: string[];
  bsodHistory: string;
  sfcResult: string;
  dismHealth: string;
  criticalEvents: number;
}

interface HistoryReport {
  id: string;
  computerName: string;
  osVersion: string;
  cpuModel: string;
  totalRAMMB: number;
  severityScore: number;
  status: string;
  createdAt: string;
}

// ============================================================
// Helper components
// ============================================================

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { variant: "destructive" | "default" | "secondary" | "outline"; label: string }> = {
    critical: { variant: "destructive", label: "Kritis" },
    high: { variant: "default", label: "Tinggi" },
    medium: { variant: "secondary", label: "Sedang" },
    low: { variant: "outline", label: "Rendah" },
  };
  const cfg = config[severity] || config.low;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 75 ? "bg-red-500" : value >= 50 ? "bg-amber-500" : value >= 30 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  );
}

function SeverityGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-red-500" : score >= 60 ? "text-orange-500" : score >= 40 ? "text-yellow-500" : "text-green-500";
  const label =
    score >= 80 ? "Sangat Kritis" : score >= 60 ? "Tinggi" : score >= 40 ? "Sedang" : "Sehat";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-5xl font-bold ${color}`}>{score}</div>
      <Badge variant={score >= 60 ? "destructive" : "secondary"} className="text-xs">
        {label}
      </Badge>
    </div>
  );
}

// ============================================================
// Main App Component
// ============================================================

export default function DiagnosticApp() {
  const [activeView, setActiveView] = useState<"dashboard" | "diagnose" | "history">("dashboard");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [computerInfo, setComputerInfo] = useState<ComputerInfo | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [historyReports, setHistoryReports] = useState<HistoryReport[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSolutions, setExpandedSolutions] = useState<Set<string>>(new Set());
  const [jsonUploadData, setJsonUploadData] = useState<string>("");
  const [showJsonUpload, setShowJsonUpload] = useState(false);

  const [form, setForm] = useState<DiagnosticForm>({
    computerName: "",
    osVersion: "",
    cpuModel: "",
    cpuCores: 0,
    cpuUsage: 0,
    cpuTemperature: 0,
    totalRAMMB: 0,
    availableRAMMB: 0,
    totalStorageGB: 0,
    freeStorageGB: 0,
    gpuModel: "",
    gpuDriver: "",
    gpuTemperature: 0,
    diskType: "SSD",
    diskUsage: 0,
    diskHealth: "OK",
    smartWarnings: [],
    networkLatency: 0,
    packetLoss: 0,
    dnsStatus: "OK",
    antivirusEnabled: true,
    windowsUpdateStatus: "Up to date",
    userSymptoms: [],
    bsodHistory: "",
    sfcResult: "No violations found",
    dismHealth: "Healthy",
    criticalEvents: 0,
  });

  const [symptomInput, setSymptomInput] = useState("");
  const [smartWarningInput, setSmartWarningInput] = useState("");

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/diagnose");
      const data = await res.json();
      if (data.success) {
        setHistoryReports(data.reports);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const addSymptom = () => {
    if (symptomInput.trim() && !form.userSymptoms.includes(symptomInput.trim())) {
      setForm({ ...form, userSymptoms: [...form.userSymptoms, symptomInput.trim()] });
      setSymptomInput("");
    }
  };

  const removeSymptom = (idx: number) => {
    setForm({ ...form, userSymptoms: form.userSymptoms.filter((_, i) => i !== idx) });
  };

  const addSmartWarning = () => {
    if (smartWarningInput.trim() && !form.smartWarnings.includes(smartWarningInput.trim())) {
      setForm({ ...form, smartWarnings: [...form.smartWarnings, smartWarningInput.trim()] });
      setSmartWarningInput("");
    }
  };

  const removeSmartWarning = (idx: number) => {
    setForm({ ...form, smartWarnings: form.smartWarnings.filter((_, i) => i !== idx) });
  };

  const toggleSolution = (id: string) => {
    const next = new Set(expandedSolutions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedSolutions(next);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setComputerInfo(null);

    try {
      const payload: Record<string, unknown> = {
        computerName: form.computerName || "Unknown PC",
        osVersion: form.osVersion || undefined,
        cpuModel: form.cpuModel || undefined,
        cpuCores: form.cpuCores || undefined,
        cpuUsage: form.cpuUsage || undefined,
        cpuTemperature: form.cpuTemperature || undefined,
        totalRAMMB: form.totalRAMMB || undefined,
        availableRAMMB: form.availableRAMMB || undefined,
        totalStorageGB: form.totalStorageGB || undefined,
        freeStorageGB: form.freeStorageGB || undefined,
        gpuModel: form.gpuModel || undefined,
        gpuDriver: form.gpuDriver || undefined,
        gpuTemperature: form.gpuTemperature || undefined,
        diskType: form.diskType || undefined,
        diskHealth: form.diskHealth || undefined,
        smartWarnings: form.smartWarnings.length > 0 ? form.smartWarnings : undefined,
        diskUsage: form.diskUsage || undefined,
        networkLatency: form.networkLatency || undefined,
        packetLoss: form.packetLoss || undefined,
        dnsStatus: form.dnsStatus || undefined,
        antivirusEnabled: form.antivirusEnabled,
        windowsUpdateStatus: form.windowsUpdateStatus || undefined,
        userSymptoms: form.userSymptoms.length > 0 ? form.userSymptoms : undefined,
        bsodHistory: (() => { if (!form.bsodHistory || !form.bsodHistory.trim() || form.bsodHistory.includes('[object')) return undefined; const codes = form.bsodHistory.split(',').map(s => s.trim()).filter(s => s.length > 0 && !s.includes('[object')); if (codes.length === 0) return undefined; return codes.map(code => ({ code, date: new Date().toISOString() })); })(),
        sfcResult: form.sfcResult || undefined,
        dismHealth: form.dismHealth || undefined,
        criticalEvents: form.criticalEvents || undefined,
      };

      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Server error (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
        setComputerInfo(data.computerInfo);
        setReportId(data.reportId);
        setActiveView("dashboard");
        fetchHistory();
      } else {
        alert("Gagal menganalisis: " + data.error);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Diagnostic analysis error:", err);
      alert("Terjadi kesalahan: " + errorMessage + "\n\nPastikan:\n1. Koneksi internet stabil\n2. Coba refresh halaman lalu coba lagi\n3. Jika upload JSON, pastikan format JSON valid");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseBSOD = (text: string) => {
    if (!text || !text.trim() || text.includes("[object")) return undefined;
    const codes = text.split(",").map(s => s.trim()).filter(s => s.length > 0 && !s.includes("[object"));
    if (codes.length === 0) return undefined;
    return codes.map(code => ({ code, date: new Date().toISOString() }));
  };

  const handleJsonUpload = () => {
    try {
      const parsed = JSON.parse(jsonUploadData);
      // Reset form first, then fill from JSON
      setForm(f => ({ ...f,
        bsodHistory: "",
        smartWarnings: [],
        userSymptoms: [],
        sfcResult: "",
        dismHealth: "",
        criticalEvents: 0,
      }));
      // Fill form from JSON
      if (parsed.computerName) setForm(f => ({ ...f, computerName: parsed.computerName }));
      if (parsed.osVersion) setForm(f => ({ ...f, osVersion: parsed.osVersion }));
      if (parsed.cpuModel) setForm(f => ({ ...f, cpuModel: parsed.cpuModel }));
      if (parsed.cpuCores) setForm(f => ({ ...f, cpuCores: parsed.cpuCores }));
      if (parsed.cpuUsage) setForm(f => ({ ...f, cpuUsage: parsed.cpuUsage }));
      if (parsed.cpuTemperature) setForm(f => ({ ...f, cpuTemperature: parsed.cpuTemperature }));
      if (parsed.totalRAMMB) setForm(f => ({ ...f, totalRAMMB: parsed.totalRAMMB }));
      if (parsed.availableRAMMB) setForm(f => ({ ...f, availableRAMMB: parsed.availableRAMMB }));
      if (parsed.totalStorageGB) setForm(f => ({ ...f, totalStorageGB: parsed.totalStorageGB }));
      if (parsed.freeStorageGB) setForm(f => ({ ...f, freeStorageGB: parsed.freeStorageGB }));
      if (parsed.gpuModel) setForm(f => ({ ...f, gpuModel: parsed.gpuModel }));
      if (parsed.gpuDriver) setForm(f => ({ ...f, gpuDriver: parsed.gpuDriver }));
      if (parsed.gpuTemperature) setForm(f => ({ ...f, gpuTemperature: parsed.gpuTemperature }));
      if (parsed.diskType) setForm(f => ({ ...f, diskType: parsed.diskType }));
      if (parsed.diskUsage) setForm(f => ({ ...f, diskUsage: parsed.diskUsage }));
      if (parsed.diskHealth) setForm(f => ({ ...f, diskHealth: parsed.diskHealth }));
      if (parsed.smartWarnings) {
        if (Array.isArray(parsed.smartWarnings)) {
          setForm(f => ({ ...f, smartWarnings: parsed.smartWarnings.map((w: unknown) => String(w)) }));
        } else if (typeof parsed.smartWarnings === 'string') {
          setForm(f => ({ ...f, smartWarnings: [parsed.smartWarnings] }));
        } else if (typeof parsed.smartWarnings === 'object') {
          setForm(f => ({ ...f, smartWarnings: [JSON.stringify(parsed.smartWarnings)] }));
        }
      }
      if (parsed.networkLatency) setForm(f => ({ ...f, networkLatency: parsed.networkLatency }));
      if (parsed.packetLoss) setForm(f => ({ ...f, packetLoss: parsed.packetLoss }));
      if (parsed.dnsStatus) setForm(f => ({ ...f, dnsStatus: parsed.dnsStatus }));
      if (parsed.antivirusEnabled !== undefined) setForm(f => ({ ...f, antivirusEnabled: parsed.antivirusEnabled }));
      if (parsed.windowsUpdateStatus) setForm(f => ({ ...f, windowsUpdateStatus: parsed.windowsUpdateStatus }));
      if (parsed.userSymptoms) setForm(f => ({ ...f, userSymptoms: parsed.userSymptoms }));
      if (parsed.bsodHistory) {
        // Normalize: PowerShell ConvertTo-Json converts single-item arrays to a plain object
        let bsodArr: unknown[];
        if (Array.isArray(parsed.bsodHistory)) {
          bsodArr = parsed.bsodHistory;
        } else if (typeof parsed.bsodHistory === 'object' && parsed.bsodHistory !== null) {
          // Single object (was a 1-element array before JSON serialization)
          bsodArr = [parsed.bsodHistory];
        } else if (typeof parsed.bsodHistory === 'string') {
          if (!parsed.bsodHistory.includes('[object')) {
            setForm(f => ({ ...f, bsodHistory: parsed.bsodHistory }));
          }
          bsodArr = [];
        } else {
          bsodArr = [];
        }
        // Always process and set bsodHistory to a clean string
        if (bsodArr.length > 0) {
          const codes = bsodArr
            .filter((b: unknown) => b != null)
            .map((b: Record<string, unknown>) => {
              if (typeof b === 'string') return b.trim();
              const code = String(b?.code ?? b?.errorCode ?? b?.BugCheckCode ?? b?.message ?? '').trim();
              if (code && code !== 'undefined') return code;
              // No code field - create readable summary from date
              const date = String(b?.date ?? '').substring(0, 10);
              return date ? `BSOD (${date})` : 'BSOD';
            })
            .filter((s: string) => s.length > 0 && !s.includes('[object'));
          if (codes.length > 0) {
            setForm(f => ({ ...f, bsodHistory: codes.join(", ") }));
          }
        }
      }
      if (parsed.sfcResult) setForm(f => ({ ...f, sfcResult: parsed.sfcResult }));
      if (parsed.dismHealth) setForm(f => ({ ...f, dismHealth: parsed.dismHealth }));
      if (parsed.criticalEvents !== undefined) setForm(f => ({ ...f, criticalEvents: parsed.criticalEvents }));
      setShowJsonUpload(false);
      setJsonUploadData("");
    } catch {
      alert("Format JSON tidak valid. Pastikan JSON yang Anda paste sudah benar.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setJsonUploadData(content);
      setShowJsonUpload(true);
    };
    reader.readAsText(file);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">PC Diagnostic Pro</h1>
              <p className="text-xs text-slate-500">Analisis Kerusakan Komputer Otomatis</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Button
              variant={activeView === "dashboard" ? "default" : "ghost"}
              size="sm"
              onClick={() => { setAnalysisResult(null); setComputerInfo(null); setActiveView("dashboard"); }}
            >
              <Monitor className="h-4 w-4 mr-1.5" />
              Dashboard
            </Button>
            <Button
              variant={activeView === "diagnose" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("diagnose")}
            >
              <Search className="h-4 w-4 mr-1.5" />
              Diagnosa Baru
            </Button>
            <Button
              variant={activeView === "history" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("history")}
            >
              <History className="h-4 w-4 mr-1.5" />
              Riwayat
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* ==================== DASHBOARD VIEW ==================== */}
        {activeView === "dashboard" && (
          <div className="space-y-6">
            {isAnalyzing ? (
              <Card className="p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Menganalisis Komputer...</h2>
                <p className="text-slate-500">Sedang memindai data dan mencocokkan dengan database kerusakan</p>
              </Card>
            ) : analysisResult ? (
              <>
                {/* Summary Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                          {analysisResult.issues.length === 0 ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-6 w-6 text-amber-500" />
                          )}
                          Hasil Analisis Diagnostik
                        </CardTitle>
                        <CardDescription className="mt-1">{analysisResult.summary}</CardDescription>
                      </div>
                      <SeverityGauge score={analysisResult.overallSeverity} />
                    </div>
                  </CardHeader>
                </Card>

                {/* Computer Info Cards */}
                {computerInfo && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <InfoCard icon={<Monitor className="h-4 w-4" />} label="Komputer" value={computerInfo.computerName} />
                    <InfoCard icon={<Cpu className="h-4 w-4" />} label="Prosesor" value={computerInfo.cpuModel || "-"} />
                    <InfoCard icon={<MemoryStick className="h-4 w-4" />} label="RAM" value={computerInfo.totalRAMMB ? `${computerInfo.totalRAMMB} MB` : "-"} />
                    <InfoCard icon={<HardDrive className="h-4 w-4" />} label="Storage" value={computerInfo.totalStorageGB ? `${computerInfo.totalStorageGB} GB` : "-"} />
                    <InfoCard icon={<Shield className="h-4 w-4" />} label="GPU" value={computerInfo.gpuModel || "-"} />
                    <InfoCard icon={<Zap className="h-4 w-4" />} label="OS" value={computerInfo.osVersion || "-"} />
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult.recommendations.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-emerald-600" />
                        Rekomendasi Prioritas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisResult.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm">
                            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-slate-700 pt-0.5">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Issues Detail */}
                {analysisResult.issues.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Detail Masalah Terdeteksi ({analysisResult.issues.length})
                    </h2>
                    <ScrollArea className="max-h-[800px]">
                      <div className="space-y-4 pr-4">
                        {analysisResult.issues.map((issue) => (
                          <Card key={issue.id} className="overflow-hidden">
                            <CardHeader className="pb-3">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <SeverityBadge severity={issue.severity} />
                                    <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                                  </div>
                                  <CardTitle className="text-base">{issue.title}</CardTitle>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                                  <span className="font-medium">Keyakinan:</span>
                                  <ConfidenceBar value={issue.confidence} />
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Description */}
                              <p className="text-sm text-slate-600">{issue.description}</p>

                              {/* Matched indicators */}
                              {(issue.matchedSymptoms.length > 0 || issue.matchedIndicators.length > 0) && (
                                <div className="flex flex-col sm:flex-row gap-4">
                                  {issue.matchedSymptoms.length > 0 && (
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                        Gejala yang Cocok
                                      </p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {issue.matchedSymptoms.map((s, i) => (
                                          <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {issue.matchedIndicators.length > 0 && (
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                        Indikator Terdeteksi
                                      </p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {issue.matchedIndicators.map((ind, i) => (
                                          <Badge key={i} variant="outline" className="text-xs border-amber-300 text-amber-700">{typeof ind === 'string' ? ind : JSON.stringify(ind)}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              <Separator />

                              {/* Solutions */}
                              <div>
                                <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                                  <Wrench className="h-4 w-4 text-emerald-600" />
                                  Solusi Penanganan ({issue.solutions.length})
                                </p>
                                <div className="space-y-3">
                                  {issue.solutions.map((sol, idx) => (
                                    <div key={idx} className="border rounded-lg overflow-hidden">
                                      <button
                                        onClick={() => toggleSolution(`${issue.id}-${idx}`)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="flex-shrink-0 h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                                            {idx + 1}
                                          </span>
                                          <div>
                                            <p className="text-sm font-medium text-slate-800">{sol.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <Badge variant="outline" className="text-[10px] h-4">
                                                {sol.difficulty}
                                              </Badge>
                                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                <Clock className="h-3 w-3" />
                                                {sol.estimatedTime}
                                              </span>
                                              <span className="text-[10px] text-muted-foreground">
                                                {sol.successRate}% berhasil
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        {expandedSolutions.has(`${issue.id}-${idx}`) ? (
                                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        )}
                                      </button>
                                      {expandedSolutions.has(`${issue.id}-${idx}`) && (
                                        <div className="px-4 py-3 bg-white space-y-2">
                                          <ol className="space-y-2">
                                            {sol.steps.map((step, sIdx) => (
                                              <li key={sIdx} className="flex items-start gap-2.5 text-sm text-slate-600">
                                                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold mt-0.5">
                                                  {sIdx + 1}
                                                </span>
                                                <span>{step}</span>
                                              </li>
                                            ))}
                                          </ol>
                                          {sol.requiresReboot && (
                                            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md mt-2">
                                              <Zap className="h-3.5 w-3.5" />
                                              Memerlukan restart komputer
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {analysisResult.issues.length === 0 && (
                  <Card className="p-8 text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Komputer dalam Kondisi Sehat!</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      Berdasarkan data diagnostik yang diberikan, tidak ditemukan masalah signifikan. Pastikan untuk melakukan pemeriksaan rutin secara berkala.
                    </p>
                  </Card>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setActiveView("diagnose")}>
                    <Search className="h-4 w-4 mr-1.5" />
                    Diagnosa Komputer Lain
                  </Button>
                </div>
              </>
            ) : (
              /* Empty state - no analysis yet */
              <Card className="p-12 text-center">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-6">
                  <Activity className="h-10 w-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Selamat Datang di PC Diagnostic Pro</h2>
                <p className="text-slate-500 max-w-lg mx-auto mb-8">
                  Aplikasi ini membantu Anda menganalisis dan menemukan solusi untuk masalah komputer yang tidak terlihat secara kasat mata.
                  Masukkan data diagnostik dari komputer yang bermasalah untuk memulai analisis.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button size="lg" onClick={() => setActiveView("diagnose")}>
                    <Search className="h-5 w-5 mr-2" />
                    Mulai Diagnosa Baru
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setActiveView("history")}>
                    <History className="h-5 w-5 mr-2" />
                    Lihat Riwayat
                  </Button>
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto">
                  <div className="text-center p-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                      <Upload className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">Upload Data</h3>
                    <p className="text-xs text-slate-500">Upload JSON dari script PowerShell collector</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center mx-auto mb-3">
                      <Cpu className="h-5 w-5 text-teal-600" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">Input Manual</h3>
                    <p className="text-xs text-slate-500">Atau masukkan data secara manual per kategori</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center mx-auto mb-3">
                      <Wrench className="h-5 w-5 text-cyan-600" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">Solusi Praktis</h3>
                    <p className="text-xs text-slate-500">Dapatkan rekomendasi solusi langkah-demi-langkah</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ==================== DIAGNOSE VIEW ==================== */}
        {activeView === "diagnose" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Search className="h-5 w-5 text-emerald-600" />
                  Diagnosa Komputer Baru
                </CardTitle>
                <CardDescription>
                  Masukkan data diagnostik dari komputer yang bermasalah. Anda bisa mengisi secara manual atau upload file JSON dari script PowerShell.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Upload JSON Toggle */}
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <Button
                      variant={showJsonUpload ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowJsonUpload(true)}
                    >
                      <FileText className="h-4 w-4 mr-1.5" />
                      Upload / Paste JSON
                    </Button>
                    <span className="text-xs text-muted-foreground">atau isi form di bawah</span>
                  </div>

                  {showJsonUpload && (
                    <div className="mt-3 space-y-3 border rounded-lg p-4 bg-slate-50">
                      <div>
                        <label className="text-sm font-medium block mb-1.5">
                          Paste JSON dari script PowerShell
                        </label>
                        <textarea
                          className="w-full h-48 rounded-md border bg-white p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder='{"computerName": "PC-KANTOR", "osVersion": "Windows 10 Pro", ...}'
                          value={jsonUploadData}
                          onChange={(e) => setJsonUploadData(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleJsonUpload}>
                          Isi Form dari JSON
                        </Button>
                        <span className="text-xs text-muted-foreground">atau</span>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-emerald-600 hover:underline">
                          <Upload className="h-3.5 w-3.5" />
                          Upload file .json
                          <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                        </label>
                        <Button size="sm" variant="ghost" onClick={() => { setShowJsonUpload(false); setJsonUploadData(""); }}>
                          Tutup
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Tabs defaultValue="system" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="system">
                      <Monitor className="h-3.5 w-3.5 mr-1.5" />
                      <span className="hidden sm:inline">Sistem</span>
                    </TabsTrigger>
                    <TabsTrigger value="hardware">
                      <Cpu className="h-3.5 w-3.5 mr-1.5" />
                      <span className="hidden sm:inline">Hardware</span>
                    </TabsTrigger>
                    <TabsTrigger value="network">
                      <Wifi className="h-3.5 w-3.5 mr-1.5" />
                      <span className="hidden sm:inline">Jaringan</span>
                    </TabsTrigger>
                    <TabsTrigger value="symptoms">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                      <span className="hidden sm:inline">Gejala</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* System Tab */}
                  <TabsContent value="system" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormInput label="Nama Komputer" value={form.computerName} onChange={v => setForm({...form, computerName: v})} placeholder="contoh: PC-KANTOR-01" />
                      <FormInput label="Versi OS" value={form.osVersion} onChange={v => setForm({...form, osVersion: v})} placeholder="contoh: Windows 10 Pro 22H2" />
                      <FormSelect label="Status Antivirus" value={form.antivirusEnabled ? "aktif" : "nonaktif"} onChange={v => setForm({...form, antivirusEnabled: v === "aktif"})} options={["aktif", "nonaktif"]} />
                      <FormInput label="Status Windows Update" value={form.windowsUpdateStatus} onChange={v => setForm({...form, windowsUpdateStatus: v})} placeholder="contoh: Up to date / Pending" />
                      <FormInput label="Hasil SFC" value={form.sfcResult} onChange={v => setForm({...form, sfcResult: v})} placeholder="contoh: No violations found" />
                      <FormInput label="Kesehatan DISM" value={form.dismHealth} onChange={v => setForm({...form, dismHealth: v})} placeholder="contoh: Healthy / Error" />
                      <FormNumber label="Event Critical (jumlah)" value={form.criticalEvents} onChange={v => setForm({...form, criticalEvents: v})} />
                      <FormInput label="Riwayat BSOD (pisahkan koma)" value={form.bsodHistory} onChange={v => setForm({...form, bsodHistory: v})} placeholder="contoh: MEMORY_MANAGEMENT, PAGE_FAULT" />
                    </div>
                  </TabsContent>

                  {/* Hardware Tab */}
                  <TabsContent value="hardware" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormInput label="Model CPU" value={form.cpuModel} onChange={v => setForm({...form, cpuModel: v})} placeholder="contoh: Intel Core i5-12400" />
                      <FormNumber label="Jumlah Core CPU" value={form.cpuCores} onChange={v => setForm({...form, cpuCores: v})} />
                      <FormNumber label="CPU Usage (%)" value={form.cpuUsage} onChange={v => setForm({...form, cpuUsage: Math.min(100, Math.max(0, v))})} />
                      <FormNumber label="Suhu CPU (°C)" value={form.cpuTemperature} onChange={v => setForm({...form, cpuTemperature: v})} />
                      <FormNumber label="Total RAM (MB)" value={form.totalRAMMB} onChange={v => setForm({...form, totalRAMMB: v})} />
                      <FormNumber label="RAM Tersedia (MB)" value={form.availableRAMMB} onChange={v => setForm({...form, availableRAMMB: v})} />
                      <FormNumber label="Total Storage (GB)" value={form.totalStorageGB} onChange={v => setForm({...form, totalStorageGB: v})} />
                      <FormNumber label="Storage Tersedia (GB)" value={form.freeStorageGB} onChange={v => setForm({...form, freeStorageGB: v})} />
                      <FormInput label="Model GPU" value={form.gpuModel} onChange={v => setForm({...form, gpuModel: v})} placeholder="contoh: NVIDIA RTX 3060" />
                      <FormInput label="Driver GPU" value={form.gpuDriver} onChange={v => setForm({...form, gpuDriver: v})} placeholder="contoh: 546.33" />
                      <FormNumber label="Suhu GPU (°C)" value={form.gpuTemperature} onChange={v => setForm({...form, gpuTemperature: v})} />
                      <FormSelect label="Tipe Disk" value={form.diskType} onChange={v => setForm({...form, diskType: v})} options={["SSD", "HDD", "NVMe SSD"]} />
                      <FormNumber label="Disk Usage (%)" value={form.diskUsage} onChange={v => setForm({...form, diskUsage: Math.min(100, Math.max(0, v))})} />
                      <FormInput label="Disk Health" value={form.diskHealth} onChange={v => setForm({...form, diskHealth: v})} placeholder="OK / Caution / Bad" />
                    </div>

                    {/* SMART Warnings */}
                    <div>
                      <label className="text-sm font-medium block mb-1.5">SMART Warnings</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          className="flex-1 rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="contoh: Reallocated Sectors Count: 5"
                          value={smartWarningInput}
                          onChange={(e) => setSmartWarningInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addSmartWarning()}
                        />
                        <Button size="sm" variant="outline" onClick={addSmartWarning}>Tambah</Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {form.smartWarnings.map((w, i) => (
                          <Badge key={i} variant="destructive" className="cursor-pointer" onClick={() => removeSmartWarning(i)}>
                            {w} <XCircle className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Network Tab */}
                  <TabsContent value="network" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormNumber label="Latensi Jaringan (ms)" value={form.networkLatency} onChange={v => setForm({...form, networkLatency: v})} />
                      <FormNumber label="Packet Loss (%)" value={form.packetLoss} onChange={v => setForm({...form, packetLoss: Math.min(100, Math.max(0, v))})} />
                      <FormInput label="Status DNS" value={form.dnsStatus} onChange={v => setForm({...form, dnsStatus: v})} placeholder="OK / Timeout / Fail" />
                    </div>
                  </TabsContent>

                  {/* Symptoms Tab */}
                  <TabsContent value="symptoms" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-1.5">
                        Gejala yang Dialami User (masukkan satu per satu)
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Contoh: komputer sering restart sendiri, layar biru muncul tiba-tiba, sangat lambat saat membuka aplikasi, fan berbunyi keras
                      </p>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          className="flex-1 rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Tuliskan gejala..."
                          value={symptomInput}
                          onChange={(e) => setSymptomInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addSymptom()}
                        />
                        <Button size="sm" onClick={addSymptom}>Tambah</Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                        {form.userSymptoms.map((s, i) => (
                          <Badge key={i} variant="secondary" className="cursor-pointer py-1.5 px-3" onClick={() => removeSymptom(i)}>
                            {s} <XCircle className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Quick symptom buttons */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-2">Pilih Gejala Umum:</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Komputer sangat lambat",
                          "Blue Screen of Death (BSOD)",
                          "Restart sendiri secara acak",
                          "Fan berbunyi sangat keras",
                          "Disk usage selalu 100%",
                          "CPU usage selalu 100%",
                          "RAM tidak cukup",
                          "Internet terhubung tapi tidak bisa browsing",
                          "Layar berkedip/flicker",
                          "Aplikasi sering not responding",
                          "File hilang atau corrupt",
                          "Boot time sangat lambat",
                          "Pop-up iklan muncul terus",
                          "Windows Update selalu gagal",
                        ].map((symptom) => (
                          <Button
                            key={symptom}
                            size="sm"
                            variant={form.userSymptoms.includes(symptom) ? "default" : "outline"}
                            className="text-xs h-7"
                            onClick={() => {
                              if (!form.userSymptoms.includes(symptom)) {
                                setForm({...form, userSymptoms: [...form.userSymptoms, symptom]});
                              } else {
                                removeSymptom(form.userSymptoms.indexOf(symptom));
                              }
                            }}
                          >
                            {symptom}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Submit */}
                <Separator className="my-6" />
                <div className="flex items-center gap-3">
                  <Button size="lg" onClick={handleAnalyze} disabled={isAnalyzing || (form.userSymptoms.length === 0 && form.cpuTemperature === 0 && form.cpuUsage === 0 && form.bsodHistory === "" && form.criticalEvents === 0 && form.diskUsage === 0 && form.networkLatency === 0)}>
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    {isAnalyzing ? "Menganalisis..." : "Analisis Sekarang"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Minimal isi gejala atau data hardware untuk mendapatkan hasil analisis. Semakin lengkap data, semakin akurat hasilnya.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ==================== HISTORY VIEW ==================== */}
        {activeView === "history" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <History className="h-5 w-5 text-emerald-600" />
                  Riwayat Diagnostik
                </CardTitle>
                <CardDescription>Daftar semua komputer yang pernah dianalisis</CardDescription>
              </CardHeader>
              <CardContent>
                {historyReports.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <History className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>Belum ada riwayat diagnostik</p>
                    <Button className="mt-3" size="sm" onClick={() => setActiveView("diagnose")}>
                      Mulai Diagnosa Pertama
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {historyReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            (report.severityScore ?? 0) >= 60 ? "bg-red-100" :
                            (report.severityScore ?? 0) >= 40 ? "bg-amber-100" : "bg-green-100"
                          }`}>
                            {(report.severityScore ?? 0) >= 60 ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (report.severityScore ?? 0) >= 40 ? (
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{report.computerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {report.osVersion || "-"} | {report.cpuModel || "-"} | {report.totalRAMMB || "-"} MB RAM
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={(report.severityScore ?? 0) >= 60 ? "destructive" : (report.severityScore ?? 0) >= 40 ? "default" : "secondary"}>
                            Skor: {report.severityScore ?? 0}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(report.createdAt).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>PC Diagnostic Pro — Analisis kerusakan komputer otomatis untuk Windows 10 & 11</p>
          <p>Script PowerShell collector tersedia untuk mengumpulkan data di komputer user</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="text-emerald-600">{icon}</div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-medium truncate" title={value}>{value}</p>
    </Card>
  );
}

function FormInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <input
        type="text"
        className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FormNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <input
        type="number"
        className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        value={value || ""}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min={0}
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <select
        className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
