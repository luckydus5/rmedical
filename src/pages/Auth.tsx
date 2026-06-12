import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Shield, Users, Globe, Stethoscope, Activity, Heart, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import sanoviaLogo from '@/assets/sanovia-logo.png';
import MFAChallenge from '@/components/auth/MFAChallenge';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user && !loading && !mfaRequired) {
      // Before navigating, check if MFA challenge is needed
      supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
        if (data && data.currentLevel !== data.nextLevel && data.nextLevel === 'aal2') {
          setMfaRequired(true);
        } else {
          navigate('/');
        }
      });
    }
  }, [user, loading, navigate, mfaRequired]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);
    
    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      // Check MFA before redirecting
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.currentLevel !== aal.nextLevel && aal.nextLevel === 'aal2') {
        setMfaRequired(true);
        return;
      }
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      nameSchema.parse(signupName);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }
    
    if (signupPassword !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setIsSubmitting(false);
    
    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'This email is already registered. Please login instead.';
      }
      toast({
        title: 'Signup Failed',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account Created!',
        description: 'Please check your email to verify your account.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-pulse-soft">
            <img src={sanoviaLogo} alt="Loading" className="h-12 w-12" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (mfaRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <MFAChallenge
          onVerified={() => {
            setMfaRequired(false);
            navigate('/');
          }}
          onCancel={() => {
            setMfaRequired(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex min-h-screen flex-col lg:flex-row">
        {/* Left side - Branding */}
        <div className="relative flex flex-1 flex-col justify-center p-8 lg:p-16 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 gradient-hero opacity-50" />
          <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
          
          <div className="relative z-10">
            <div className="mb-10">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-lg">
                  <img src={sanoviaLogo} alt="Sanovia" className="h-14 w-14" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground">Sanovia</h1>
                  <p className="text-muted-foreground font-medium">The Path to Connected Healthcare</p>
                </div>
              </div>
              <p className="text-lg text-muted-foreground max-w-md">
                A unified platform connecting patients, healthcare facilities, and medical records across Rwanda.
              </p>
            </div>
            
            <div className="space-y-5">
              <FeatureItem
                icon={<Shield className="h-5 w-5" />}
                title="Patient-Owned Data"
                description="You control who sees your medical records. Privacy by design with secure sharing."
              />
              
              <FeatureItem
                icon={<Stethoscope className="h-5 w-5" />}
                title="Cross-Facility Access"
                description="Healthcare providers can access your unified records with your permission."
              />
              
              <FeatureItem
                icon={<Activity className="h-5 w-5" />}
                title="Real-time Health Tracking"
                description="Monitor conditions, medications, and lab results all in one place."
              />
              
              <FeatureItem
                icon={<Users className="h-5 w-5" />}
                title="Seamless Sharing"
                description="Share records with doctors via QR code. No paperwork needed."
              />
            </div>

            {/* Stats */}
            <div className="mt-12 flex gap-8">
              <div>
                <p className="text-3xl font-bold text-primary">100+</p>
                <p className="text-sm text-muted-foreground">Healthcare Facilities</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">50K+</p>
                <p className="text-sm text-muted-foreground">Patients Connected</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">24/7</p>
                <p className="text-sm text-muted-foreground">Access Anywhere</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Auth forms */}
        <div className="flex flex-1 items-center justify-center p-8 lg:p-12">
          <Card className="w-full max-w-md border-border/50 shadow-xl bg-card">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Get Started</CardTitle>
              <CardDescription>
                Sign in to access your medical records or create a new account
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="font-medium">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="font-medium">Create Account</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4 animate-fade-in">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 font-medium" disabled={isSubmitting}>
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                      {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4 animate-fade-in">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11 font-medium" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating account...' : 'Create Account'}
                      {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      By signing up, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/50 transition-all hover:bg-card hover:shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}