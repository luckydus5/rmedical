import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logAuditEvent } from '@/lib/audit';

interface MFAChallengeProps {
  onVerified: () => void;
  onCancel: () => void;
}

export default function MFAChallenge({ onVerified, onCancel }: MFAChallengeProps) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        toast.error('Failed to load MFA factors');
        onCancel();
        return;
      }
      const totp = (data?.totp ?? []).find((f) => f.status === 'verified');
      if (!totp) {
        // No verified factor — nothing to challenge
        onVerified();
        return;
      }
      setFactorId(totp.id);
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (chErr || !ch) {
        toast.error(chErr?.message || 'Failed to start MFA challenge');
        onCancel();
        return;
      }
      setChallengeId(ch.id);
      setLoading(false);
    })();
  }, [onCancel, onVerified]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || !challengeId || code.length !== 6) return;
    setVerifying(true);
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });
    setVerifying(false);
    if (error) {
      toast.error(error.message || 'Invalid code');
      await logAuditEvent({ action: 'mfa.verify_failed' });
      return;
    }
    await logAuditEvent({ action: 'mfa.verify_success' });
    onVerified();
  }

  async function handleCancel() {
    await supabase.auth.signOut();
    onCancel();
  }

  return (
    <Card className="w-full max-w-md border-border/50 shadow-xl bg-card">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Two-Factor Verification</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mfa-challenge-code">Authentication Code</Label>
              <Input
                id="mfa-challenge-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="h-11 text-center text-lg tracking-widest"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={verifying || code.length !== 6}>
              {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={handleCancel}>
              Cancel & sign out
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
