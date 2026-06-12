import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Syringe, 
  CalendarCheck, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Plus,
  Bell
} from 'lucide-react';
import { format, differenceInDays, addDays, isPast, isFuture } from 'date-fns';

// WHO Recommended Vaccines for Africa
const RECOMMENDED_VACCINES = [
  { 
    id: 'bcg', 
    name: 'BCG (Tuberculosis)', 
    schedule: 'At birth',
    ageMonths: 0,
    doses: 1 
  },
  { 
    id: 'opv', 
    name: 'Oral Polio Vaccine', 
    schedule: 'Birth, 6w, 10w, 14w',
    ageMonths: 0,
    doses: 4 
  },
  { 
    id: 'penta', 
    name: 'Pentavalent (DTP-HepB-Hib)', 
    schedule: '6w, 10w, 14w',
    ageMonths: 1.5,
    doses: 3 
  },
  { 
    id: 'pcv', 
    name: 'Pneumococcal (PCV)', 
    schedule: '6w, 10w, 14w',
    ageMonths: 1.5,
    doses: 3 
  },
  { 
    id: 'rota', 
    name: 'Rotavirus', 
    schedule: '6w, 10w',
    ageMonths: 1.5,
    doses: 2 
  },
  { 
    id: 'measles', 
    name: 'Measles-Rubella', 
    schedule: '9m, 15m',
    ageMonths: 9,
    doses: 2 
  },
  { 
    id: 'yellowfever', 
    name: 'Yellow Fever', 
    schedule: '9 months',
    ageMonths: 9,
    doses: 1 
  },
  { 
    id: 'vitaminA', 
    name: 'Vitamin A', 
    schedule: '6m, then every 6m until 5y',
    ageMonths: 6,
    doses: 10 
  },
  { 
    id: 'hpv', 
    name: 'HPV (Girls)', 
    schedule: '9-14 years',
    ageMonths: 108,
    doses: 2 
  },
  { 
    id: 'covid19', 
    name: 'COVID-19', 
    schedule: '12+ years',
    ageMonths: 144,
    doses: 2 
  },
  { 
    id: 'tetanus', 
    name: 'Tetanus (Td)', 
    schedule: 'Adolescents, Adults, Pregnant',
    ageMonths: 180,
    doses: 5 
  }
];

interface Vaccination {
  id: string;
  vaccineId: string;
  vaccineName: string;
  doseNumber: number;
  totalDoses: number;
  dateAdministered: Date;
  nextDoseDate?: Date;
  batchNumber?: string;
  facility?: string;
  administeredBy?: string;
}

interface VaccinationTrackerProps {
  patientId?: string;
  readOnly?: boolean;
  vaccinations?: any[];
  onAddVaccination?: (vaccination: any) => void;
}

