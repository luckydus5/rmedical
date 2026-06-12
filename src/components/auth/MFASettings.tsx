import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, Loader2, Trash2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { logAuditEvent } from '@/lib/audit';

interface Factor {
  id: string;
  friendly_name?: string | null;
  factor_type: string;
  status: string;
  created_at: string;
}

export default function MFASettings() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollment, setEnrollment] = useState<{
    factorId: string;
    qr: string;
    secret: string;
    uri: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  async function loadFactors() {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      toast.error('Failed to load MFA factors');
    } else {
      setFactors((data?.all ?? []) as Factor[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadFactors();
  }, []);

  async function startEnrollment() {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Authenticator ${new Date().toLocaleDateString()}`,
    });
    setEnrolling(false);
    if (error || !data) {
      toast.error(error?.message || 'Failed to start MFA enrollment');
      return;
    }
    setEnrollment({
      factorId: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
  }

  async function verifyEnrollment() {
    if (!enrollment) return;
    if (verifyCode.length !== 6) {
      toast.error('Enter the 6-digit code from your authenticator app');
      return;
    }
    setVerifying(true);
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
      factorId: enrollment.factorId,
    });
    if (chErr || !challenge) {
      setVerifying(false);
      toast.error(chErr?.message || 'Failed to issue challenge');
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.id,
      code: verifyCode,
    });
    setVerifying(false);
    if (error) {
      toast.error(error.message || 'Invalid code, please try again');
      return;
    }
    await logAuditEvent({
      action: 'mfa.enrolled',
      resourceType: 'auth_factor',
      resourceId: enrollment.factorId,
    });
    toast.success('Two-factor authentication enabled');
    setEnrollment(null);
    setVerifyCode('');
    loadFactors();
  }

  async function unenrollFactor(factorId: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAuditEvent({
      action: 'mfa.unenrolled',
      resourceType: 'auth_factor',
      resourceId: factorId,
    });
    toast.success('Factor removed');
    loadFactors();
  }

  async function cancelEnrollment() {
    if (enrollment) {
      await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
    }
    setEnrollment(null);
    setVerifyCode('');
  }

  const verifiedFactors = factors.filter((f) => f.status === 'verified');
  const hasMFA = verifiedFactors.length > 0;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${hasMFA ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
            {hasMFA ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Two-Factor Authentication
              {hasMFA ? (
                <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Enabled</Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">Not enabled</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Protect patient data with a time-based one-time password (TOTP) from an authenticator app
              such as Google Authenticator, 1Password, or Authy.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading factors...
          </div>
        ) : (
          <>
            {verifiedFactors.length > 0 && (
              <div className="space-y-2">
                {verifiedFactors.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
                    <div className="flex items-center gap-3">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{f.friendly_name || 'Authenticator app'}</p>
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(f.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => unenrollFactor(f.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!enrollment && (
              <Button onClick={startEnrollment} disabled={enrolling}>
                {enrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {hasMFA ? 'Add another authenticator' : 'Enable two-factor authentication'}
              </Button>
            )}

            {enrollment && (
              <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
                <div>
                  <p className="text-sm font-medium mb-2">1. Scan this QR code with your authenticator app</p>
                  <div className="flex justify-center bg-white p-4 rounded-lg">
                    <img src={enrollment.qr} alt="MFA QR code" className="h-48 w-48" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Or enter this secret manually: <code className="font-mono bg-muted px-1 py-0.5 rounded">{enrollment.secret}</code>
                  </p>
                </div>
                <div>
                  <Label htmlFor="mfa-code">2. Enter the 6-digit code from your app</Label>
                  <Input
                    id="mfa-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    className="mt-1 text-center text-lg tracking-widest"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={verifyEnrollment} disabled={verifying || verifyCode.length !== 6}>
                    {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Verify & Activate
                  </Button>
                  <Button variant="outline" onClick={cancelEnrollment} disabled={verifying}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
