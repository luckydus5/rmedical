import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Stethoscope, 
  Pill, 
  AlertTriangle, 
  FlaskConical, 
  Calendar,
  Search
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFacility, useSearchPatientByNationalId, useFacilityPatients } from '@/hooks/useFacilities';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { logAuditEvent } from '@/lib/audit';

interface Props {
  facilityId: string;
}

export default function AddPatientRecord({ facilityId }: Props) {
  const { user } = useAuth();
  const { data: facility } = useFacility(facilityId);
  const { data: facilityPatients } = useFacilityPatients(facilityId);
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchNationalId, setSearchNationalId] = useState('');
  const [activeTab, setActiveTab] = useState('condition');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchPatient = useSearchPatientByNationalId();

  // Form states
  const [conditionForm, setConditionForm] = useState({
    condition_name: '',
    status: 'active',
    severity: '',
    diagnosis_date: new Date().toISOString().split('T')[0],
    diagnosed_by: '',
    icd_code: '',
    notes: '',
  });

  const [medicationForm, setMedicationForm] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    prescribing_doctor: '',
    purpose: '',
    notes: '',
  });

  const [allergyForm, setAllergyForm] = useState({
    allergen: '',
    reaction: '',
    severity: 'moderate',
    first_observed: '',
    notes: '',
  });

  const [labResultForm, setLabResultForm] = useState({
    test_name: '',
    result_value: '',
    unit: '',
    reference_range: '',
    test_date: new Date().toISOString().split('T')[0],
    lab_name: facility?.name || '',
    ordered_by: '',
    status: 'completed',
    notes: '',
  });

  const [visitForm, setVisitForm] = useState({
    visit_date: new Date().toISOString().split('T')[0] + 'T' + new Date().toTimeString().substring(0, 5),
    visit_type: 'checkup',
    chief_complaint: '',
    diagnosis: '',
    treatment: '',
    provider_name: '',
    follow_up_date: '',
    notes: '',
  });

  const handleSearchPatient = async () => {
    if (!searchNationalId.trim()) return;
    
    try {
      const result = await searchPatient.mutateAsync(searchNationalId);
      setSelectedPatientId(result.user_id);
      toast.success(`Found patient: ${result.full_name}`);
    } catch {
      toast.error('Patient not found');
    }
  };

  const getSelectedPatientName = () => {
    if (!selectedPatientId) return null;
    const patient = facilityPatients?.find(p => p.patient_id === selectedPatientId);
    return (patient?.profiles as any)?.full_name || 'Selected Patient';
  };

  const handleSubmitCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Please select a patient first');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('medical_conditions').insert({
        patient_id: selectedPatientId,
        condition_name: conditionForm.condition_name,
        status: conditionForm.status,
        severity: conditionForm.severity || null,
        diagnosis_date: conditionForm.diagnosis_date || null,
        diagnosed_by: conditionForm.diagnosed_by || null,
        icd_code: conditionForm.icd_code || null,
        notes: conditionForm.notes || null,
      });
      if (error) throw error;
      void logAuditEvent({ action: 'record.create', resourceType: 'medical_condition', targetPatientId: selectedPatientId, facilityId, metadata: { condition: conditionForm.condition_name } });
      toast.success('Condition added successfully');
      setConditionForm({
        condition_name: '',
        status: 'active',
        severity: '',
        diagnosis_date: new Date().toISOString().split('T')[0],
        diagnosed_by: '',
        icd_code: '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['medical_conditions', selectedPatientId] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add condition');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Please select a patient first');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('medications').insert({
        patient_id: selectedPatientId,
        medication_name: medicationForm.medication_name,
        dosage: medicationForm.dosage,
        frequency: medicationForm.frequency,
        start_date: medicationForm.start_date,
        end_date: medicationForm.end_date || null,
        prescribing_doctor: medicationForm.prescribing_doctor || null,
        purpose: medicationForm.purpose || null,
        notes: medicationForm.notes || null,
        is_active: true,
      });
      if (error) throw error;
      void logAuditEvent({ action: 'medication.prescribe', resourceType: 'medication', targetPatientId: selectedPatientId, facilityId, metadata: { medication: medicationForm.medication_name, dosage: medicationForm.dosage } });
      toast.success('Medication added successfully');
      setMedicationForm({
        medication_name: '',
        dosage: '',
        frequency: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        prescribing_doctor: '',
        purpose: '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['medications', selectedPatientId] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Please select a patient first');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('allergies').insert({
        patient_id: selectedPatientId,
        allergen: allergyForm.allergen,
        reaction: allergyForm.reaction,
        severity: allergyForm.severity,
        first_observed: allergyForm.first_observed || null,
        notes: allergyForm.notes || null,
      });
      if (error) throw error;
      void logAuditEvent({ action: 'record.create', resourceType: 'allergy', targetPatientId: selectedPatientId, facilityId, metadata: { allergen: allergyForm.allergen, severity: allergyForm.severity } });
      toast.success('Allergy added successfully');
      setAllergyForm({
        allergen: '',
        reaction: '',
        severity: 'moderate',
        first_observed: '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['allergies', selectedPatientId] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add allergy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitLabResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Please select a patient first');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('lab_results').insert({
        patient_id: selectedPatientId,
        facility_id: facilityId,
        test_name: labResultForm.test_name,
        result_value: labResultForm.result_value,
        unit: labResultForm.unit || null,
        reference_range: labResultForm.reference_range || null,
        test_date: labResultForm.test_date,
        lab_name: labResultForm.lab_name || null,
        ordered_by: labResultForm.ordered_by || null,
        status: labResultForm.status || null,
        notes: labResultForm.notes || null,
      });
      if (error) throw error;
      void logAuditEvent({ action: 'record.create', resourceType: 'lab_result', targetPatientId: selectedPatientId, facilityId, metadata: { test: labResultForm.test_name } });
      toast.success('Lab result added successfully');
      setLabResultForm({
        test_name: '',
        result_value: '',
        unit: '',
        reference_range: '',
        test_date: new Date().toISOString().split('T')[0],
        lab_name: facility?.name || '',
        ordered_by: '',
        status: 'completed',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['lab_results', selectedPatientId] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add lab result');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Please select a patient first');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('visit_history').insert({
        patient_id: selectedPatientId,
        facility_id: facilityId,
        facility_name: facility?.name || 'Unknown Facility',
        visit_date: visitForm.visit_date,
        visit_type: visitForm.visit_type,
        chief_complaint: visitForm.chief_complaint || null,
        diagnosis: visitForm.diagnosis || null,
        treatment: visitForm.treatment || null,
        provider_id: user?.id,
        provider_name: visitForm.provider_name || null,
        follow_up_date: visitForm.follow_up_date || null,
        notes: visitForm.notes || null,
      });
      if (error) throw error;
      void logAuditEvent({ action: 'record.create', resourceType: 'visit', targetPatientId: selectedPatientId, facilityId, metadata: { visit_type: visitForm.visit_type } });
      toast.success('Visit recorded successfully');
      setVisitForm({
        visit_date: new Date().toISOString().split('T')[0] + 'T' + new Date().toTimeString().substring(0, 5),
        visit_type: 'checkup',
        chief_complaint: '',
        diagnosis: '',
        treatment: '',
        provider_name: '',
        follow_up_date: '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['visit_history', selectedPatientId] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to record visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Patient Record
        </CardTitle>
        <CardDescription>
          Add new medical records for patients at {facility?.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Patient Selection */}
        <div className="p-4 rounded-lg border bg-muted/30">
          <Label className="mb-2 block">Select Patient</Label>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by National ID..."
                value={searchNationalId}
                onChange={(e) => setSearchNationalId(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleSearchPatient()}
              />
            </div>
            <Button type="button" onClick={handleSearchPatient} disabled={searchPatient.isPending}>
              {searchPatient.isPending ? 'Searching...' : 'Search'}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground mb-2">Or select from registered patients:</div>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a patient..." />
            </SelectTrigger>
            <SelectContent>
              {facilityPatients?.map((patient) => (
                <SelectItem key={patient.patient_id} value={patient.patient_id}>
                  {(patient.profiles as any)?.full_name} - {(patient.profiles as any)?.national_id || 'No ID'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPatientId && (
            <div className="mt-2 p-2 rounded bg-primary/10 text-primary text-sm">
              Selected: <strong>{getSelectedPatientName()}</strong>
            </div>
          )}
        </div>

        {/* Record Type Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="condition" className="gap-1">
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Condition</span>
            </TabsTrigger>
            <TabsTrigger value="medication" className="gap-1">
              <Pill className="h-4 w-4" />
              <span className="hidden sm:inline">Medication</span>
            </TabsTrigger>
            <TabsTrigger value="allergy" className="gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Allergy</span>
            </TabsTrigger>
            <TabsTrigger value="lab" className="gap-1">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">Lab Result</span>
            </TabsTrigger>
            <TabsTrigger value="visit" className="gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Visit</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="condition">
            <form onSubmit={handleSubmitCondition} className="space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition Name *</Label>
                  <Input
                    value={conditionForm.condition_name}
                    onChange={(e) => setConditionForm({ ...conditionForm, condition_name: e.target.value })}
                    placeholder="e.g., Hypertension"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>ICD Code</Label>
                  <Input
                    value={conditionForm.icd_code}
                    onChange={(e) => setConditionForm({ ...conditionForm, icd_code: e.target.value })}
                    placeholder="e.g., I10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={conditionForm.status} onValueChange={(v) => setConditionForm({ ...conditionForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="managed">Managed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={conditionForm.severity} onValueChange={(v) => setConditionForm({ ...conditionForm, severity: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Diagnosis Date</Label>
                  <Input
                    type="date"
                    value={conditionForm.diagnosis_date}
                    onChange={(e) => setConditionForm({ ...conditionForm, diagnosis_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Diagnosed By</Label>
                <Input
                  value={conditionForm.diagnosed_by}
                  onChange={(e) => setConditionForm({ ...conditionForm, diagnosed_by: e.target.value })}
                  placeholder="Doctor's name"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={conditionForm.notes}
                  onChange={(e) => setConditionForm({ ...conditionForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <Button type="submit" disabled={isSubmitting || !selectedPatientId}>
                {isSubmitting ? 'Adding...' : 'Add Condition'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="medication">
            <form onSubmit={handleSubmitMedication} className="space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medication Name *</Label>
                  <Input
                    value={medicationForm.medication_name}
                    onChange={(e) => setMedicationForm({ ...medicationForm, medication_name: e.target.value })}
                    placeholder="e.g., Metformin"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dosage *</Label>
                  <Input
                    value={medicationForm.dosage}
                    onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                    placeholder="e.g., 500mg"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Frequency *</Label>
                  <Input
                    value={medicationForm.frequency}
                    onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
                    placeholder="e.g., Twice daily"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={medicationForm.start_date}
                    onChange={(e) => setMedicationForm({ ...medicationForm, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={medicationForm.end_date}
                    onChange={(e) => setMedicationForm({ ...medicationForm, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prescribing Doctor</Label>
                  <Input
                    value={medicationForm.prescribing_doctor}
                    onChange={(e) => setMedicationForm({ ...medicationForm, prescribing_doctor: e.target.value })}
                    placeholder="Doctor's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Input
                    value={medicationForm.purpose}
                    onChange={(e) => setMedicationForm({ ...medicationForm, purpose: e.target.value })}
                    placeholder="e.g., Blood sugar control"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={medicationForm.notes}
                  onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <Button type="submit" disabled={isSubmitting || !selectedPatientId}>
                {isSubmitting ? 'Adding...' : 'Add Medication'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="allergy">
            <form onSubmit={handleSubmitAllergy} className="space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Allergen *</Label>
                  <Input
                    value={allergyForm.allergen}
                    onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })}
                    placeholder="e.g., Penicillin"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reaction *</Label>
                  <Input
                    value={allergyForm.reaction}
                    onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
                    placeholder="e.g., Skin rash, difficulty breathing"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={allergyForm.severity} onValueChange={(v) => setAllergyForm({ ...allergyForm, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>First Observed</Label>
                  <Input
                    type="date"
                    value={allergyForm.first_observed}
                    onChange={(e) => setAllergyForm({ ...allergyForm, first_observed: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={allergyForm.notes}
                  onChange={(e) => setAllergyForm({ ...allergyForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <Button type="submit" disabled={isSubmitting || !selectedPatientId}>
                {isSubmitting ? 'Adding...' : 'Add Allergy'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="lab">
            <form onSubmit={handleSubmitLabResult} className="space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Test Name *</Label>
                  <Input
                    value={labResultForm.test_name}
                    onChange={(e) => setLabResultForm({ ...labResultForm, test_name: e.target.value })}
                    placeholder="e.g., Complete Blood Count"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Test Date *</Label>
                  <Input
                    type="date"
                    value={labResultForm.test_date}
                    onChange={(e) => setLabResultForm({ ...labResultForm, test_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Result Value *</Label>
                  <Input
                    value={labResultForm.result_value}
                    onChange={(e) => setLabResultForm({ ...labResultForm, result_value: e.target.value })}
                    placeholder="e.g., 12.5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={labResultForm.unit}
                    onChange={(e) => setLabResultForm({ ...labResultForm, unit: e.target.value })}
                    placeholder="e.g., g/dL"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reference Range</Label>
                  <Input
                    value={labResultForm.reference_range}
                    onChange={(e) => setLabResultForm({ ...labResultForm, reference_range: e.target.value })}
                    placeholder="e.g., 12-16"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Lab Name</Label>
                  <Input
                    value={labResultForm.lab_name}
                    onChange={(e) => setLabResultForm({ ...labResultForm, lab_name: e.target.value })}
                    placeholder="Facility name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ordered By</Label>
                  <Input
                    value={labResultForm.ordered_by}
                    onChange={(e) => setLabResultForm({ ...labResultForm, ordered_by: e.target.value })}
                    placeholder="Doctor's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={labResultForm.status} onValueChange={(v) => setLabResultForm({ ...labResultForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={labResultForm.notes}
                  onChange={(e) => setLabResultForm({ ...labResultForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <Button type="submit" disabled={isSubmitting || !selectedPatientId}>
                {isSubmitting ? 'Adding...' : 'Add Lab Result'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="visit">
            <form onSubmit={handleSubmitVisit} className="space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Visit Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={visitForm.visit_date}
                    onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visit Type *</Label>
                  <Select value={visitForm.visit_type} onValueChange={(v) => setVisitForm({ ...visitForm, visit_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkup">Check-up</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="procedure">Procedure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Chief Complaint</Label>
                <Input
                  value={visitForm.chief_complaint}
                  onChange={(e) => setVisitForm({ ...visitForm, chief_complaint: e.target.value })}
                  placeholder="Main reason for visit"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Diagnosis</Label>
                  <Textarea
                    value={visitForm.diagnosis}
                    onChange={(e) => setVisitForm({ ...visitForm, diagnosis: e.target.value })}
                    placeholder="Diagnosis details"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Treatment</Label>
                  <Textarea
                    value={visitForm.treatment}
                    onChange={(e) => setVisitForm({ ...visitForm, treatment: e.target.value })}
                    placeholder="Treatment plan"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider Name</Label>
                  <Input
                    value={visitForm.provider_name}
                    onChange={(e) => setVisitForm({ ...visitForm, provider_name: e.target.value })}
                    placeholder="Doctor/Nurse name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Follow-up Date</Label>
                  <Input
                    type="date"
                    value={visitForm.follow_up_date}
                    onChange={(e) => setVisitForm({ ...visitForm, follow_up_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={visitForm.notes}
                  onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <Button type="submit" disabled={isSubmitting || !selectedPatientId}>
                {isSubmitting ? 'Recording...' : 'Record Visit'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
