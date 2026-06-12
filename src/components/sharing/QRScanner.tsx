import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Camera, Keyboard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function QRScanner() {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [inputMode, setInputMode] = useState<'scan' | 'manual'>('scan');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleAccessToken = async (token: string) => {
    try {
      // Extract token from URL if it's a full URL
      const tokenMatch = token.match(/\/access\/([a-f0-9-]+)/i);
      const accessToken = tokenMatch ? tokenMatch[1] : token;

      // Find the grant
      const { data: grant, error } = await supabase
        .from('access_grants')
        .select('*')
        .eq('access_token', accessToken)
        .single();

      if (error || !grant) {
        toast.error('Invalid or expired access code');
        return;
      }

      // Check if expired
      if (new Date(grant.expires_at) < new Date()) {
        toast.error('This access code has expired');
        return;
      }

      // Check if already used
      if (grant.is_used) {
        toast.error('This access code has already been used');
        return;
      }

      // Mark as used and record who used it
      const { error: updateError } = await supabase
        .from('access_grants')
        .update({ 
          is_used: true, 
          used_at: new Date().toISOString(),
          granted_to_id: user?.id,
          granted_to_name: user?.email
        })
        .eq('id', grant.id);

      if (updateError) {
        toast.error('Failed to process access code');
        return;
      }

      // Log the access
      await supabase.from('access_logs').insert({
        patient_id: grant.patient_id,
        accessor_id: user?.id,
        accessor_name: user?.email,
        access_type: grant.access_type,
        resource_type: 'full_record',
      });

      toast.success('Access granted!');
      setOpen(false);
      navigate(`/patient/${grant.patient_id}`);
    } catch (error) {
      toast.error('Failed to process access code');
    }
  };

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop();
          setScanning(false);
          handleAccessToken(decodedText);
        },
        () => {}
      );
      
      setScanning(true);
    } catch (error) {
      toast.error('Failed to start camera. Please try manual entry.');
      setInputMode('manual');
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      setScanning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleAccessToken(manualCode.trim());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Scan Patient QR
        </CardTitle>
        <CardDescription>Scan a patient's QR code to access their shared records</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) stopScanning(); }}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Open Scanner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Scan Access Code</DialogTitle>
              <DialogDescription>Scan the patient's QR code or enter the access code manually</DialogDescription>
            </DialogHeader>
            
            <div className="flex gap-2 mb-4">
              <Button 
                variant={inputMode === 'scan' ? 'default' : 'outline'} 
                onClick={() => setInputMode('scan')}
                className="flex-1"
              >
                <Camera className="mr-2 h-4 w-4" />
                Scan
              </Button>
              <Button 
                variant={inputMode === 'manual' ? 'default' : 'outline'} 
                onClick={() => { setInputMode('manual'); stopScanning(); }}
                className="flex-1"
              >
                <Keyboard className="mr-2 h-4 w-4" />
                Manual
              </Button>
            </div>

            {inputMode === 'scan' ? (
              <div className="space-y-4">
                <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
                {!scanning ? (
                  <Button onClick={startScanning} className="w-full">
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopScanning} variant="outline" className="w-full">
                    Stop Camera
                  </Button>
                )}
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Access Code or Share Link</Label>
                  <Input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Paste the access code or link here..."
                  />
                </div>
                <Button type="submit" className="w-full">
                  Access Records
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
