import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, MapPin, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [caseName, setCaseName] = useState("");
  const [courtDate, setCourtDate] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hearings, setHearings] = useState<Hearing[]>(mockHearings);
  const [calendar, setCalendar] = useState<Record<string, Hearing[]>>({});
  const { toast } = useToast();

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('court-reminder', {
        body: { caseName, courtDate, userEmail }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Error",
          description: "Failed to add reminder. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (data?.status === "error") {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      } else if (data?.status === "success") {
        toast({
          title: "Success",
          description: data.message,
        });
        
        // Update local state with new schedule and calendar
        if (data.upcoming_schedule) {
          const formattedHearings = data.upcoming_schedule.map((h: any) => ({
            id: Math.random().toString(),
            caseTitle: h.case_name,
            date: new Date(h.court_date).toLocaleDateString(),
            time: new Date(h.court_date).toLocaleTimeString(),
            court: 'Court details pending',
            type: 'Hearing'
          }));
          setHearings(formattedHearings);
        }

        if (data.calendar) {
          setCalendar(data.calendar);
        }

        // Reset form
        setCaseName("");
        setCourtDate("");
        setUserEmail("");
      }
    } catch (error) {
      console.error("Error adding reminder:", error);
      toast({
        title: "Error",
        description: "Failed to add court reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Court Hearing Tracker</h1>
        <p className="text-muted-foreground text-lg">Track your upcoming court hearings and receive notifications</p>
      </div>

      <div className="grid gap-6 mb-8">
        {/* Add Reminder Form */}
        <Card className="bg-accent/5 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent" />
              Add Court Reminder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="caseName">Case Name</Label>
                  <Input
                    id="caseName"
                    value={caseName}
                    onChange={(e) => setCaseName(e.target.value)}
                    placeholder="Enter case name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courtDate">Court Date & Time</Label>
                  <Input
                    id="courtDate"
                    type="datetime-local"
                    value={courtDate}
                    onChange={(e) => setCourtDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Adding Reminder..." : "Add Reminder"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Next Hearing</p>
                <p className="text-sm text-muted-foreground">
                  You have {hearings.length} upcoming hearings scheduled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {hearings.map((hearing) => (
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
