import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, XCircle, Clock, Filter, Search, ChevronDown, ChevronUp, Download, Settings, BarChart3, ShieldAlert, AlertOctagon } from 'lucide-react';

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
    {
      id: "4",
      category: "compliance",
      severity: "HIGH",
      title: "Missing Regulatory Approval Clause",
      description: "No provision for required regulatory approvals in key jurisdictions.",
      quote: "The parties agree to proceed with closing upon satisfaction of conditions...",
      score: 8,
      recommendation: "Add explicit regulatory approval requirements and timeline.",
      source: "claude",
      location: "Section 3.1, Page 11"
    },
    {
      id: "5",
      category: "employee",
      severity: "MEDIUM",
      title: "Key Employee Retention Undefined",
      description: "No clear terms for retaining key employees post-acquisition.",
      quote: "Key employees shall be retained under terms to be negotiated...",
      score: 5,
      recommendation: "Define specific retention packages and conditions.",
      source: "gpt4",
      location: "Section 7.2, Page 19"
    },
    {
      id: "6",
      category: "intellectual_property",
      severity: "CRITICAL",
      title: "IP Ownership Ambiguity",
      description: "Intellectual property ownership transfer terms are unclear.",
      quote: "All IP rights shall transfer to the extent legally permissible...",
      score: 9,
      recommendation: "Specify exact IP assets and transfer mechanisms.",
      source: "rule_engine",
      location: "Section 6.1, Page 17"
    }
  ],
  summary: {
    bySeverity: { CRITICAL: 2, HIGH: 2, MEDIUM: 2, LOW: 0 },
    byCategory: { liability: 1, financial: 1, vague_language: 1, compliance: 1, employee: 1, intellectual_property: 1 },
    bySource: { claude: 2, gpt4: 2, rule_engine: 2 }
  }
};

export default function MADDueDiligenceAnalyzer() {
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
  const [sortConfig, setSortConfig] = useState<{ key: keyof RedFlag; direction: 'asc' | 'desc' } | null>(null);
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

  const sourceLabels = {
    claude: 'Claude',
    gpt4: 'GPT-4',
    rule_engine: 'Rules'
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
      { progress: 15, message: 'Parsing PDF document...' },
      { progress: 35, message: 'Running rule-based checks...' },
      { progress: 55, message: 'Analyzing with Claude...' },
      { progress: 75, message: 'Analyzing with GPT-4...' },
      { progress: 90, message: 'Aggregating results...' },
      { progress: 100, message: 'Analysis complete!' }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setAnalysisProgress(step.progress);
        if (index === steps.length - 1) {
          setTimeout(() => {
            setIsAnalyzing(false);
            setAnalysisResult(mockAnalysisResult);
            setShowResults(true);
          }, 500);
        }
      }, index * 800);
    });
  }, []);

  const handleAnalyze = useCallback(() => {
    if (selectedFile) {
      simulateAnalysis();
    }
  }, [selectedFile, simulateAnalysis]);

  const filteredAndSortedFlags = useCallback(() => {
    if (!analysisResult) return [];
    
    let filtered = analysisResult.flags.filter(flag => {
      const matchesSeverity = filters.severity === 'all' || flag.severity === filters.severity;
      const matchesCategory = filters.category === 'all' || flag.category === filters.category;
      const matchesSource = filters.source === 'all' || flag.source === filters.source;
      const matchesSearch = !filters.search || 
        flag.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        flag.description.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesSeverity && matchesCategory && matchesSource && matchesSearch;
    });

    if (sortConfig) {
      const { key, direction } = sortConfig;
      filtered.sort((a, b) => {
        let cmp = 0;
        if (key === 'score') {
          // numeric comparison
          cmp = (a.score ?? 0) - (b.score ?? 0);
        } else {
          // string comparison for union/string keys
          const av = String(a[key] ?? '');
          const bv = String(b[key] ?? '');
          cmp = av.localeCompare(bv);
        }
        return direction === 'asc' ? cmp : -cmp;
      });
    }

    return filtered;
  }, [analysisResult, filters, sortConfig]);

  const handleSort = useCallback((key: keyof RedFlag) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'desc' };
      }
      return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
    });
  }, []);

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
            <p className="text-sm text-gray-600 mt-2">
              {analysisProgress < 100 ? 'Processing document...' : 'Analysis complete!'}
            </p>
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

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({...filters, severity: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters({...filters, source: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Sources</option>
                  {Object.entries(sourceLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search flags..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Flags Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Detected Red Flags</h3>
                <p className="text-sm text-gray-600">{filteredAndSortedFlags().length} flags match your filters</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('severity')}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Severity
                          {sortConfig?.key === 'severity' && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('title')}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Title
                          {sortConfig?.key === 'title' && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('category')}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Category
                          {sortConfig?.key === 'category' && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('score')}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Risk Score
                          {sortConfig?.key === 'score' && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={() => handleSort('source')}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Source
                          {sortConfig?.key === 'source' && (
                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAndSortedFlags().map((flag) => (
                      <tr
                        key={flag.id}
                        onClick={() => setSelectedFlag(flag)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${severityColors[flag.severity]}`}>
                            {flag.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{flag.title}</div>
                          <div className="text-sm text-gray-500 mt-1">{flag.description.substring(0, 60)}...</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {categoryLabels[flag.category as keyof typeof categoryLabels] || flag.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${getRiskScoreColor(flag.score)}`}>
                            {flag.score}/10
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {sourceLabels[flag.source as keyof typeof sourceLabels]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">{flag.location}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
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
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        )}

        {/* Flag Detail Modal */}
        {selectedFlag && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedFlag.title}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${severityColors[selectedFlag.severity]}`}>
                        {selectedFlag.severity}
                      </span>
                      <span className="text-sm text-gray-500">
                        {categoryLabels[selectedFlag.category as keyof typeof categoryLabels]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {sourceLabels[selectedFlag.source as keyof typeof sourceLabels]}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFlag(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Description</h4>
                    <p className="text-sm text-gray-600">{selectedFlag.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Location</h4>
                    <p className="text-sm text-gray-600">{selectedFlag.location}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Relevant Text</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700 italic">"{selectedFlag.quote}"</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Recommendation</h4>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">{selectedFlag.recommendation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <span className="text-sm text-gray-600">Risk Score: </span>
                      <span className={`text-lg font-semibold ${getRiskScoreColor(selectedFlag.score)}`}>
                        {selectedFlag.score}/10
                      </span>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Add to Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
