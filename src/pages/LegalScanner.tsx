import { useState } from "react";
import { analyzeDocument } from "../services/legalService";
/** Shape of backend response */
interface LegalAnalysisResult {
  case_type: string;
  legal_domain: string;
  priority_level: "High" | "Medium" | "Low";
  summary: string;
  recommended_steps: string[];
}
export default function LegalScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<LegalAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const handleScan = async (): Promise<void> => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data: LegalAnalysisResult | null = await analyzeDocument(file);
      if (data) {
        setResult(data);
      } else {
        setError("Analysis failed. Is the Python backend running?");
      }
    } catch (err) {
      setError("Something went wrong during analysis.");
    } finally {
      setLoading(false);
    }
  };
  const footerTags = [
    "Contracts & Agreements",
    "Court Documents",
    "Legal Notices",
    "Petitions & Affidavits",
    "Property Documents",
    "Corporate Legal Papers",
  ];
  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-bold text-slate-700 flex items-center gap-3 justify-center md:justify-start">
            <svg
              className="w-10 h-10 text-teal-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              ></path>
            </svg>
            AI Document Summarizer
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Upload your legal document to get a professional summary and strategic action plan.
          </p>
        </div>
        {/* --- MAIN GRID (Upload & Summary) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* 1. LEFT CARD: UPLOAD */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col min-h-[400px]">
            <div className="mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Legal Document
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Supported formats: PDF | Max size: 10MB
              </p>
            </div>
            {/* Upload Zone */}
            <div className="flex-grow border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-10 text-center relative hover:bg-slate-100 transition-colors">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="mb-4 p-4 bg-white rounded-full shadow-sm">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              {file ? (
                <div className="text-teal-600 font-medium bg-teal-50 px-4 py-2 rounded-lg border border-teal-100 shadow-sm">
                  {file.name}
                </div>
              ) : (
                <>
                  <p className="text-slate-700 font-medium">Click to upload or drag & drop</p>
                  <p className="text-slate-400 text-sm mt-2">PDF Files only</p>
                </>
              )}
            </div>
            <button
              onClick={handleScan}
              disabled={!file || loading}
              className={`w-full mt-6 py-4 rounded-xl font-bold text-lg text-white shadow-md transition-all transform active:scale-[0.98] ${
                loading
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-teal-500 hover:bg-teal-600 shadow-teal-200"
              }`}
            >
              {loading ? "Processing Document..." : "✨ Analyze & Advise"}
            </button>
             {error && (
                <p className="mt-4 text-center text-sm text-red-500 bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>
             )}
          </div>
          {/* 2. RIGHT CARD: SUMMARY & FACTS */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col min-h-[400px]">
            <div className="mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Case Analysis
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Key facts extracted from the document
              </p>
            </div>
            <div className="flex-grow bg-slate-50 rounded-xl border border-slate-100 flex flex-col relative overflow-hidden">
              {!result ? (
                /* Empty State */
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 opacity-60">
                   <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                   </svg>
                   <h3 className="text-lg font-semibold text-slate-500">Waiting for input</h3>
                   <p className="text-slate-400 max-w-xs mt-2">Upload a file to see the case breakdown here.</p>
                </div>
              ) : (
                /* Result State */
                <div className="p-6 h-full overflow-y-auto animate-fade-in custom-scrollbar">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Case Type</span>
                        <div className="text-lg font-bold text-slate-800 mt-1 leading-tight">{result.case_type}</div>
                    </div>
                    <div className={`p-4 rounded-lg shadow-sm border ${
                        result.priority_level === "High" ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"
                    }`}>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</span>
                        <div className={`text-lg font-bold mt-1 ${
                             result.priority_level === "High" ? "text-red-600" : "text-green-600"
                        }`}>{result.priority_level}</div>
                    </div>
                  </div>
                  {/* Summary Text */}
                  <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 uppercase mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Executive Summary
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                        {result.summary}
                    </p>
                  </div>
                  {/* Legal Domain Badge */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <span className="inline-flex items-center px-3 rounded-full text-s font-medium bg-blue-50 text-blue-700">
                        Legal Domain: {result.legal_domain}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* --- 3. NEW SECTION: STRATEGIC ACTION PLAN --- */}
        {result && (
            <div className="mb-12 bg-white rounded-2xl shadow-lg border border-teal-100 overflow-hidden animate-fade-in-up">
                {/* Decorative Top Bar */}
                <div className="h-2 bg-gradient-to-r from-teal-400 to-blue-500 w-full"></div>
                
                <div className="p-8 md:p-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                <span className="bg-teal-100 p-2 rounded-lg text-teal-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </span>
                                Strategic Action Plan
                            </h3>
                            <p className="text-slate-500 mt-2">Recommended legal steps generated based on the provided document.</p>
                        </div>
                    </div>
                    {/* Steps Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {result.recommended_steps.map((step, index) => (
                            <div key={index} className="flex gap-4 p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all duration-200 group">
                                <div className="flex-shrink-0">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                                        {index + 1}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide mb-1">Step {index + 1}</h4>
                                    <p className="text-slate-700 leading-relaxed font-medium">
                                        {step}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex items-start gap-3">
                        <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <p className="text-sm text-yellow-800">
                            <strong>Disclaimer:</strong> This plan is generated by AI. It is intended for informational purposes only and does not constitute professional legal advice. Always consult with a qualified attorney before taking legal action.
                        </p>
                    </div>
                </div>
            </div>
        )}
        {/* --- FOOTER: DOCUMENT TYPES --- */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Supported Document Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {footerTags.map((tag, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors">
                 <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                 {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

