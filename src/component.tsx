import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertTriangle, Clock, Filter, Search, XCircle, Download, Settings, ShieldAlert, AlertOctagon } from 'lucide-react';

interface RedFlag {
  id: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  quote: string;
  score: number;
  recommendation: string;
  source: 'claude' | 'gpt4' | 'rule_engine';
  location: string;
}

interface AnalysisResult {
  documentName: string;
  totalFlags: number;
  overallRiskScore: number;
  processingTime: number;
  flags: RedFlag[];
  summary: {
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    bySource: Record<string, number>;
  };
}

const mockAnalysisResult: AnalysisResult = {
  documentName: "sample_merger_agreement.pdf",
  totalFlags: 12,
  overallRiskScore: 7.2,
  processingTime: 45.3,
  flags: [
    {
      id: "1",
      category: "liability",
      severity: "CRITICAL",
      title: "Unlimited Liability Clause",
      description: "The agreement contains an unlimited liability clause that exposes the acquiring party to uncapped financial risk.",
      quote: "Party A shall be liable for all damages, losses, and expenses arising from...",
      score: 9,
      recommendation: "Negotiate a liability cap at 100% of transaction value.",
      source: "claude",
      location: "Section 8.2, Page 23"
    },
    {
      id: "2",
      category: "financial",
      severity: "HIGH",
      title: "Vague Revenue Recognition",
      description: "Revenue recognition terms are not clearly defined, potentially leading to disputes post-closing.",
      quote: "Revenue shall be recognized in accordance with generally accepted principles...",
      score: 8,
      recommendation: "Define specific revenue recognition methodology and timing.",
      source: "gpt4",
      location: "Section 5.1, Page 15"
    },
    {
      id: "3",
      category: "vague_language",
      severity: "MEDIUM",
      title: "Ambiguous Material Adverse Effect",
      description: "The definition of Material Adverse Effect is overly broad and subjective.",
      quote: "...any event that could reasonably be expected to have a material adverse effect...",
      score: 6,
      recommendation: "Narrow the definition to specific, measurable criteria.",
      source: "rule_engine",
      location: "Section 2.3, Page 8"
    },
  ],
  summary: {
    bySeverity: { CRITICAL: 1, HIGH: 1, MEDIUM: 1, LOW: 0 },
    byCategory: { liability: 1, financial: 1, vague_language: 1 },
    bySource: { claude: 1, gpt4: 1, rule_engine: 1 }
  }
};

export default function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<RedFlag | null>(null);
  const [filters, setFilters] = useState({
    severity: 'all',
    category: 'all',
    source: 'all',
    search: ''
  });
  const [settings, setSettings] = useState({
    useClaude: true,
    useGpt: true,
    useRules: true
  });

  const severityColors = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-300',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    LOW: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const categoryLabels = {
    liability: 'Liability',
    financial: 'Financial',
    vague_language: 'Vague Language',
    compliance: 'Compliance',
    employee: 'Employee',
    intellectual_property: 'IP',
    tax: 'Tax',
    jurisdiction: 'Jurisdiction',
    customer: 'Customer',
    other: 'Other'
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  const simulateAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setShowResults(false);

    const steps = [
      { progress: 25, delay: 500 },
      { progress: 50, delay: 800 },
      { progress: 75, delay: 800 },
      { progress: 100, delay: 500 }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setAnalysisProgress(step.progress);
        if (index === steps.length - 1) {
          setTimeout(() => {
            setIsAnalyzing(false);
            setAnalysisResult(mockAnalysisResult);
            setShowResults(true);
          }, 300);
        }
      }, steps.slice(0, index + 1).reduce((sum, s) => sum + s.delay, 0));
    });
  }, []);

  const handleAnalyze = useCallback(() => {
    if (selectedFile) {
      simulateAnalysis();
    }
  }, [selectedFile, simulateAnalysis]);

  const getRiskScoreColor = (score: number) => {
    if (score >= 8) return 'text-red-600';
    if (score >= 6) return 'text-orange-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">M&A Due Diligence Analyzer</h1>
          <p className="text-gray-600">AI-powered red flag detection for M&A contracts</p>
        </div>

        {/* Settings Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Analysis Settings
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.useClaude}
                onChange={(e) => setSettings({...settings, useClaude: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Claude Analysis</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.useGpt}
                onChange={(e) => setSettings({...settings, useGpt: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">GPT-4 Analysis</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.useRules}
                onChange={(e) => setSettings({...settings, useRules: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Rule Engine</span>
            </label>
          </div>
        </div>

        {/* File Upload */}
        {!showResults && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload M&A Document</h3>
              <p className="text-gray-600 mb-4">Drag and drop your PDF file here, or click to browse</p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Choose File
              </label>
              {selectedFile && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">Selected: {selectedFile.name}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || isAnalyzing}
              className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Analysis Progress</span>
              <span className="text-sm text-gray-500">{analysisProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && analysisResult && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Flags</p>
                    <p className="text-2xl font-bold text-gray-900">{analysisResult.totalFlags}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Risk Score</p>
                    <p className={`text-2xl font-bold ${getRiskScoreColor(analysisResult.overallRiskScore)}`}>
                      {analysisResult.overallRiskScore}/10
                    </p>
                  </div>
                  <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Processing Time</p>
                    <p className="text-2xl font-bold text-gray-900">{analysisResult.processingTime}s</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Critical Issues</p>
                    <p className="text-2xl font-bold text-red-600">{analysisResult.summary.bySeverity.CRITICAL}</p>
                  </div>
                  <AlertOctagon className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Flags List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Red Flags</h3>
              <div className="space-y-3">
                {analysisResult.flags.map((flag) => (
                  <div key={flag.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${severityColors[flag.severity]}`}>
                            {flag.severity}
                          </span>
                          <span className="text-xs text-gray-500">{flag.location}</span>
                        </div>
                        <h4 className="text-md font-semibold text-gray-900 mb-1">{flag.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{flag.description}</p>
                        <p className="text-sm text-gray-500 italic">"{flag.quote}"</p>
                        <div className="mt-2 p-2 bg-blue-50 rounded">
                          <p className="text-sm text-blue-800"><strong>Recommendation:</strong> {flag.recommendation}</p>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ml-4 ${getRiskScoreColor(flag.score)}`}>
                        {flag.score}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                setShowResults(false);
                setSelectedFile(null);
                setAnalysisResult(null);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Analyze Another Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}