import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FlaskConical, Trash2 } from 'lucide-react';
import { useLabResults, useAddLabResult, useDeleteRecord } from '@/hooks/useMedicalRecords';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props {
  patientId?: string;
  readOnly?: boolean;
}

export default function LabResultsList({ patientId, readOnly = false }: Props) {
  const { data: labResults, isLoading } = useLabResults(patientId);
  const addLabResult = useAddLabResult();
  const deleteRecord = useDeleteRecord();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    test_name: '',
    test_date: '',
    result_value: '',
    unit: '',
    reference_range: '',
    status: 'normal',
    lab_name: '',
    ordered_by: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addLabResult.mutateAsync({
        test_name: formData.test_name,
        test_date: formData.test_date,
        result_value: formData.result_value,
        unit: formData.unit || null,
        reference_range: formData.reference_range || null,
        status: formData.status || null,
        lab_name: formData.lab_name || null,
        ordered_by: formData.ordered_by || null,
        notes: formData.notes || null,
      });
      toast.success('Lab result added successfully');
      setOpen(false);
      setFormData({
        test_name: '',
        test_date: '',
        result_value: '',
        unit: '',
        reference_range: '',
        status: 'normal',
        lab_name: '',
        ordered_by: '',
        notes: '',
      });
    } catch (error) {
      toast.error('Failed to add lab result');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord.mutateAsync({ table: 'lab_results', id });
      toast.success('Lab result deleted');
    } catch (error) {
      toast.error('Failed to delete lab result');
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'normal': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'abnormal': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'critical': return 'bg-red-600/10 text-red-600 border-red-600/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading lab results...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Lab Results
          </CardTitle>
          <CardDescription>Blood tests and laboratory findings</CardDescription>
        </div>
        {!readOnly && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Result
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Lab Result</DialogTitle>
                <DialogDescription>Record a new lab test result</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test_name">Test Name *</Label>
                  <Input
                    id="test_name"
                    value={formData.test_name}
                    onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                    placeholder="e.g., Complete Blood Count"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test_date">Test Date *</Label>
                  <Input
                    id="test_date"
                    type="date"
                    value={formData.test_date}
                    onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="result_value">Result *</Label>
                    <Input
                      id="result_value"
                      value={formData.result_value}
                      onChange={(e) => setFormData({ ...formData, result_value: e.target.value })}
                      placeholder="e.g., 120"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g., mg/dL"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference_range">Reference Range</Label>
                  <Input
                    id="reference_range"
                    value={formData.reference_range}
                    onChange={(e) => setFormData({ ...formData, reference_range: e.target.value })}
                    placeholder="e.g., 70-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="abnormal">Abnormal</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lab_name">Lab Name</Label>
                  <Input
                    id="lab_name"
                    value={formData.lab_name}
                    onChange={(e) => setFormData({ ...formData, lab_name: e.target.value })}
                    placeholder="Laboratory name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ordered_by">Ordered By</Label>
                  <Input
                    id="ordered_by"
                    value={formData.ordered_by}
                    onChange={(e) => setFormData({ ...formData, ordered_by: e.target.value })}
                    placeholder="Doctor's name"
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
                <Button type="submit" className="w-full" disabled={addLabResult.isPending}>
                  {addLabResult.isPending ? 'Adding...' : 'Add Lab Result'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {!labResults?.length ? (
          <p className="text-center text-muted-foreground py-8">No lab results recorded</p>
        ) : (
          <div className="space-y-3">
            {labResults.map((result) => (
              <div key={result.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.test_name}</span>
                    {result.status && (
                      <Badge variant="outline" className={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-mono">
                    {result.result_value} {result.unit}
                    {result.reference_range && (
                      <span className="text-muted-foreground ml-2">
                        (ref: {result.reference_range})
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(result.test_date), 'MMM d, yyyy')}
                    {result.lab_name && ` • ${result.lab_name}`}
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(result.id)}
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
