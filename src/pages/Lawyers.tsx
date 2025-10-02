import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Phone, Star, User, Mail, Briefcase } from 'lucide-react';
import IndiaMap from '@/components/IndiaMap';

interface Lawyer {
  id: string;
  name: string;
  specialization: string;
  contact: string;
  email: string;
  location: string;
  rating: number;
  experience: string;
  lat: number;
  lng: number;
}

const mockLawyers: Lawyer[] = [
  {
    id: '1',
    name: 'Adv. Rajesh Kumar',
    specialization: 'Civil Law',
    contact: '+91 98765 43210',
    email: 'rajesh.kumar@legal.com',
    location: 'Mumbai, Maharashtra',
    rating: 4.8,
    experience: '15 years',
    lat: 19.0760,
    lng: 72.8777,
  },
  {
    id: '2',
    name: 'Adv. Priya Sharma',
    specialization: 'Criminal Law',
    contact: '+91 98765 43211',
    email: 'priya.sharma@legal.com',
    location: 'Delhi',
    rating: 4.9,
    experience: '12 years',
    lat: 28.6139,
    lng: 77.2090,
  },
  {
    id: '3',
    name: 'Adv. Amit Patel',
    specialization: 'Corporate Law',
    contact: '+91 98765 43212',
    email: 'amit.patel@legal.com',
    location: 'Bangalore, Karnataka',
    rating: 4.7,
    experience: '10 years',
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    id: '4',
    name: 'Adv. Sneha Reddy',
    specialization: 'Family Law',
    contact: '+91 98765 43213',
    email: 'sneha.reddy@legal.com',
    location: 'Hyderabad, Telangana',
    rating: 4.6,
    experience: '8 years',
    lat: 17.3850,
    lng: 78.4867,
  },
  {
    id: '5',
    name: 'Adv. Vikram Singh',
    specialization: 'Tax Law',
    contact: '+91 98765 43214',
    email: 'vikram.singh@legal.com',
    location: 'Pune, Maharashtra',
    rating: 4.8,
    experience: '14 years',
    lat: 18.5204,
    lng: 73.8567,
  },
  {
    id: '6',
    name: 'Adv. Meera Iyer',
    specialization: 'Property Law',
    contact: '+91 98765 43215',
    email: 'meera.iyer@legal.com',
    location: 'Chennai, Tamil Nadu',
    rating: 4.9,
    experience: '16 years',
    lat: 13.0827,
    lng: 80.2707,
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
      <div className="mb-8 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-gradient">Legal Directory</h1>
        <p className="text-muted-foreground text-lg">Find verified lawyers and legal aid services across India</p>
      </div>

      <div className="mb-8 animate-slide-up">
        <div className="relative">
          <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, specialization, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 text-lg border-2 focus:border-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredLawyers.map((lawyer, index) => (
          <Card 
            key={lawyer.id} 
            className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 hover:border-accent/50 animate-scale-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{lawyer.name}</CardTitle>
                  <Badge className="gradient-accent border-0">{lawyer.specialization}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="font-medium">{lawyer.contact}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="font-medium truncate">{lawyer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="font-medium">{lawyer.location}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="font-bold text-lg">{lawyer.rating}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-sm font-medium">{lawyer.experience}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLawyers.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-2xl text-muted-foreground">No lawyers found matching your search</p>
        </div>
      )}

      <Card className="animate-scale-in shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="h-6 w-6 text-accent" />
            Lawyer Locations Across India
          </CardTitle>
          <p className="text-muted-foreground">Interactive map showing verified legal professionals</p>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <IndiaMap lawyers={filteredLawyers} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Lawyers;
