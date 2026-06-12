import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Pill, Trash2 } from 'lucide-react';
import { useMedications, useAddMedication, useDeleteRecord } from '@/hooks/useMedicalRecords';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props {
  patientId?: string;
  readOnly?: boolean;
}

export default function MedicationsList({ patientId, readOnly = false }: Props) {
  const { data: medications, isLoading } = useMedications(patientId);
  const addMedication = useAddMedication();
  const deleteRecord = useDeleteRecord();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    purpose: '',
    prescribing_doctor: '',
    is_active: true,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMedication.mutateAsync({
        medication_name: formData.medication_name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        purpose: formData.purpose || null,
        prescribing_doctor: formData.prescribing_doctor || null,
        is_active: formData.is_active,
        notes: formData.notes || null,
      });
      toast.success('Medication added successfully');
      setOpen(false);
      setFormData({
        medication_name: '',
        dosage: '',
        frequency: '',
        start_date: '',
        end_date: '',
        purpose: '',
        prescribing_doctor: '',
        is_active: true,
        notes: '',
      });
    } catch (error) {
      toast.error('Failed to add medication');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord.mutateAsync({ table: 'medications', id });
      toast.success('Medication deleted');
    } catch (error) {
      toast.error('Failed to delete medication');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading medications...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medications
          </CardTitle>
          <CardDescription>Current and past medications</CardDescription>
        </div>
        {!readOnly && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Medication
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Medication</DialogTitle>
                <DialogDescription>Add a medication to your records</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="medication_name">Medication Name *</Label>
                  <Input
                    id="medication_name"
                    value={formData.medication_name}
                    onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                    placeholder="e.g., Metformin"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosage *</Label>
                    <Input
                      id="dosage"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      placeholder="e.g., 500mg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency *</Label>
                    <Input
                      id="frequency"
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      placeholder="e.g., Twice daily"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="e.g., Blood sugar control"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prescribing_doctor">Prescribing Doctor</Label>
                  <Input
                    id="prescribing_doctor"
                    value={formData.prescribing_doctor}
                    onChange={(e) => setFormData({ ...formData, prescribing_doctor: e.target.value })}
                    placeholder="Doctor's name"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Currently taking this medication</Label>
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
                <Button type="submit" className="w-full" disabled={addMedication.isPending}>
                  {addMedication.isPending ? 'Adding...' : 'Add Medication'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {!medications?.length ? (
          <p className="text-center text-muted-foreground py-8">No medications recorded</p>
        ) : (
          <div className="space-y-3">
            {medications.map((med) => (
              <div key={med.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{med.medication_name}</span>
                    <Badge variant={med.is_active ? 'default' : 'secondary'}>
                      {med.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {med.dosage} • {med.frequency}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Started: {format(new Date(med.start_date), 'MMM d, yyyy')}
                    {med.end_date && ` • Ended: ${format(new Date(med.end_date), 'MMM d, yyyy')}`}
                  </p>
                  {med.purpose && (
                    <p className="text-sm text-muted-foreground">Purpose: {med.purpose}</p>
                  )}
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(med.id)}
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
