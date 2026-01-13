import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  ArrowLeft, 
  User, 
  Palette, 
  Bell, 
  Shield, 
  Moon, 
  Sun,
  Save,
  Camera,
  Upload,
  Loader2
} from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    // Load user profile including avatar
    const loadProfile = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (data?.avatar_url) {
            setAvatarUrl(data.avatar_url);
          } else if (error?.code === 'PGRST116') {
            // Profile doesn't exist, create it (without student_id first, then update if column exists)
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              });
            
            if (insertError) {
              console.error('Error creating profile:', insertError);
            } else {
              // Try to add student_id if the column exists
              try {
                await supabase
                  .from('profiles')
                  .update({ student_id: user.email?.split('@')[0] || '' })
                  .eq('id', user.id);
              } catch (e) {
                // Column might not exist yet, ignore
                console.log('student_id column not available yet');
              }
            }
          } else if (error) {
            console.error('Error loading profile:', error);
          }
        } catch (err) {
          console.error('Exception loading profile:', err);
        }
      }
    };

    loadProfile();
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Ensure profile exists before updating (without student_id to avoid schema cache issues)
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
          avatar_url: publicUrl,
        }, { onConflict: 'id' });

      if (upsertError) {
        throw upsertError;
      }

      setAvatarUrl(publicUrl);

      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been updated successfully",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    // Simulate save - in real app, update Supabase profile
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  const userInitials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="border-b border-border flex-shrink-0 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-bold text-base">Settings</span>
            </div>
          </div>
          <Button variant="hero" size="sm" onClick={handleSaveProfile} disabled={saving} className="text-xs">
            <Save className="h-3 w-3 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-3 py-4 md:px-4 md:py-8 max-w-4xl">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 text-xs">
              <TabsTrigger value="profile" className="gap-1">
                <User className="h-3 w-3" />
                <span className="hidden xs:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-1">
                <Palette className="h-3 w-3" />
                <span className="hidden xs:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1">
                <Bell className="h-3 w-3" />
                <span className="hidden xs:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-1">
                <Shield className="h-3 w-3" />
                <span className="hidden xs:inline">Security</span>
              </TabsTrigger>
            </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Manage your personal information and profile settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Avatar 
                      className="h-24 w-24 cursor-pointer transition-opacity hover:opacity-80"
                      onClick={handleAvatarClick}
                    >
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="Profile" />
                      ) : null}
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                      onClick={handleAvatarClick}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user?.user_metadata?.full_name || 'User'}</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Role: {user?.user_metadata?.role || 'Student'}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Profile Form */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input 
                      id="studentId" 
                      value={user?.email?.split('@')[0] || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how KCA Connect AI looks on your device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-primary/10' : 'bg-muted'}`}>
                      {darkMode ? (
                        <Moon className="h-6 w-6 text-primary" />
                      ) : (
                        <Sun className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">Dark Mode</h3>
                      <p className="text-sm text-muted-foreground">
                        {darkMode ? 'Currently in dark mode' : 'Currently in light mode'}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={darkMode} 
                    onCheckedChange={toggleTheme}
                    className="scale-125"
                  />
                </div>

                <Separator />

                {/* Theme Options */}
                <div className="grid gap-4 md:grid-cols-3">
                  <button 
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !darkMode ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setDarkMode(false);
                      document.documentElement.classList.remove("dark");
                      localStorage.setItem("theme", "light");
                    }}
                  >
                    <div className="h-20 rounded-md bg-white border shadow-sm mb-3" />
                    <p className="font-medium">Light</p>
                    <p className="text-xs text-muted-foreground">Clean and bright</p>
                  </button>

                  <button 
                    className={`p-4 rounded-lg border-2 transition-all ${
                      darkMode ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setDarkMode(true);
                      document.documentElement.classList.add("dark");
                      localStorage.setItem("theme", "dark");
                    }}
                  >
                    <div className="h-20 rounded-md bg-slate-900 border shadow-sm mb-3" />
                    <p className="font-medium">Dark</p>
                    <p className="text-xs text-muted-foreground">Easy on the eyes</p>
                  </button>

                  <div className="p-4 rounded-lg border border-border opacity-50">
                    <div className="h-20 rounded-md bg-gradient-to-r from-white to-slate-900 border shadow-sm mb-3" />
                    <p className="font-medium">System</p>
                    <p className="text-xs text-muted-foreground">Match your device</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications in the browser
                    </p>
                  </div>
                  <Switch 
                    checked={notifications} 
                    onCheckedChange={setNotifications}
                    className="scale-125"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive important updates via email
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications}
                    className="scale-125"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-medium">Notification Types</h3>
                  {[
                    { label: "Fee reminders", desc: "Get notified about fee deadlines" },
                    { label: "Exam schedules", desc: "Receive exam schedule notifications" },
                    { label: "Announcements", desc: "Stay updated with university news" },
                    { label: "Chat messages", desc: "Get notified about new messages" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch defaultChecked className="scale-110" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Last changed: Never
                      </p>
                    </div>
                    <Button variant="outline">Change Password</Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-destructive">Delete Account</h3>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;

