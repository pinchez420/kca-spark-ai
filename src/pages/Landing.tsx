import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Bot, 
  Calendar, 
  DollarSign, 
  Bell, 
  GraduationCap, 
  Clock, 
  Shield,
  Zap,
  Users,
  MessageCircle
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              KCA Connect AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button variant="hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-subtle opacity-50" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-accent-foreground mb-6">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered University Assistant</span>
            </div>
            
            <h1 className="mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Welcome to KCA Connect AI
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your intelligent companion for academic life at KCA University. Get instant answers to questions 
              about timetables, fees, exams, and more—all powered by advanced AI.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  <Bot className="mr-2 h-5 w-5" />
                  Start Chatting Now
                </Button>
              </Link>
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                <GraduationCap className="mr-2 h-5 w-5" />
                Learn More
              </Button>
            </div>
          </div>

          {/* Floating Animation */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
            </div>
            <Card className="relative max-w-3xl mx-auto p-8 shadow-glow animate-float">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">Ask KCA Connect AI</p>
                  <p className="text-foreground mb-4">"When is my next BIT 4104 lecture?"</p>
                  <div className="bg-accent/30 rounded-lg p-4">
                    <p className="text-sm text-accent-foreground">
                      Your next BIT 4104 lecture is <span className="font-semibold">tomorrow at 10:00 AM</span> in 
                      Room 203, Main Campus. Professor Kenga will be covering Advanced Database Systems.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="mb-4">Powerful Features for Every Student</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to stay organized and informed throughout your academic journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature Cards */}
            {[
              {
                icon: Calendar,
                title: "Smart Timetable Access",
                description: "Get your personalized class schedule instantly. Never miss a lecture with intelligent reminders."
              },
              {
                icon: DollarSign,
                title: "Fee Inquiries",
                description: "Check fee balances, payment deadlines, and view detailed fee structures for your program."
              },
              {
                icon: Clock,
                title: "Exam Schedules",
                description: "Access exam timetables, venue information, and preparation resources all in one place."
              },
              {
                icon: Bell,
                title: "Smart Notifications",
                description: "Receive targeted announcements and updates relevant to your campus and program."
              },
              {
                icon: MessageCircle,
                title: "Natural Conversations",
                description: "Ask questions in plain language and get accurate, context-aware responses instantly."
              },
              {
                icon: Users,
                title: "Multi-Campus Support",
                description: "Seamlessly switch between Main, Town, and Kitengela campus information."
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-smooth cursor-pointer group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-smooth">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Account",

                description: "Sign up with your 6-digit student email and select your campus"
              },
              {
                step: "02",
                title: "Ask Anything",
                description: "Type your questions in natural language—no special commands needed"
              },
              {
                step: "03",
                title: "Get Instant Answers",
                description: "Receive accurate, personalized responses powered by AI"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full gradient-hero text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-glow">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 gradient-subtle">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "3", label: "Campuses Supported" },
              { number: "24/7", label: "Availability" },
              { number: "< 3s", label: "Response Time" },
              { number: "100%", label: "Accurate Information" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Card className="p-12 gradient-card shadow-glow">
            <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="mb-4">Ready to Transform Your Academic Experience?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of KCA University students already using AI to stay organized and informed.
            </p>
            <Link to="/auth">
              <Button variant="hero" size="xl">
                <Bot className="mr-2 h-5 w-5" />
                Get Started Free
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Available for all KCA students
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-semibold">KCA Connect AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 KCA Connect AI. Built for KCA University students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
