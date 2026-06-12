import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Shield,
  Pill,
  Info
} from 'lucide-react';
import { 
  checkAllInteractions, 
  InteractionCheckResult,
  DrugInteraction,
  AllergyConflict 
} from '@/lib/drugInteractions';
import { useMedications, useAllergies, useMedicalConditions } from '@/hooks/useMedicalRecords';

interface DrugInteractionAlertProps {
  patientId?: string;
  newMedication?: string;
  compact?: boolean;
}

const severityConfig = {
  critical: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800 border-red-300'
  },
  serious: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  moderate: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  minor: {
    icon: Info,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  safe: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-800 border-green-300'
  }
};

const riskConfig = {
  critical: severityConfig.critical,
  high: severityConfig.serious,
  moderate: severityConfig.moderate,
  low: severityConfig.minor,
  safe: severityConfig.safe
};

export default function DrugInteractionAlert({ patientId, newMedication, compact = false }: DrugInteractionAlertProps) {
  const { data: medications } = useMedications(patientId);
  const { data: allergies } = useAllergies(patientId);
  const { data: conditions } = useMedicalConditions(patientId);
  const [result, setResult] = useState<InteractionCheckResult | null>(null);

  useEffect(() => {
    if (!medications || medications.length === 0) {
      setResult(null);
      return;
    }

    // Get active medication names
    const medicationNames = medications
      .filter((m: any) => m.is_active)
      .map((m: any) => m.medication_name);
    
    // Add new medication if provided
    if (newMedication) {
      medicationNames.push(newMedication);
    }

    if (medicationNames.length === 0) {
      setResult(null);
      return;
    }

    // Get allergy names
    const allergyNames = (allergies || []).map((a: any) => a.allergen);
    
    // Get condition names
    const conditionNames = (conditions || []).map((c: any) => c.condition_name);

    // Run interaction check
    const checkResult = checkAllInteractions(medicationNames, allergyNames, conditionNames);
    setResult(checkResult);
  }, [medications, allergies, conditions, newMedication]);

  if (!result) {
    return null;
  }

  const config = riskConfig[result.overallRisk];
  const Icon = config.icon;

  if (compact) {
    if (result.overallRisk === 'safe') return null;
    
    return (
      <Alert className={`${config.bg} border`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
        <AlertTitle className={config.color}>
          {result.overallRisk === 'critical' ? 'Critical Alert' : 'Drug Interaction Warning'}
        </AlertTitle>
        <AlertDescription className="text-sm">
          {result.summary}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`${config.bg} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.bg}`}>
              <Shield className={`h-6 w-6 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Drug Safety Analysis
                <Badge variant="outline" className={config.badge}>
                  {result.overallRisk.toUpperCase()} RISK
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                AI-powered medication safety check
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Alert */}
        <Alert className={`${config.bg} border`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
          <AlertDescription className="font-medium">
            {result.summary}
          </AlertDescription>
        </Alert>

        {/* Drug-Drug Interactions */}
        {result.interactions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Drug Interactions ({result.interactions.length})
            </h4>
            <Accordion type="single" collapsible className="space-y-2">
              {result.interactions.map((interaction, idx) => {
                const sevConfig = severityConfig[interaction.severity];
                const SevIcon = sevConfig.icon;
                return (
                  <AccordionItem 
                    key={idx} 
                    value={`interaction-${idx}`}
                    className={`border rounded-lg px-4 ${sevConfig.bg}`}
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <SevIcon className={`h-4 w-4 ${sevConfig.color}`} />
                        <span className="font-medium">
                          {interaction.drug1} + {interaction.drug2}
                        </span>
                        <Badge variant="outline" className={sevConfig.badge}>
                          {interaction.severity}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="space-y-2 text-sm">
                        <p><strong>Effect:</strong> {interaction.effect}</p>
                        <p><strong>Mechanism:</strong> {interaction.mechanism}</p>
                        <p><strong>Recommendation:</strong> {interaction.recommendation}</p>
                        <p className="text-muted-foreground text-xs">
                          Source: {interaction.source}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}

        {/* Allergy Conflicts */}
        {result.allergyConflicts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Allergy Conflicts ({result.allergyConflicts.length})
            </h4>
            <div className="space-y-2">
              {result.allergyConflicts.map((conflict, idx) => (
                <Alert key={idx} className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">
                    {conflict.drug} ↔ {conflict.allergen}
                    {conflict.crossReactivity && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Cross-reactivity
                      </Badge>
                    )}
                  </AlertTitle>
                  <AlertDescription className="text-red-700">
                    {conflict.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Condition Contraindications */}
        {result.conditionContraindications.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-4 w-4" />
              Condition Warnings ({result.conditionContraindications.length})
            </h4>
            <div className="space-y-2">
              {result.conditionContraindications.map((contra, idx) => (
                <Alert key={idx} className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-800">
                    {contra.drug} with {contra.condition}
                  </AlertTitle>
                  <AlertDescription className="text-orange-700">
                    {contra.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Safe Status */}
        {result.overallRisk === 'safe' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">All Clear</AlertTitle>
            <AlertDescription className="text-green-700">
              No significant drug interactions, allergy conflicts, or contraindications detected 
              with the current medication list.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