export default function VaccinationTracker({ 
  patientId,
  readOnly = false,
  vaccinations = [],
  onAddVaccination
}: VaccinationTrackerProps) {
  const { t } = useTranslation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVaccine, setNewVaccine] = useState({
    vaccineId: '',
    doseNumber: 1,
    dateAdministered: format(new Date(), 'yyyy-MM-dd'),
    batchNumber: '',
    facility: '',
    nextDoseDate: ''
  });

  // Group vaccinations by vaccine type
  const vaccinationsByType = vaccinations.reduce((acc: Record<string, any[]>, vax: any) => {
    const key = vax.vaccine_name || vax.vaccineId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(vax);
    return acc;
  }, {});

  // Calculate upcoming and overdue vaccinations
  const upcomingVaccinations = vaccinations.filter((v: any) => 
    v.next_dose_date && isFuture(new Date(v.next_dose_date))
  );

  const overdueVaccinations = vaccinations.filter((v: any) => 
    v.next_dose_date && isPast(new Date(v.next_dose_date)) && 
    v.dose_number < v.total_doses
  );

  // Calculate overall vaccination progress
  const totalRequiredDoses = RECOMMENDED_VACCINES.reduce((sum, v) => sum + v.doses, 0);
  const completedDoses = vaccinations.length;
  const progressPercent = Math.min((completedDoses / totalRequiredDoses) * 100, 100);

  const handleAddVaccination = () => {
    const selectedVaccine = RECOMMENDED_VACCINES.find(v => v.id === newVaccine.vaccineId);
    if (selectedVaccine && onAddVaccination) {
      onAddVaccination({
        vaccine_name: selectedVaccine.name,
        dose_number: newVaccine.doseNumber,
        total_doses: selectedVaccine.doses,
        date_administered: newVaccine.dateAdministered,
        batch_number: newVaccine.batchNumber,
        facility: newVaccine.facility,
        next_dose_date: newVaccine.nextDoseDate || null
      });
      setShowAddDialog(false);
      setNewVaccine({
        vaccineId: '',
        doseNumber: 1,
        dateAdministered: format(new Date(), 'yyyy-MM-dd'),
        batchNumber: '',
        facility: '',
        nextDoseDate: ''
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100">
                <Syringe className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle>{t('records.vaccinations')}</CardTitle>
                <CardDescription>Immunization records and upcoming schedules</CardDescription>
              </div>
            </div>
            {!readOnly && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Vaccination
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Vaccination</DialogTitle>
                    <DialogDescription>Add a new vaccination record for this patient</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Vaccine</Label>
                      <Select 
                        value={newVaccine.vaccineId}
                        onValueChange={(v) => setNewVaccine({ ...newVaccine, vaccineId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vaccine" />
                        </SelectTrigger>
                        <SelectContent>
                          {RECOMMENDED_VACCINES.map((vaccine) => (
                            <SelectItem key={vaccine.id} value={vaccine.id}>
                              {vaccine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Dose Number</Label>
                        <Input 
                          type="number" 
                          min="1"
                          value={newVaccine.doseNumber}
                          onChange={(e) => setNewVaccine({ ...newVaccine, doseNumber: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date Administered</Label>
                        <Input 
                          type="date"
                          value={newVaccine.dateAdministered}
                          onChange={(e) => setNewVaccine({ ...newVaccine, dateAdministered: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Batch Number</Label>
                      <Input 
                        placeholder="e.g., ABC123456"
                        value={newVaccine.batchNumber}
                        onChange={(e) => setNewVaccine({ ...newVaccine, batchNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Facility</Label>
                      <Input 
                        placeholder="Health center name"
                        value={newVaccine.facility}
                        onChange={(e) => setNewVaccine({ ...newVaccine, facility: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Next Dose Date (if applicable)</Label>
                      <Input 
                        type="date"
                        value={newVaccine.nextDoseDate}
                        onChange={(e) => setNewVaccine({ ...newVaccine, nextDoseDate: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddVaccination} className="w-full">
                      Record Vaccination
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Overview */}
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Immunization Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedDoses} doses recorded
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>

          {/* Alerts */}
          {overdueVaccinations.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Overdue Vaccinations</p>
                <p className="text-sm text-red-600">
                  {overdueVaccinations.length} vaccination(s) are past their scheduled date
                </p>
              </div>
            </div>
          )}

          {upcomingVaccinations.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Upcoming Vaccinations</p>
                <p className="text-sm text-blue-600">
                  {upcomingVaccinations.length} vaccination(s) scheduled
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vaccination Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">WHO Recommended Schedule</CardTitle>
          <CardDescription>Standard immunization schedule for Rwanda/Africa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {RECOMMENDED_VACCINES.map((vaccine) => {
              const patientVaccines = vaccinationsByType[vaccine.name] || [];
              const completedDoses = patientVaccines.length;
              const isComplete = completedDoses >= vaccine.doses;
              const hasStarted = completedDoses > 0;

              return (
                <div 
                  key={vaccine.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isComplete 
                      ? 'bg-green-50 border-green-200' 
                      : hasStarted 
                        ? 'bg-amber-50 border-amber-200' 
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isComplete ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : hasStarted ? (
                        <Clock className="h-5 w-5 text-amber-600" />
                      ) : (
                        <Syringe className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium">{vaccine.name}</p>
                        <p className="text-xs text-muted-foreground">{vaccine.schedule}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={isComplete ? 'default' : 'outline'}
                        className={
                          isComplete 
                            ? 'bg-green-100 text-green-800 border-green-300' 
                            : ''
                        }
                      >
                        {completedDoses}/{vaccine.doses} doses
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Show dose details */}
                  {patientVaccines.length > 0 && (
                    <div className="mt-2 pl-8 space-y-1">
                      {patientVaccines.map((vax: any, idx: number) => (
                        <div key={idx} className="text-xs text-muted-foreground flex justify-between">
                          <span>Dose {vax.dose_number || idx + 1}</span>
                          <span>{format(new Date(vax.date_administered || vax.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
