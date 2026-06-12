import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Trash2, MapPin } from 'lucide-react';
import { useVisitHistory, useAddVisit, useDeleteRecord } from '@/hooks/useMedicalRecords';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props {
  patientId?: string;
  readOnly?: boolean;
}

export default function VisitHistoryList({ patientId, readOnly = false }: Props) {
  const { data: visits, isLoading } = useVisitHistory(patientId);
  const addVisit = useAddVisit();
  const deleteRecord = useDeleteRecord();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    visit_date: '',
    visit_type: 'checkup',
    facility_name: '',
    provider_name: '',
    chief_complaint: '',
    diagnosis: '',
    treatment: '',
    follow_up_date: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addVisit.mutateAsync({
        visit_date: formData.visit_date,
        visit_type: formData.visit_type,
        facility_name: formData.facility_name,
        provider_name: formData.provider_name || null,
        chief_complaint: formData.chief_complaint || null,
        diagnosis: formData.diagnosis || null,
        treatment: formData.treatment || null,
        follow_up_date: formData.follow_up_date || null,
        notes: formData.notes || null,
      });
      toast.success('Visit added successfully');
      setOpen(false);
      setFormData({
        visit_date: '',
        visit_type: 'checkup',
        facility_name: '',
        provider_name: '',
        chief_complaint: '',
        diagnosis: '',
        treatment: '',
        follow_up_date: '',
        notes: '',
      });
    } catch (error) {
      toast.error('Failed to add visit');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord.mutateAsync({ table: 'visit_history', id });
      toast.success('Visit deleted');
    } catch (error) {
      toast.error('Failed to delete visit');
    }
  };

  const getVisitTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'surgery': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'specialist': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'checkup': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading visit history...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Visit History
          </CardTitle>
          <CardDescription>Medical visits and consultations</CardDescription>
        </div>
        {!readOnly && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Visit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Visit</DialogTitle>
                <DialogDescription>Record a medical visit</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visit_date">Visit Date *</Label>
                    <Input
                      id="visit_date"
                      type="datetime-local"
                      value={formData.visit_date}
                      onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visit_type">Visit Type *</Label>
                    <Select value={formData.visit_type} onValueChange={(v) => setFormData({ ...formData, visit_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checkup">Checkup</SelectItem>
                        <SelectItem value="specialist">Specialist</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="surgery">Surgery</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facility_name">Facility Name *</Label>
                  <Input
                    id="facility_name"
                    value={formData.facility_name}
                    onChange={(e) => setFormData({ ...formData, facility_name: e.target.value })}
                    placeholder="Hospital/Clinic name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider_name">Provider Name</Label>
                  <Input
                    id="provider_name"
                    value={formData.provider_name}
                    onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                    placeholder="Doctor's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chief_complaint">Chief Complaint</Label>
                  <Input
                    id="chief_complaint"
                    value={formData.chief_complaint}
                    onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                    placeholder="Main reason for visit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <Textarea
                    id="diagnosis"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    placeholder="Medical diagnosis..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="treatment">Treatment</Label>
                  <Textarea
                    id="treatment"
                    value={formData.treatment}
                    onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                    placeholder="Treatment provided..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="follow_up_date">Follow-up Date</Label>
                  <Input
                    id="follow_up_date"
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
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
                <Button type="submit" className="w-full" disabled={addVisit.isPending}>
                  {addVisit.isPending ? 'Adding...' : 'Add Visit'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {!visits?.length ? (
          <p className="text-center text-muted-foreground py-8">No visits recorded</p>
        ) : (
          <div className="space-y-3">
            {visits.map((visit) => (
              <div key={visit.id} className="p-4 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getVisitTypeColor(visit.visit_type)}>
                      {visit.visit_type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(visit.visit_date), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(visit.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{visit.facility_name}</span>
                  {visit.provider_name && (
                    <span className="text-muted-foreground">• {visit.provider_name}</span>
                  )}
                </div>
                {visit.chief_complaint && (
                  <p className="text-sm"><strong>Complaint:</strong> {visit.chief_complaint}</p>
                )}
                {visit.diagnosis && (
                  <p className="text-sm"><strong>Diagnosis:</strong> {visit.diagnosis}</p>
                )}
                {visit.treatment && (
                  <p className="text-sm"><strong>Treatment:</strong> {visit.treatment}</p>
                )}
                {visit.follow_up_date && (
                  <p className="text-sm text-muted-foreground">
                    Follow-up: {format(new Date(visit.follow_up_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
