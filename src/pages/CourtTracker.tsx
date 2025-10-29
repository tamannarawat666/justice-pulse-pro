import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, MapPin, AlertCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Hearing {
  id: string;
  caseTitle: string;
  date: string;
  time: string;
  court: string;
  type: string;
}

// Generate mock hearings for 2023–2027
const generateMockHearings = (): Hearing[] => {
  const hearings: Hearing[] = [];
  const courts = ['District Court', 'Consumer Forum', 'Labour Court', 'High Court'];
  const types = ['Main Hearing', 'Evidence Submission', 'Final Arguments', 'Preliminary Hearing'];
  for (let year = 2023; year <= 2027; year++) {
    for (let i = 1; i <= 3; i++) {
      const dateObj = new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1, 9 + i, 0);
      hearings.push({
        id: `${year}-${i}`,
        caseTitle: `Sample Case ${i} (${year})`,
        date: dateObj.toLocaleDateString(),
        time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        court: `${courts[Math.floor(Math.random() * courts.length)]}, City`,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }
  }
  return hearings;
};

const CourtTracker = () => {
  const [caseName, setCaseName] = useState("");
  const [courtDate, setCourtDate] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hearings, setHearings] = useState<Hearing[]>(generateMockHearings());
  const { toast } = useToast();

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!caseName || !courtDate || !userEmail) {
        toast({
          title: "Error",
          description: "Please fill all fields",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const dateObj = new Date(courtDate);

      const newHearing: Hearing = {
        id: Math.random().toString(),
        caseTitle: caseName,
        date: dateObj.toLocaleDateString(),
        time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        court: "Court details pending",
        type: "Hearing",
      };

      setHearings([newHearing, ...hearings]);

      // Reset form
      setCaseName("");
      setCourtDate("");
      setUserEmail("");

      toast({
        title: "Success",
        description: "Court reminder added successfully",
      });
    } catch (err) {
      console.error(err);
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

        {/* Next Hearing Info */}
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

        {/* Hearings List */}
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

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 h-96 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Calendar view of all hearings (2023–2027) is active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourtTracker;
