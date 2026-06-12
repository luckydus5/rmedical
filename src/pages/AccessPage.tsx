import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, CheckCircle, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import sanoviaLogo from '@/assets/sanovia-logo.png';
export default function AccessPage() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'login_required' | 'valid' | 'invalid' | 'expired' | 'used'>('loading');
  const [grant, setGrant] = useState<any>(null);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setStatus('invalid');
        return;
      }

      const { data, error } = await supabase
        .from('access_grants')
        .select('*')
        .eq('access_token', token)
        .single();

      if (error || !data) {
        setStatus('invalid');
        return;
      }

      if (data.is_used) {
        setStatus('used');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setStatus('expired');
        return;
      }

      setGrant(data);

      if (!user) {
        setStatus('login_required');
      } else {
        setStatus('valid');
      }
    };

    if (!loading) {
      checkToken();
    }
  }, [token, user, loading]);

  const handleAccess = async () => {
    if (!grant || !user) return;

    try {
      // Mark as used
      await supabase
        .from('access_grants')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          granted_to_id: user.id,
          granted_to_name: user.email,
        })
        .eq('id', grant.id);

      // Log access
      await supabase.from('access_logs').insert({
        patient_id: grant.patient_id,
        accessor_id: user.id,
        accessor_name: user.email,
        access_type: grant.access_type,
        resource_type: 'full_record',
      });

      toast.success('Access granted!');
      navigate(`/patient/${grant.patient_id}`);
    } catch (error) {
      toast.error('Failed to process access');
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="animate-pulse text-muted-foreground">Verifying access code...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-lg">
              <img src={sanoviaLogo} alt="Sanovia" className="h-12 w-12" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sanovia</CardTitle>
          <CardDescription>Patient Record Access Request</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'invalid' && (
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="font-semibold text-lg">Invalid Access Code</h3>
              <p className="text-muted-foreground">This access code is not valid. Please request a new one from the patient.</p>
              <Button onClick={() => navigate('/')} className="w-full">Go to Dashboard</Button>
            </div>
          )}

          {status === 'expired' && (
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
              <h3 className="font-semibold text-lg">Access Code Expired</h3>
              <p className="text-muted-foreground">This access code has expired. Please request a new one from the patient.</p>
              <Button onClick={() => navigate('/')} className="w-full">Go to Dashboard</Button>
            </div>
          )}

          {status === 'used' && (
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
              <h3 className="font-semibold text-lg">Access Code Already Used</h3>
              <p className="text-muted-foreground">This access code has already been used. Please request a new one from the patient.</p>
              <Button onClick={() => navigate('/')} className="w-full">Go to Dashboard</Button>
            </div>
          )}

          {status === 'login_required' && (
            <div className="text-center space-y-4">
              <LogIn className="h-12 w-12 text-primary mx-auto" />
              <h3 className="font-semibold text-lg">Login Required</h3>
              <p className="text-muted-foreground">You need to be logged in as a healthcare provider to access patient records.</p>
              <Button onClick={() => navigate('/auth')} className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Login to Continue
              </Button>
            </div>
          )}

          {status === 'valid' && grant && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <h3 className="font-semibold text-lg">Valid Access Code</h3>
              <p className="text-muted-foreground">You have been granted {grant.access_type} access to view this patient's records.</p>
              
              <div className="p-4 bg-muted rounded-lg text-sm">
                <div className="flex items-center gap-2 justify-center text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  This access will be logged for security
                </div>
              </div>

              <Button onClick={handleAccess} className="w-full">
                View Patient Records
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
