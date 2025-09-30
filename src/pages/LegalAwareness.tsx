import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Scale, Shield } from 'lucide-react';

const LegalAwareness = () => {
  const faqs = [
    {
      question: 'What are my fundamental rights under the Indian Constitution?',
      answer: 'The Constitution of India guarantees six fundamental rights: Right to Equality, Right to Freedom, Right against Exploitation, Right to Freedom of Religion, Cultural and Educational Rights, and Right to Constitutional Remedies.',
    },
    {
      question: 'How do I file a First Information Report (FIR)?',
      answer: 'You can file an FIR at any police station regardless of jurisdiction. The police are legally bound to register your complaint. You can also file an e-FIR online in many states.',
    },
    {
      question: 'What is the procedure for consumer complaints?',
      answer: 'Consumer complaints can be filed with District, State, or National Consumer Disputes Redressal Commissions depending on the value of goods or services. You can also file online complaints through the National Consumer Helpline.',
    },
    {
      question: 'What are my rights as a worker?',
      answer: 'Workers have rights including minimum wages, safe working conditions, social security, right to form unions, and protection against discrimination. The specific rights depend on the type of employment and applicable labor laws.',
    },
  ];

  const guides = [
    {
      title: 'Understanding Your Legal Rights',
      description: 'A comprehensive guide to fundamental rights and legal protections available to Indian citizens',
      icon: Scale,
    },
    {
      title: 'Navigating the Court System',
      description: 'Step-by-step guide on how to approach courts and understand legal procedures',
      icon: BookOpen,
    },
    {
      title: 'Legal Aid and Pro Bono Services',
      description: 'Information about free legal services and how to access them',
      icon: Shield,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Legal Awareness</h1>
        <p className="text-muted-foreground text-lg">Educational resources and guides for legal literacy</p>
      </div>

      <div className="grid gap-8">
        <section>
          <h2 className="text-3xl font-semibold mb-6">Legal Guides</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {guides.map((guide, index) => {
              const Icon = guide.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Icon className="h-12 w-12 text-primary mb-4" />
                    <CardTitle>{guide.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{guide.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mb-6">Frequently Asked Questions</h2>
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <BookOpen className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Need More Information?</h3>
                  <p className="text-muted-foreground mb-4">
                    Our legal awareness section is regularly updated with new guides, FAQs, and resources. 
                    You can also connect with legal professionals through our directory for personalized guidance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default LegalAwareness;
