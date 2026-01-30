import { useState } from "react";
import { analyzeDocument } from "../services/legalservice.js";

/** Shape of backend response */
interface LegalAnalysisResult {
  case_type: string;
  legal_domain: string;
  priority_level: "High" | "Medium" | "Low";
  summary: string;
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
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-700 flex items-center gap-3">
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
            Upload your legal document and get an easy-to-understand summary in seconds
          </p>
        </div>

        {/* MAIN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* LEFT CARD: UPLOAD */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
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
            {/* Dashed Area */}
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
                <div className="text-teal-600 font-medium bg-teal-50 px-4 py-2 rounded-lg border border-teal-100">
                  {file.name}
                </div>
              ) : (
                <>
                  <p className="text-slate-700 font-medium">Click to upload or drag & drop</p>
                  <p className="text-slate-400 text-sm mt-2">PDF Files only</p>
                </>
              )}
            </div>

            {/* Button */}
            <button
              onClick={handleScan}
              disabled={!file || loading}
              className={`w-full mt-6 py-4 rounded-xl font-bold text-lg text-white shadow-md transition-all transform active:scale-[0.98] ${
                loading
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-teal-400 hover:bg-teal-500 shadow-teal-200"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </span>
              ) : (
                "✨ Summarize Document"
              )}
            </button>

             {error && (
                <p className="mt-4 text-center text-sm text-red-500 bg-red-50 py-2 rounded-lg">{error}</p>
             )}
          </div>

          {/* RIGHT CARD: RESULT */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Summary Result
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                AI-generated summary in simple language
              </p>
            </div>
            <div className="flex-grow bg-slate-50 rounded-xl border border-slate-100 flex flex-col relative overflow-hidden">
              {!result ? (
                /* EMPTY STATE */
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 opacity-60">
                   <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                   </svg>
                   <h3 className="text-lg font-semibold text-slate-500">No summary yet</h3>
                   <p className="text-slate-400 max-w-xs mt-2">Upload a legal document to get started</p>
                </div>
              ) : (
                /* FILLED STATE (Your Logic + New Design) */
                <div className="p-6 h-full overflow-y-auto animate-fade-in">
                  
                  {/* Top Stats Row */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <span className="text-xs font-bold text-slate-400 uppercase">Case Type</span>
                        <div className="text-lg font-bold text-slate-800 mt-1 leading-tight">{result.case_type}</div>
                    </div>
                    <div className={`p-4 rounded-lg shadow-sm border ${
                        result.priority_level === "High" ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"
                    }`}>
                        <span className="text-xs font-bold text-slate-400 uppercase">Priority</span>
                        <div className={`text-lg font-bold mt-1 ${
                             result.priority_level === "High" ? "text-red-600" : "text-green-600"
                        }`}>{result.priority_level}</div>
                    </div>
                  </div>

                  {/* Summary Text */}
                  <div className="prose prose-sm text-slate-600">
                    <h4 className="text-sm font-bold text-slate-800 uppercase mb-2">AI Summary</h4>
                    <p className="leading-relaxed whitespace-pre-line">{result.summary}</p>
                  </div>
                  
                  {/* Footer of card */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase">Legal Domain</span>
                    <div className="text-sm font-semibold text-teal-600">{result.legal_domain}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* FOOTER: "What types..." */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd"></path></svg>
            What types of legal documents can I summarize?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {footerTags.map((tag, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors">
                 <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                 </div>
                 {tag}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}