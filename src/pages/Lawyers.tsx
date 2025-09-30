import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Phone, Star, User } from 'lucide-react';

interface Lawyer {
  id: string;
  name: string;
  specialization: string;
  contact: string;
  location: string;
  rating: number;
  experience: string;
}

const mockLawyers: Lawyer[] = [
  {
    id: '1',
    name: 'Adv. Rajesh Kumar',
    specialization: 'Civil Law',
    contact: '+91 98765 43210',
    location: 'Mumbai, Maharashtra',
    rating: 4.8,
    experience: '15 years',
  },
  {
    id: '2',
    name: 'Adv. Priya Sharma',
    specialization: 'Criminal Law',
    contact: '+91 98765 43211',
    location: 'Delhi',
    rating: 4.9,
    experience: '12 years',
  },
  {
    id: '3',
    name: 'Adv. Amit Patel',
    specialization: 'Corporate Law',
    contact: '+91 98765 43212',
    location: 'Bangalore, Karnataka',
    rating: 4.7,
    experience: '10 years',
  },
];

const Lawyers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lawyers] = useState<Lawyer[]>(mockLawyers);

  const filteredLawyers = lawyers.filter(
    (lawyer) =>
      lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lawyer.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lawyer.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Legal Directory</h1>
        <p className="text-muted-foreground text-lg">Find verified lawyers and legal aid services</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, specialization, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredLawyers.map((lawyer) => (
          <Card key={lawyer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl mb-1">{lawyer.name}</CardTitle>
                  <Badge variant="outline">{lawyer.specialization}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{lawyer.contact}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{lawyer.location}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{lawyer.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">{lawyer.experience}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLawyers.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">No lawyers found</p>
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Nearby Lawyers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 h-96 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Map integration would display nearby lawyers here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Lawyers;
