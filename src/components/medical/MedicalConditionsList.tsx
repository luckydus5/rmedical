import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Stethoscope, Trash2 } from 'lucide-react';
import { useMedicalConditions, useAddMedicalCondition, useDeleteRecord } from '@/hooks/useMedicalRecords';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props {
  patientId?: string;
  readOnly?: boolean;
}

export default function MedicalConditionsList({ patientId, readOnly = false }: Props) {
  const { data: conditions, isLoading } = useMedicalConditions(patientId);
  const addCondition = useAddMedicalCondition();
  const deleteRecord = useDeleteRecord();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    condition_name: '',
    status: 'active',
    severity: '',
    diagnosis_date: '',
    diagnosed_by: '',
    icd_code: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCondition.mutateAsync({
        condition_name: formData.condition_name,
        status: formData.status,
        severity: formData.severity || null,
        diagnosis_date: formData.diagnosis_date || null,
        diagnosed_by: formData.diagnosed_by || null,
        icd_code: formData.icd_code || null,
        notes: formData.notes || null,
      });
      toast.success('Condition added successfully');
      setOpen(false);
      setFormData({
        condition_name: '',
        status: 'active',
        severity: '',
        diagnosis_date: '',
        diagnosed_by: '',
        icd_code: '',
        notes: '',
      });
    } catch (error) {
      toast.error('Failed to add condition');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord.mutateAsync({ table: 'medical_conditions', id });
      toast.success('Condition deleted');
    } catch (error) {
      toast.error('Failed to delete condition');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'managed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading conditions...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Medical Conditions
          </CardTitle>
          <CardDescription>Diagnosed health conditions and their status</CardDescription>
        </div>
        {!readOnly && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Condition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Medical Condition</DialogTitle>
                <DialogDescription>Add a new diagnosed condition to your records</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="condition_name">Condition Name *</Label>
                  <Input
                    id="condition_name"
                    value={formData.condition_name}
                    onChange={(e) => setFormData({ ...formData, condition_name: e.target.value })}
                    placeholder="e.g., Type 2 Diabetes"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="managed">Managed</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosis_date">Diagnosis Date</Label>
                  <Input
                    id="diagnosis_date"
                    type="date"
                    value={formData.diagnosis_date}
                    onChange={(e) => setFormData({ ...formData, diagnosis_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosed_by">Diagnosed By</Label>
                  <Input
                    id="diagnosed_by"
                    value={formData.diagnosed_by}
                    onChange={(e) => setFormData({ ...formData, diagnosed_by: e.target.value })}
                    placeholder="Doctor's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icd_code">ICD Code</Label>
                  <Input
                    id="icd_code"
                    value={formData.icd_code}
                    onChange={(e) => setFormData({ ...formData, icd_code: e.target.value })}
                    placeholder="e.g., E11.9"
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
                <Button type="submit" className="w-full" disabled={addCondition.isPending}>
                  {addCondition.isPending ? 'Adding...' : 'Add Condition'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {!conditions?.length ? (
          <p className="text-center text-muted-foreground py-8">No medical conditions recorded</p>
        ) : (
          <div className="space-y-3">
            {conditions.map((condition) => (
              <div key={condition.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{condition.condition_name}</span>
                    <Badge variant="outline" className={getStatusColor(condition.status)}>
                      {condition.status}
                    </Badge>
                    {condition.severity && (
                      <Badge variant="secondary">{condition.severity}</Badge>
                    )}
                  </div>
                  {condition.diagnosis_date && (
                    <p className="text-sm text-muted-foreground">
                      Diagnosed: {format(new Date(condition.diagnosis_date), 'MMM d, yyyy')}
                      {condition.diagnosed_by && ` by ${condition.diagnosed_by}`}
                    </p>
                  )}
                  {condition.notes && (
                    <p className="text-sm text-muted-foreground">{condition.notes}</p>
                  )}
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(condition.id)}
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
