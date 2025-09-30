import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, FileText, Download } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  type: string;
  caseId: string;
  date: string;
  size: string;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Property Ownership Certificate',
    type: 'Judgment',
    caseId: 'CASE-2024-001',
    date: '2024-01-15',
    size: '2.5 MB',
  },
  {
    id: '2',
    title: 'Consumer Complaint Petition',
    type: 'Petition',
    caseId: 'CASE-2024-002',
    date: '2024-01-20',
    size: '1.8 MB',
  },
  {
    id: '3',
    title: 'Employment Contract Analysis',
    type: 'Order',
    caseId: 'CASE-2024-003',
    date: '2024-01-25',
    size: '3.2 MB',
  },
];

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [documents] = useState<Document[]>(mockDocuments);

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Legal Document Repository</h1>
        <p className="text-muted-foreground text-lg">Access judgments, petitions, and legal orders</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search documents by title or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{doc.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">{doc.type}</Badge>
                      <Badge variant="secondary">{doc.caseId}</Badge>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span>Date: {doc.date}</span>
                <span>Size: {doc.size}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">No documents found</p>
        </div>
      )}
    </div>
  );
};

export default Documents;
