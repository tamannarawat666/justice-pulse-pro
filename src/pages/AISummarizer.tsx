import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
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
        // Convert to base64 for better handling
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
        description: "Please upload a document first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');

    try {
      const documentText = await extractTextFromFile(file);

      const { data, error: functionError } = await supabase.functions.invoke('summarize-document', {
        body: { 
          documentText,
          fileName: file.name 
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (data.error) {
        setError(data.error);
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      } else if (data.summary) {
        setSummary(data.summary);
        toast({
          title: "Success",
          description: "Document summarized successfully!",
        });
      }
    } catch (err: any) {
      console.error('Summarization error:', err);
      setError(err.message || 'Failed to summarize document');
      toast({
        title: "Error",
        description: "Failed to process document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">AI Document Summarizer</h1>
        <p className="text-muted-foreground text-lg">
          Upload your legal document and get an easy-to-understand summary
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-6 w-6 text-primary" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Supported formats: PDF, DOC, DOCX
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {file && !error && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            )}

            <Button 
              onClick={handleSummarize} 
              disabled={!file || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Summarize Document
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="prose prose-sm max-w-none">
                <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Upload a document and click "Summarize Document" to see the summary here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AISummarizer;
