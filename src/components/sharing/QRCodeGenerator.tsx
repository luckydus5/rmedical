import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QrCode, Clock, Shield, Copy, Check, Trash2 } from 'lucide-react';
import { useAccessGrants, useCreateAccessGrant, useDeleteRecord } from '@/hooks/useMedicalRecords';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export default function QRCodeGenerator() {
  const { data: grants, isLoading } = useAccessGrants();
  const createGrant = useCreateAccessGrant();
  const deleteRecord = useDeleteRecord();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedGrant, setGeneratedGrant] = useState<any>(null);
  const [formData, setFormData] = useState({
    expiresInMinutes: '60',
    accessType: 'full',
  });

  const handleGenerate = async () => {
    try {
      const grant = await createGrant.mutateAsync({
        expiresInMinutes: parseInt(formData.expiresInMinutes),
        accessType: formData.accessType,
      });
      setGeneratedGrant(grant);
      toast.success('Access code generated!');
    } catch (error) {
      toast.error('Failed to generate access code');
    }
  };

  const handleCopy = async () => {
    if (generatedGrant) {
      const shareUrl = `${window.location.origin}/access/${generatedGrant.access_token}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord.mutateAsync({ table: 'access_grants', id });
      toast.success('Access grant revoked');
    } catch (error) {
      toast.error('Failed to revoke access');
    }
  };

  const activeGrants = grants?.filter(g => !isPast(new Date(g.expires_at)) && !g.is_used) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Share Records
          </CardTitle>
          <CardDescription>Generate a QR code to share your records with a healthcare provider</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setGeneratedGrant(null); }}>
          <DialogTrigger asChild>
            <Button>
              <QrCode className="mr-2 h-4 w-4" />
              Generate QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Access Code</DialogTitle>
              <DialogDescription>Create a temporary access code for a healthcare provider</DialogDescription>
            </DialogHeader>
            
            {!generatedGrant ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Access Duration</Label>
                  <Select 
                    value={formData.expiresInMinutes} 
                    onValueChange={(v) => setFormData({ ...formData, expiresInMinutes: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="1440">24 hours</SelectItem>
                      <SelectItem value="10080">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Access Type</Label>
                  <Select 
                    value={formData.accessType} 
                    onValueChange={(v) => setFormData({ ...formData, accessType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Access</SelectItem>
                      <SelectItem value="summary">Summary Only</SelectItem>
                      <SelectItem value="emergency">Emergency Info Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 inline mr-2" />
                  Access will be logged and you can revoke it at any time
                </div>
                
                <Button onClick={handleGenerate} className="w-full" disabled={createGrant.isPending}>
                  {createGrant.isPending ? 'Generating...' : 'Generate Access Code'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG 
                    value={`${window.location.origin}/access/${generatedGrant.access_token}`}
                    size={200}
                    level="H"
                  />
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Show this QR code to your healthcare provider
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    Expires: {format(new Date(generatedGrant.expires_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
                
                <Button onClick={handleCopy} variant="outline" className="w-full">
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy Share Link'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        <h4 className="font-medium mb-3">Active Access Grants</h4>
        {isLoading ? (
          <div className="animate-pulse">Loading...</div>
        ) : !activeGrants.length ? (
          <p className="text-center text-muted-foreground py-8">No active access grants</p>
        ) : (
          <div className="space-y-3">
            {activeGrants.map((grant) => (
              <div key={grant.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                      {grant.access_type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Expires {formatDistanceToNow(new Date(grant.expires_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {grant.access_token.substring(0, 8)}...
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(grant.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
