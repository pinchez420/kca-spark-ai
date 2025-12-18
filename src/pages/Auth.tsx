
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Mail, Lock, User, Building2, GraduationCap, CheckCircle, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import { validateStudentEmail, validatePassword, extractStudentNumber, validateStudentNumberExists } from "@/lib/validation";


const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [campuses, setCampuses] = useState<Array<{ id: string; name: string; }>>([]);
  
  // Email validation states
  const [loginEmail, setLoginEmail] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });
  const [emailChecking, setEmailChecking] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Fetch campuses
  useEffect(() => {
    const fetchCampuses = async () => {
      const { data } = await supabase.from('campuses').select('id, name');
      if (data) setCampuses(data);
    };
    fetchCampuses();
  }, []);

  // Real-time email validation
  const handleEmailChange = async (email: string, isRegistration: boolean = false) => {
    const { isValid, error } = validateStudentEmail(email);
    
    if (isRegistration) {
      setRegisterEmail(email);
    } else {
      setLoginEmail(email);
    }
    
    setEmailValidation({ isValid, error });
    
    if (isValid && email.length > 0) {
      setEmailChecking(true);
      // Add a small delay to simulate checking
      setTimeout(() => setEmailChecking(false), 500);
    }
  };


  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validate email format
    const emailValidation = validateStudentEmail(email);
    if (!emailValidation.isValid) {
      setEmailValidation(emailValidation);
      setIsLoading(false);
      return;
    }

    const { data } = await signIn(email, password);
    
    if (data?.user) {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };


  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const role = formData.get('role') as 'student' | 'lecturer' | 'admin';
    const campusId = formData.get('campus') as string;


    // Validate email format
    const emailValidation = validateStudentEmail(email);
    if (!emailValidation.isValid) {
      setEmailValidation(emailValidation);
      setIsLoading(false);
      return;
    }

    // Validate that student number exists in database
    const studentNumber = extractStudentNumber(email);
    if (studentNumber) {
      const studentValidation = await validateStudentNumberExists(studentNumber);
      if (!studentValidation.isValid) {
        setEmailValidation(studentValidation);
        setIsLoading(false);
        return;
      }
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setIsLoading(false);
      return;
    }

    const { data } = await signUp(email, password, {
      full_name: fullName,
      role,
      campus_id: campusId,
    });

    if (data?.user) {
      // User created successfully, they can now log in
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-subtle opacity-40" />
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md relative z-10 shadow-glow">
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link to="/" className="flex items-center gap-2">
              <Bot className="h-10 w-10 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                KCA Connect AI
              </span>
            </Link>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="220000@students.kcau.ac.ke"
                      className={`pl-10 pr-10 ${!emailValidation.isValid && loginEmail ? 'border-red-500 focus:border-red-500' : ''}`}
                      required
                      value={loginEmail}
                      onChange={(e) => handleEmailChange(e.target.value, false)}
                    />
                    {loginEmail && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailChecking ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                        ) : emailValidation.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {!emailValidation.isValid && loginEmail && (
                    <p className="text-xs text-red-500 mt-1">{emailValidation.error}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Use your KCA student email: 220000@students.kcau.ac.ke</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-muted-foreground">Remember me</span>
                  </label>
                  <button type="button" className="text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-name"
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>


                <div className="space-y-2">
                  <Label htmlFor="register-email">KCA Student Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="220000@students.kcau.ac.ke"
                      className={`pl-10 pr-10 ${!emailValidation.isValid && registerEmail ? 'border-red-500 focus:border-red-500' : ''}`}
                      required
                      value={registerEmail}
                      onChange={(e) => handleEmailChange(e.target.value, true)}
                    />
                    {registerEmail && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailChecking ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                        ) : emailValidation.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {!emailValidation.isValid && registerEmail && (
                    <p className="text-xs text-red-500 mt-1">{emailValidation.error}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Format: 6-digit student number + @students.kcau.ac.ke</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-role">I am a...</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select name="role" required>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="lecturer">Lecturer</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-campus">Campus</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select name="campus" required>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select your campus" />
                      </SelectTrigger>
                      <SelectContent>
                        {campuses.map(campus => (
                          <SelectItem key={campus.id} value={campus.id}>
                            {campus.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      placeholder="Create a strong password"
                      className="pl-10"
                      minLength={8}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    At least 8 characters with uppercase, lowercase, and numbers
                  </p>
                </div>

                <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
