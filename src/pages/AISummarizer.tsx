import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, AlertCircle, CheckCircle, Copy, Download, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AISummarizer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      const allowedTypes = ['pdf', 'doc', 'docx'];
      
      if (!allowedTypes.includes(fileExtension || '')) {
        setError('Please upload only PDF, DOC, or DOCX files');
        setFile(null);
        return;
      }
      
      setError('');
      setFile(selectedFile);
      setSummary('');
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        resolve(`File: ${file.name}\nType: ${file.type}\nSize: ${file.size} bytes\nContent (Base64 sample): ${base64.substring(0, 500)}...`);
      };
      reader.onerror = () => {
        resolve(`Document: ${file.name}\nType: ${file.type}\nSize: ${file.size} bytes`);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSummarize = async () => {
  if (!file) {
    toast({
      title: "No file selected",
      description: "Please upload a legal document first",
      variant: "destructive",
    });
    return;
  }

  setLoading(true);
  setError('');
  setSummary('');

  try {
    // Extract text from the uploaded file
    const documentText = await extractTextFromFile(file);

    // 🔗 Send the text to your backend summarizer API
   const formData = new FormData();
formData.append("file", file);

const response = await fetch("http://localhost:5000/upload", {
  method: "POST",
  body: formData,
});

    const data = await response.json();

    if (data.isLegal === false) {
      setError(data.error);
      toast({
        title: "Not a Legal Document",
        description: data.error,
        variant: "destructive",
      });
      return;
    }

    if (data.status === "error") {
      setError(data.message);
      toast({
        title: "Error",
        description: data.message,
        variant: "destructive",
      });
      return;
    }

    if (data.status === "success") {
      const formattedSummary = data.summary.map((point, i) => `${i + 1}. ${point}`).join("\n\n");
      setSummary(formattedSummary);
      toast({
        title: "Success!",
        description: "Legal document summarized successfully",
        className: "bg-accent text-accent-foreground",
      });
    }
  } catch (err) {
    console.error("Summarization error:", err);
    const errorMsg = err.message || "Failed to summarize document";
    setError(errorMsg);
    toast({
      title: "Error",
      description: errorMsg,
      variant: "destructive",
    });
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
    a.download = `${file?.name || 'document'}-summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: "Summary saved successfully",
    });
  };

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
              Supported formats: PDF, DOC, DOCX | Max size: 10MB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent/50 transition-colors bg-muted/30">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-3">
                Click to browse or drag & drop your file
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border-2 border-destructive/50 animate-scale-in">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {file && !error && (
              <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg border-2 border-accent/50 animate-scale-in">
                <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleSummarize} 
              disabled={!file || loading}
              className="w-full h-12 text-lg gradient-accent border-0 hover:opacity-90 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Document...
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
                <div className="prose prose-sm max-w-none">
                  <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-6 rounded-lg border-2 border-accent/20 whitespace-pre-wrap leading-relaxed">
                    {summary}
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={handleCopy} 
                    variant="outline"
                    className="flex-1 border-2 hover:border-accent hover:text-accent"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    onClick={handleDownload} 
                    variant="outline"
                    className="flex-1 border-2 hover:border-accent hover:text-accent"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">No summary yet</p>
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
