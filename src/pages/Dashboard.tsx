import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { supabase } from "@/integrations/supabase/client";
import {
  Bot,
  Send,
  Calendar,
  DollarSign,
  Bell,
  GraduationCap,
  Menu,
  LogOut,
  Settings,
  MessageSquare,
  Clock,
  Loader2
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { messages, isLoading, sendMessage } = useChat();
  const [inputValue, setInputValue] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load user profile avatar
  useEffect(() => {
    const loadAvatar = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        } else if (error?.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            });
          
          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
        }
      }
    };
    
    loadAvatar();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    await sendMessage(inputValue);
    setInputValue("");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const userInitials = user.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card flex-shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              KCA Connect AI
            </span>
          </div>
          
          <button 
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
          >
            <Avatar>
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
              <AvatarFallback className="bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate text-foreground">{user.user_metadata?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Actions</h3>
            
            {[
              { icon: Calendar, label: "My Timetable", action: () => navigate('/timetable'), badge: "Today" },
              { icon: DollarSign, label: "Fee Status", action: () => navigate('/fees'), badge: null },
              { icon: GraduationCap, label: "Exam Schedule", action: () => navigate('/exams'), badge: "3" },
              { icon: Bell, label: "Announcements", action: () => navigate('/announcements'), badge: "5" },
              { icon: MessageSquare, label: "New Chat", action: () => {}, badge: null },
            ].map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/80 transition-colors text-left cursor-pointer"
              >
                <item.icon className="h-5 w-5 text-muted-foreground transition-colors" />
                <span className="flex-1 text-sm text-foreground">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-foreground">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-border space-y-2">
            <button 
              onClick={() => navigate('/settings')}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/80 transition-colors text-left cursor-pointer text-foreground"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-foreground">Settings</span>
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </ScrollArea>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <div>
                <h1 className="font-semibold">AI Assistant</h1>
                <p className="text-xs text-muted-foreground">Always here to help</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="flex-shrink-0">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>

                {message.role === "user" && (
                  <Avatar className="flex-shrink-0">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4 md:p-6 bg-card">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about KCA University..."
                className="flex-1"
              />
              <Button 
                type="submit" 
                variant="hero" 
                size="icon" 
                className="flex-shrink-0"
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Quick Info */}
      <aside className="hidden lg:block w-80 border-l border-border bg-card p-6">
        <h2 className="font-semibold mb-4">Upcoming Events</h2>
        
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">BIT 4104 Lecture</p>
                <p className="text-xs text-muted-foreground">Tomorrow, 10:00 AM</p>
                <p className="text-xs text-muted-foreground mt-1">Room 203, Main Campus</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">Fee Deadline</p>
                <p className="text-xs text-muted-foreground">5 days remaining</p>
                <p className="text-xs text-muted-foreground mt-1">Balance: KES 15,000</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">Final Exams</p>
                <p className="text-xs text-muted-foreground">Starting in 2 weeks</p>
                <p className="text-xs text-muted-foreground mt-1">3 exams scheduled</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="font-semibold mb-3 text-sm">Recent Announcements</h3>
          <div className="space-y-3">
            {[
              "Library hours extended during exam period",
              "New academic calendar released",
              "Registration deadline reminder"
            ].map((announcement, index) => (
              <div key={index} className="flex items-start gap-2">
                <Bell className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">{announcement}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
