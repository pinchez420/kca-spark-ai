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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            });
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
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile unless opened */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-72 md:w-64 border-r border-border bg-card flex-shrink-0 h-full
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-8 w-8 text-primary" />
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  KCA AI
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
            
            <button 
              onClick={() => { navigate('/settings'); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
            >
              <Avatar className="h-9 w-9">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate text-foreground">{user.user_metadata?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-3">Quick Actions</h3>
              {[
                { icon: Calendar, label: "My Timetable", action: () => { navigate('/timetable'); setSidebarOpen(false); }, badge: "Today" },
                { icon: DollarSign, label: "Fee Status", action: () => { navigate('/fees'); setSidebarOpen(false); }, badge: null },
                { icon: GraduationCap, label: "Exam Schedule", action: () => { navigate('/exams'); setSidebarOpen(false); }, badge: "3" },
                { icon: Bell, label: "Announcements", action: () => { navigate('/announcements'); setSidebarOpen(false); }, badge: "5" },
                { icon: MessageSquare, label: "New Chat", action: () => { setSidebarOpen(false); }, badge: null },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/80 transition-colors text-left cursor-pointer"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 text-sm text-foreground">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-foreground">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-1">
              <button 
                onClick={() => { navigate('/settings'); setSidebarOpen(false); }}
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
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-background min-w-0">
        {/* Header */}
        <header className="h-14 md:h-16 border-b border-border flex items-center justify-between px-3 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <div>
                <h1 className="font-semibold text-sm md:text-base">AI Assistant</h1>
                <p className="text-xs text-muted-foreground hidden md:block">Always here to help</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 text-success text-xs">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="hidden md:inline">Online</span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3 md:p-6">
          <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 md:gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>

                {message.role === "user" && (
                  <Avatar className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-3 md:p-4 bg-background flex-shrink-0">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 h-10 md:h-11 bg-background border-border"
              />
              <Button 
                type="submit" 
                variant="hero" 
                size="icon" 
                className="h-10 w-10 md:h-11 md:w-11 flex-shrink-0"
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2 text-center hidden md:block">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Quick Info (Desktop only) */}
      <aside className="hidden xl:block w-72 border-l border-border bg-card p-4 flex-shrink-0 overflow-y-auto">
        <h2 className="font-semibold mb-4 text-sm">Upcoming Events</h2>
        
        <div className="space-y-3">
          <Card className="p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-0.5">BIT 4104 Lecture</p>
                <p className="text-xs text-muted-foreground">Tomorrow, 10:00 AM</p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-0.5">Fee Deadline</p>
                <p className="text-xs text-muted-foreground">5 days remaining</p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-0.5">Final Exams</p>
                <p className="text-xs text-muted-foreground">Starting in 2 weeks</p>
              </div>
            </div>
          </Card>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;

