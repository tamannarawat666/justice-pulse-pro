import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText } from 'lucide-react';

interface Case {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in-progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
}

const mockCases: Case[] = [
  {
    id: '1',
    title: 'Property Dispute Resolution',
    description: 'Land ownership conflict between two parties requiring legal intervention',
    category: 'Civil Law',
    status: 'in-progress',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Consumer Protection Case',
    description: 'Product defect claim against manufacturer',
    category: 'Consumer Law',
    status: 'pending',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Employment Rights Violation',
    description: 'Wrongful termination and compensation claim',
    category: 'Labour Law',
    status: 'resolved',
    priority: 'high',
  },
];

const Cases = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cases] = useState<Case[]>(mockCases);

  const filteredCases = cases.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'resolved':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Legal Cases</h1>
        <p className="text-muted-foreground text-lg">Browse and track legal cases</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search cases by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.map((caseItem) => (
          <Link key={caseItem.id} to={`/cases/${caseItem.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(caseItem.priority)}>
                      {caseItem.priority}
                    </Badge>
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(caseItem.status)}`} />
                  </div>
                </div>
                <CardTitle className="mt-4">{caseItem.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{caseItem.description}</p>
                <Badge variant="outline">{caseItem.category}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">No cases found</p>
        </div>
      )}
    </div>
  );
};

export default Cases;
