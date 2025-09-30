import { Scale } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Scale className="h-5 w-5" />
            <span className="font-semibold">Justice Hub</span>
          </div>
          <p className="text-sm text-primary-foreground/80">
            © {new Date().getFullYear()} Justice Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
