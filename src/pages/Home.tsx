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
  ArrowRight,
  Shield,
  Clock,
  TrendingUp
} from 'lucide-react';
import heroIllustration from '@/assets/legal-hero-illustration.png';

const Home = () => {
  const features = [
    {
      title: 'Digital Case Filing',
      description: 'File your cases online with our streamlined digital process.',
      icon: FileText,
      link: '/file-case',
      color: 'from-primary to-primary/80',
    },
    {
      title: 'Legal Directory',
      description: 'Connect with verified lawyers and legal aid services.',
      icon: Users,
      link: '/lawyers',
      color: 'from-accent to-secondary',
    },
    {
      title: 'Court Tracker',
      description: 'Track your hearing dates and receive timely notifications.',
      icon: Calendar,
      link: '/tracker',
      color: 'from-primary to-accent',
    },
    {
      title: 'Complaint Portal',
      description: 'Lodge grievances and track their resolution status.',
      icon: AlertCircle,
      link: '/complaint',
      color: 'from-destructive to-destructive/80',
    },
    {
      title: 'Legal Awareness',
      description: 'Access guides, FAQs, and simplified legal information.',
      icon: BookOpen,
      link: '/awareness',
      color: 'from-accent to-accent/80',
    },
    {
      title: 'AI Summarizer',
      description: 'Get AI-powered summaries of legal documents and cases.',
      icon: Bot,
      link: '/ai-summarizer',
      color: 'from-primary to-secondary',
    },
  ];

  const stats = [
    { icon: Shield, value: '10,000+', label: 'Cases Filed' },
    { icon: Users, value: '500+', label: 'Verified Lawyers' },
    { icon: Clock, value: '24/7', label: 'Support Available' },
    { icon: TrendingUp, value: '95%', label: 'Success Rate' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden gradient-hero">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-2 mb-6">
                <Scale className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-accent">Professional Legal Services</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Justice at Your
                <span className="block text-gradient-accent">Fingertips</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-xl">
                Your comprehensive legal platform for case management, legal assistance, and accessible justice
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-lg gradient-accent border-0 hover:opacity-90 shadow-glow">
                  <Link to="/cases">
                    View Cases
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white/30 text-white text-lg backdrop-blur-sm">
                  <Link to="/file-case">
                    File a Case
                    <FileText className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block animate-scale-in">
              <img 
                src={heroIllustration} 
                alt="Legal Services Illustration" 
                className="w-full h-auto drop-shadow-2xl animate-float"
              />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className="text-center animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold mb-2 text-gradient">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Comprehensive Legal <span className="text-gradient-accent">Services</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for your legal journey, all in one place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link 
                  key={index} 
                  to={feature.link}
                  className="block group animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:shadow-accent/20 border-2 hover:border-accent/50">
                    <CardContent className="p-8">
                      <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-3 group-hover:text-accent transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="flex items-center gap-2 mt-6 text-accent font-medium group-hover:gap-4 transition-all">
                        Learn More
                        <ArrowRight className="h-4 w-4" />
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
      <section className="py-24 gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <Scale className="h-16 w-16 mx-auto mb-6 text-accent animate-float" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto text-white/90">
            Join thousands of users accessing justice through our platform
          </p>
          <Button asChild size="lg" className="text-lg gradient-accent border-0 hover:opacity-90 shadow-glow px-8">
            <Link to="/signup">
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
