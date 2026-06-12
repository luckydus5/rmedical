// ================================
// Export Records Button Component
// Professional PDF/Print export for patient records
// ================================

import React, { useState } from 'react';
import { FileText, Download, Printer, ChevronDown, Loader2, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMedications } from '@/hooks/useMedicalRecords';
import { useAllergies } from '@/hooks/useMedicalRecords';
import { useMedicalConditions } from '@/hooks/useMedicalRecords';
import { useLabResults } from '@/hooks/useMedicalRecords';
import { useEmergencyContacts } from '@/hooks/useMedicalRecords';
import { 
  printMedicalRecords, 
  downloadMedicalRecordsHTML,
  generateMedicalRecordHTML 
} from '@/lib/pdfGenerator';

interface ExportRecordsButtonProps {
  patientId: string;
  patientProfile: {
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    phone?: string;
    nationalId?: string;
    bloodType?: string;
  };
  vaccinations?: any[];
}

export function ExportRecordsButton({ 
  patientId, 
  patientProfile,
  vaccinations = []
}: ExportRecordsButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: medications = [] } = useMedications(patientId);
  const { data: allergies = [] } = useAllergies(patientId);
  const { data: conditions = [] } = useMedicalConditions(patientId);
  const { data: labResults = [] } = useLabResults(patientId);
  const { data: emergencyContacts = [] } = useEmergencyContacts(patientId);

  const getPatientData = () => ({
    profile: patientProfile,
    medications,
    allergies,
    conditions,
    labResults,
    vaccinations,
    emergencyContacts,
  });

  const handlePrint = async () => {
    setIsExporting(true);
    try {
      printMedicalRecords(getPatientData());
      toast({
        title: 'Print Ready',
        description: 'Your medical records are ready to print',
      });
    } catch (error) {
      toast({
        title: 'Print Failed',
        description: 'Could not prepare records for printing',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadHTML = async () => {
    setIsExporting(true);
    try {
      downloadMedicalRecordsHTML(getPatientData());
      toast({
        title: 'Download Started',
        description: 'Your medical records are being downloaded',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Could not download records',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      toast({
        title: 'Sharing Not Supported',
        description: 'Your browser does not support sharing. Try downloading instead.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      const html = generateMedicalRecordHTML(getPatientData());
      const blob = new Blob([html], { type: 'text/html' });
      const file = new File(
        [blob], 
        `medical-records-${patientProfile.fullName.replace(/\s+/g, '-')}.html`,
        { type: 'text/html' }
      );

      await navigator.share({
        title: `Medical Records - ${patientProfile.fullName}`,
        text: 'Sanovia Medical Records',
        files: [file],
      });

      toast({
        title: 'Shared Successfully',
        description: 'Your medical records have been shared',
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: 'Share Failed',
          description: 'Could not share records',
          variant: 'destructive',
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          Export Records
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handlePrint} className="gap-2 cursor-pointer">
          <Printer className="h-4 w-4" />
          Print Records
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleDownloadHTML} className="gap-2 cursor-pointer">
          <Download className="h-4 w-4" />
          Download HTML
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleShare} className="gap-2 cursor-pointer">
          <Share2 className="h-4 w-4" />
          Share via...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple Export Button (Single action - direct print)
export function PrintRecordsButton({ 
  patientId, 
  patientProfile,
  vaccinations = []
}: ExportRecordsButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: medications = [] } = useMedications(patientId);
  const { data: allergies = [] } = useAllergies(patientId);
  const { data: conditions = [] } = useMedicalConditions(patientId);
  const { data: labResults = [] } = useLabResults(patientId);
  const { data: emergencyContacts = [] } = useEmergencyContacts(patientId);

  const handlePrint = async () => {
    setIsExporting(true);
    try {
      printMedicalRecords({
        profile: patientProfile,
        medications,
        allergies,
        conditions,
        labResults,
        vaccinations,
        emergencyContacts,
      });
    } catch (error) {
      toast({
        title: 'Print Failed',
        description: 'Could not prepare records for printing',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handlePrint}
      disabled={isExporting}
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
      Print Records
    </Button>
  );
}

export default ExportRecordsButton;
