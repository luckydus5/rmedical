import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  Phone, 
  Heart,
  Pill,
  Droplets,
  User,
  QrCode,
  Shield,
  Clock,
  MapPin
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/hooks/useAuth';
import { useMedications, useAllergies, useMedicalConditions, useEmergencyContacts } from '@/hooks/useMedicalRecords';
import { supabase } from '@/integrations/supabase/client';

interface EmergencyData {
  patientName: string;
  bloodType?: string;
  dateOfBirth?: string;
  allergies: Array<{ allergen: string; severity: string }>;
  medications: Array<{ name: string; dosage: string }>;
  conditions: Array<{ name: string; status: string }>;
  emergencyContacts: Array<{ name: string; phone: string; relationship: string }>;
}

export default function EmergencyAccessCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: medications } = useMedications();
  const { data: allergies } = useAllergies();
  const { data: conditions } = useMedicalConditions();
  const { data: emergencyContacts } = useEmergencyContacts();
  const [profile, setProfile] = useState<any>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [emergencyQRData, setEmergencyQRData] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    setProfile(data);
  }

  useEffect(() => {
    // Generate emergency QR code data
    const emergencyData: EmergencyData = {
      patientName: profile?.full_name || 'Unknown',
      bloodType: profile?.blood_type,
      dateOfBirth: profile?.date_of_birth,
      allergies: (allergies || []).map((a: any) => ({
        allergen: a.allergen,
        severity: a.severity
      })),
      medications: (medications || [])
        .filter((m: any) => m.is_active)
        .map((m: any) => ({
          name: m.medication_name,
          dosage: m.dosage
        })),
      conditions: (conditions || []).map((c: any) => ({
        name: c.condition_name,
        status: c.status
      })),
      emergencyContacts: (emergencyContacts || []).map((c: any) => ({
        name: c.contact_name,
        phone: c.phone_number,
        relationship: c.relationship
      }))
    };

    // Encode as compact JSON for QR code
    const qrData = JSON.stringify({
      v: 1, // version
      t: 'emergency', // type
      d: emergencyData
    });

    setEmergencyQRData(qrData);
  }, [profile, allergies, medications, conditions, emergencyContacts]);

  const criticalAllergies = (allergies || []).filter(
    (a: any) => a.severity === 'severe' || a.severity === 'life-threatening'
  );

  const activeMedications = (medications || []).filter((m: any) => m.is_active);

  return (
    <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-800">{t('emergency.title')}</CardTitle>
              <CardDescription>{t('emergency.subtitle')}</CardDescription>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <QrCode className="h-4 w-4" />
                Emergency QR
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency Medical Information
                </DialogTitle>
                <DialogDescription>
                  Show this QR code to emergency responders for instant access to critical medical information
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col items-center py-6">
                <div className="p-4 bg-white rounded-xl shadow-lg">
                  <QRCodeSVG 
                    value={emergencyQRData} 
                    size={200}
                    level="M"
                    includeMargin
                  />
                </div>
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  Contains: Blood type, allergies, current medications, emergency contacts
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" className="w-full">
                  Print Emergency Card
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Blood Type */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-red-500" />
            <span className="font-medium">{t('emergency.bloodType')}</span>
          </div>
          <Badge variant="outline" className="text-lg font-bold text-red-700 border-red-300">
            {profile?.blood_type || 'Not Set'}
          </Badge>
        </div>

        {/* Critical Allergies */}
        {criticalAllergies.length > 0 && (
          <Alert className="border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">{t('emergency.allergiesWarning')}</AlertTitle>
            <AlertDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                {criticalAllergies.map((allergy: any) => (
                  <Badge 
                    key={allergy.id} 
                    variant="destructive"
                    className="text-sm"
                  >
                    {allergy.allergen} ({allergy.severity})
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Medications */}
        {activeMedications.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Pill className="h-4 w-4 text-purple-600" />
              {t('emergency.currentMedications')}
            </h4>
            <div className="grid gap-2">
              {activeMedications.slice(0, 5).map((med: any) => (
                <div 
                  key={med.id}
                  className="flex justify-between items-center p-2 bg-white rounded border text-sm"
                >
                  <span className="font-medium">{med.medication_name}</span>
                  <span className="text-muted-foreground">{med.dosage}</span>
                </div>
              ))}
              {activeMedications.length > 5 && (
                <p className="text-sm text-muted-foreground">
                  +{activeMedications.length - 5} more medications
                </p>
              )}
            </div>
          </div>
        )}

        {/* Emergency Contacts */}
        {emergencyContacts && emergencyContacts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-600" />
              {t('emergency.emergencyContacts')}
            </h4>
            <div className="grid gap-2">
              {emergencyContacts.map((contact: any) => (
                <div 
                  key={contact.id}
                  className="flex justify-between items-center p-2 bg-white rounded border"
                >
                  <div>
                    <p className="font-medium text-sm">{contact.contact_name}</p>
                    <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                  </div>
                  <a 
                    href={`tel:${contact.phone_number}`}
                    className="flex items-center gap-1 text-sm text-green-600 hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {contact.phone_number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medical Conditions */}
        {conditions && conditions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              {t('emergency.medicalConditions')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition: any) => (
                <Badge 
                  key={condition.id}
                  variant="outline"
                  className={
                    condition.status === 'active' 
                      ? 'border-red-300 text-red-700' 
                      : 'border-gray-300'
                  }
                >
                  {condition.condition_name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
