import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, AlertCircle, CheckCircle, Copy, Download, Loader2, Sparkles, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // Assuming this is needed elsewhere, kept for completeness
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea'; // Assuming you have a Textarea component

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const AISummarizer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileProcessing, setFileProcessing] = useState(false); // New state for local file processing
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false); // New state for drag-and-drop
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setFile(null);
    setSummary('');
    setError('');
    setLoading(false);
    setFileProcessing(false);
  }, []);

  const validateFile = (selectedFile: File): boolean => {
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      setError(`Unsupported file type. Please upload only ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()} files.`);
      return false;
    }
    
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setError(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
        return false;
    }

    return true;
  }

  const handleFile = (selectedFile: File) => {
    resetState(); // Reset error/summary when a new file is chosen
    if (validateFile(selectedFile)) {
        setError('');
        setFile(selectedFile);
        // Start local processing for initial feedback
        setFileProcessing(true);
        // Simulate/replace with your actual file content reading if needed for a preview
        // extractTextFromFile(selectedFile).then(() => setFileProcessing(false));
        // For this example, we just set file and stop processing immediately as the backend handles content extraction
        setTimeout(() => setFileProcessing(false), 500); 
    } else {
        setFile(null);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        handleFile(selectedFile);
    }
  };

  // Drag-and-Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const selectedFile = e.dataTransfer.files?.[0];
    if (selectedFile) {
        handleFile(selectedFile);
    }
  };

  // Kept extractTextFromFile but it's not strictly necessary for UI changes and might be heavy
  const extractTextFromFile = async (file: File): Promise<string> => {
    setFileProcessing(true);
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            // ... (Your existing file reading logic, possibly using a library for doc/docx)
            resolve(`Document: ${file.name}\nType: ${file.type}`); 
            setFileProcessing(false);
        };
        reader.onerror = () => {
            resolve(`Document: ${file.name}\nType: ${file.type}`);
            setFileProcessing(false);
        };
        reader.readAsArrayBuffer(file);
    });
  };


  const handleSummarize = async () => {
    if (!file) {
      toast({ title: "No file selected", description: "Please upload a legal document first", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError("");
    setSummary("");

    try {
        // ... (Your existing summarization logic using fetch) ...
        const formData = new FormData();
        formData.append("file", file);

        const resp = await fetch("http://localhost:5000/summarize", {
            method: "POST",
            body: formData,
        });

        const ct = resp.headers.get("content-type") || "";

        if (!resp.ok) {
            const text = await resp.text();
            setError(`Server error ${resp.status}: ${resp.statusText}`);
            toast({
                title: "Server error",
                description: `Status ${resp.status}. Response preview: ${text.slice(0, 300)}`,
                variant: "destructive",
            });
            return;
        }

        if (ct.includes("application/json")) {
            const data = await resp.json();
            if (data.status === "error") {
                setError(data.message || "Unknown server error");
                toast({ title: "Error", description: data.message || "Unknown server error", variant: "destructive" });
                return;
            }

            if (data.status === "success") {
                // Ensure summary is a string, joining array elements if necessary
                const summaryText = Array.isArray(data.summary) 
                    ? data.summary.map((p: string, i: number) => `**${i + 1}.** ${p}`).join("\n\n")
                    : String(data.summary);
                    
                setSummary(summaryText);
                toast({ title: "Success", description: "Document summarized successfully", variant: "success" });
                return;
            }

            // fallback
            setSummary(JSON.stringify(data, null, 2));
            return;
        } else {
            const text = await resp.text();
            setError("Server returned non-JSON response. Check console for details.");
            toast({ title: "Invalid response", description: "Server returned non-JSON. See console.", variant: "destructive" });
            return;
        }
    } catch (err: any) {
        setError(err.message || "Failed to summarize document");
        toast({ title: "Error", description: err.message || "Failed to summarize document", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    toast({
      title: "Copied!",
      description: "Summary copied to clipboard",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace(/\.[^/.]+$/, "") || 'document'}-summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: "Summary saved successfully",
    });
  };

  const isSummarizingDisabled = !file || loading || fileProcessing;
  const isClearDisabled = !file && !summary && !error;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="h-8 w-8 text-accent" />
          <h1 className="text-4xl md:text-5xl font-bold text-gradient">AI Document Summarizer</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Upload your legal document and get an easy-to-understand summary in seconds
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="animate-slide-up border-2 hover:border-accent/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Upload className="h-6 w-6 text-accent" />
              Upload Legal Document
            </CardTitle>
            <CardDescription>
              Supported formats: {ALLOWED_EXTENSIONS.map(ext => ext.toUpperCase()).join(', ')} | Max size: {MAX_FILE_SIZE_MB}MB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Drag and Drop Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-all bg-muted/30 relative
                ${isDragOver ? 'border-accent/80 bg-accent/10 scale-[1.02]' : 'border-border hover:border-accent/50'}
              `}
            >
              <Input
                id="file-upload"
                type="file"
                accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer h-full w-full z-10" // Make input invisible but clickable
              />
              <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? 'text-accent' : 'text-muted-foreground'}`} />
              <p className="text-lg font-semibold mb-1">
                {isDragOver ? 'Drop file here!' : 'Click to browse or drag & drop'}
              </p>
              <p className="text-sm text-muted-foreground">
                {file ? `Selected: ${file.name}` : 'No file selected'}
              </p>
            </div>

            {/* File Info / Error / Processing */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border-2 border-destructive/50 animate-scale-in">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {file && !error && (
              <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border-2 border-accent/50 animate-scale-in">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {fileProcessing || loading ? (
                    <Loader2 className="h-5 w-5 text-accent animate-spin flex-shrink-0" />
                  ) : (
                    <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetState}
                    title="Remove file"
                >
                    <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            )}

            <Button 
              onClick={handleSummarize} 
              disabled={isSummarizingDisabled}
              className="w-full h-12 text-lg gradient-accent border-0 hover:opacity-90 shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Document...
                </>
              ) : fileProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Reading File...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Summarize Document
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="animate-slide-up border-2 hover:border-accent/50 transition-colors" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CheckCircle className="h-6 w-6 text-accent" />
              Summary Result
            </CardTitle>
            <CardDescription>
              AI-generated summary in simple language
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="space-y-4 animate-fade-in">
                {/* Use a Textarea or similar component for a scrollable/editable look */}
                <Textarea
                  readOnly
                  value={summary}
                  className="min-h-[250px] p-4 bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-accent/20 whitespace-pre-wrap leading-relaxed font-mono resize-none"
                />
                
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={handleCopy} 
                    variant="outline"
                    className="flex-1 border-2 hover:border-accent hover:text-accent transition-colors"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    onClick={handleDownload} 
                    variant="outline"
                    className="flex-1 border-2 hover:border-accent hover:text-accent transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground transition-opacity">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">
                    {loading ? "Waiting for AI..." : "No summary yet"}
                </p>
                <p className="text-sm">Upload a legal document to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="mt-8 animate-scale-in border-2 border-accent/20">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            What types of legal documents can I summarize?
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              'Contracts & Agreements',
              'Court Documents',
              'Legal Notices',
              'Petitions & Affidavits',
              'Property Documents',
              'Corporate Legal Papers'
            ].map((type, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="text-sm font-medium">{type}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISummarizer;