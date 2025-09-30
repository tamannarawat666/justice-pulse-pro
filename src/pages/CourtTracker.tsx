import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';

interface Hearing {
  id: string;
  caseTitle: string;
  date: string;
  time: string;
  court: string;
  type: string;
}

const mockHearings: Hearing[] = [
  {
    id: '1',
    caseTitle: 'Property Dispute Resolution',
    date: '2024-02-20',
    time: '10:00 AM',
    court: 'District Court, Mumbai',
    type: 'Main Hearing',
  },
  {
    id: '2',
    caseTitle: 'Consumer Protection Case',
    date: '2024-02-25',
    time: '2:00 PM',
    court: 'Consumer Forum, Delhi',
    type: 'Evidence Submission',
  },
  {
    id: '3',
    caseTitle: 'Employment Rights Violation',
    date: '2024-03-05',
    time: '11:30 AM',
    court: 'Labour Court, Bangalore',
    type: 'Final Arguments',
  },
];

const CourtTracker = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Court Hearing Tracker</h1>
        <p className="text-muted-foreground text-lg">Track your upcoming court hearings and receive notifications</p>
      </div>

      <div className="grid gap-6 mb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Next Hearing</p>
                <p className="text-sm text-muted-foreground">
                  You have {mockHearings.length} upcoming hearings scheduled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {mockHearings.map((hearing) => (
          <Card key={hearing.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl mb-2">{hearing.caseTitle}</CardTitle>
                  <Badge variant="outline">{hearing.type}</Badge>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{hearing.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{hearing.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Court</p>
                    <p className="font-medium">{hearing.court}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 h-96 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Calendar view of all hearings would be displayed here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourtTracker;
