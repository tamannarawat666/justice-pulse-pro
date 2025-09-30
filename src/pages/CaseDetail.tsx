import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Calendar, User } from 'lucide-react';

const CaseDetail = () => {
  const { id } = useParams();

  const mockCase = {
    id: id,
    title: 'Property Dispute Resolution',
    description: 'Land ownership conflict between two parties requiring legal intervention',
    category: 'Civil Law',
    status: 'in-progress',
    priority: 'high',
    filedDate: '2024-01-15',
    nextHearing: '2024-02-20',
    assignedLawyer: 'Adv. Rajesh Kumar',
    details: 'This case involves a property dispute between two neighboring landowners regarding boundary demarcation. The case has been filed in the District Court and is currently under review. Both parties have submitted their respective documents and evidence.',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link to="/cases">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cases
        </Link>
      </Button>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{mockCase.title}</CardTitle>
                <div className="flex gap-2 mt-4">
                  <Badge variant="outline">{mockCase.category}</Badge>
                  <Badge className="bg-blue-100 text-blue-800">{mockCase.status}</Badge>
                  <Badge className="bg-red-100 text-red-800">{mockCase.priority} priority</Badge>
                </div>
              </div>
              <FileText className="h-12 w-12 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground mb-6">{mockCase.description}</p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Filed Date</p>
                  <p className="font-medium">{mockCase.filedDate}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Next Hearing</p>
                  <p className="font-medium">{mockCase.nextHearing}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Lawyer</p>
                  <p className="font-medium">{mockCase.assignedLawyer}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{mockCase.details}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CaseDetail;
