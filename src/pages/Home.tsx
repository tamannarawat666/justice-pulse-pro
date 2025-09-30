import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Users, 
  Calendar, 
  AlertCircle, 
  BookOpen, 
  Bot,
  Scale,
  ArrowRight
} from 'lucide-react';
import heroImage from '@/assets/hero-courthouse.jpg';

const Home = () => {
  const features = [
    {
      title: 'Digital Case Filing',
      description: 'File your cases online with our streamlined digital process.',
      icon: FileText,
      link: '/file-case',
    },
    {
      title: 'Legal Directory',
      description: 'Connect with verified lawyers and legal aid services.',
      icon: Users,
      link: '/lawyers',
    },
    {
      title: 'Court Tracker',
      description: 'Track your hearing dates and receive timely notifications.',
      icon: Calendar,
      link: '/tracker',
    },
    {
      title: 'Complaint Portal',
      description: 'Lodge grievances and track their resolution status.',
      icon: AlertCircle,
      link: '/complaint',
    },
    {
      title: 'Legal Awareness',
      description: 'Access guides, FAQs, and simplified legal information.',
      icon: BookOpen,
      link: '/awareness',
    },
    {
      title: 'AI Summarizer',
      description: 'Get AI-powered summaries of legal documents and cases.',
      icon: Bot,
      link: '/dashboard',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative h-[600px] flex items-center justify-center text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(30, 64, 175, 0.8), rgba(30, 64, 175, 0.7)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto px-4 z-10 text-white animate-fade-in">
          <Scale className="h-16 w-16 mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Welcome to Justice Hub
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
            Your comprehensive legal platform for case management, legal assistance, and justice accessibility
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg">
              <Link to="/cases">
                View Cases
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white text-white text-lg">
              <Link to="/file-case">
                File a Case
                <FileText className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive legal services at your fingertips
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link 
                  key={index} 
                  to={feature.link}
                  className="block group"
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
            Join thousands of users accessing justice through our platform
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg">
            <Link to="/signup">
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Chatbot Icon */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button size="lg" className="rounded-full h-14 w-14 shadow-xl">
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Home;
