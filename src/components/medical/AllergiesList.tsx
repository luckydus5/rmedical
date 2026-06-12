import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertTriangle, Trash2 } from 'lucide-react';
import { useAllergies, useAddAllergy, useDeleteRecord } from '@/hooks/useMedicalRecords';
import { toast } from 'sonner';

interface Props {
  patientId?: string;
  readOnly?: boolean;
}

export default function AllergiesList({ patientId, readOnly = false }: Props) {
  const { data: allergies, isLoading } = useAllergies(patientId);
  const addAllergy = useAddAllergy();
  const deleteRecord = useDeleteRecord();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    allergen: '',
    reaction: '',
    severity: 'moderate',
    first_observed: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAllergy.mutateAsync({
        allergen: formData.allergen,
        reaction: formData.reaction,
        severity: formData.severity,
        first_observed: formData.first_observed || null,
        notes: formData.notes || null,
      });
      toast.success('Allergy added successfully');
      setOpen(false);
      setFormData({
        allergen: '',
        reaction: '',
        severity: 'moderate',
        first_observed: '',
        notes: '',
      });
    } catch (error) {
      toast.error('Failed to add allergy');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord.mutateAsync({ table: 'allergies', id });
      toast.success('Allergy deleted');
    } catch (error) {
      toast.error('Failed to delete allergy');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'moderate': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'severe': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading allergies...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Allergies
          </CardTitle>
          <CardDescription>Known allergies and reactions</CardDescription>
        </div>
        {!readOnly && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Allergy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Allergy</DialogTitle>
                <DialogDescription>Record a new allergy</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="allergen">Allergen *</Label>
                  <Input
                    id="allergen"
                    value={formData.allergen}
                    onChange={(e) => setFormData({ ...formData, allergen: e.target.value })}
                    placeholder="e.g., Penicillin, Peanuts"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reaction">Reaction *</Label>
                  <Input
                    id="reaction"
                    value={formData.reaction}
                    onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
                    placeholder="e.g., Hives, Swelling, Anaphylaxis"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first_observed">First Observed</Label>
                  <Input
                    id="first_observed"
                    type="date"
                    value={formData.first_observed}
                    onChange={(e) => setFormData({ ...formData, first_observed: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addAllergy.isPending}>
                  {addAllergy.isPending ? 'Adding...' : 'Add Allergy'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {!allergies?.length ? (
          <p className="text-center text-muted-foreground py-8">No allergies recorded</p>
        ) : (
          <div className="space-y-3">
            {allergies.map((allergy) => (
              <div key={allergy.id} className="flex items-center justify-between p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{allergy.allergen}</span>
                    <Badge variant="outline" className={getSeverityColor(allergy.severity)}>
                      {allergy.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reaction: {allergy.reaction}
                  </p>
                  {allergy.notes && (
                    <p className="text-sm text-muted-foreground">{allergy.notes}</p>
                  )}
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(allergy.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
