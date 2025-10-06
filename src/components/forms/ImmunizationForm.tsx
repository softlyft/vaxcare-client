'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useImmunizations, Immunization } from '@/hooks/useImmunizations';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { ImmunizationWorkflowService, ImmunizationWorkflowData } from '@/services/immunizationWorkflow';

interface ImmunizationFormProps {
  patientId: string;
  onSave?: (immunization: Omit<Immunization, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const vaccineOptions = [
  { code: 'BCG', display: 'BCG (Bacillus Calmette-Guérin)' },
  { code: 'DTP', display: 'DTP (Diphtheria, Tetanus, Pertussis)' },
  { code: 'HepB', display: 'Hepatitis B' },
  { code: 'Hib', display: 'Hib (Haemophilus influenzae type b)' },
  { code: 'IPV', display: 'IPV (Inactivated Polio Vaccine)' },
  { code: 'MMR', display: 'MMR (Measles, Mumps, Rubella)' },
  { code: 'OPV', display: 'OPV (Oral Polio Vaccine)' },
  { code: 'PCV', display: 'PCV (Pneumococcal Conjugate Vaccine)' },
  { code: 'Rota', display: 'Rotavirus Vaccine' },
  { code: 'Varicella', display: 'Varicella (Chickenpox)' },
  { code: 'YellowFever', display: 'Yellow Fever' },
  { code: 'COVID19', display: 'COVID-19 Vaccine' },
];

const siteOptions = [
  { code: 'LA', display: 'Left Arm' },
  { code: 'RA', display: 'Right Arm' },
  { code: 'LL', display: 'Left Leg' },
  { code: 'RL', display: 'Right Leg' },
  { code: 'GL', display: 'Gluteal' },
];

const routeOptions = [
  { code: 'IM', display: 'Intramuscular' },
  { code: 'SC', display: 'Subcutaneous' },
  { code: 'ID', display: 'Intradermal' },
  { code: 'PO', display: 'Oral' },
  { code: 'IN', display: 'Intranasal' },
];

export function ImmunizationForm({ patientId, onSave, onCancel, onSuccess }: ImmunizationFormProps) {
  const { createImmunization } = useImmunizations();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const initialFormData = {
    status: 'completed' as 'completed' | 'entered-in-error' | 'not-done',
    vaccineCode: '',
    occurrenceDateTime: new Date().toISOString().slice(0, 16),
    performer: '',
    location: '',
    lotNumber: '',
    expirationDate: '',
    manufacturer: '',
    site: '',
    route: '',
    doseQuantity: {
      value: 1,
      unit: 'ml',
    },
  };

  const [formData, setFormData] = useState(initialFormData);

  const resetForm = () => {
    setFormData(initialFormData);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.vaccineCode || !formData.occurrenceDateTime) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const selectedVaccine = vaccineOptions.find(v => v.code === formData.vaccineCode);
      
      // Prepare workflow data
      const workflowData: ImmunizationWorkflowData = {
        patientId,
        patientName: 'Patient', // This will be updated with actual patient name from props
        vaccineCode: formData.vaccineCode,
        vaccineDisplay: selectedVaccine?.display || formData.vaccineCode,
        lotNumber: formData.lotNumber || undefined,
        manufacturer: formData.manufacturer || undefined,
        doseQuantity: {
          value: formData.doseQuantity.value,
          unit: formData.doseQuantity.unit,
        },
        site: formData.site || undefined,
        route: formData.route || undefined,
        occurrenceDateTime: formData.occurrenceDateTime,
        performer: formData.performer || undefined,
        location: formData.location || undefined,
      };

      // Execute the complete FHIR workflow
      const workflowService = new ImmunizationWorkflowService();
      const result = await workflowService.executeWorkflow(workflowData);

      // Show success toast with details
      toast.success('Immunization Workflow Completed', {
        description: `Created Encounter, Immunization${result.medication ? ', Medication' : ''}${result.medicationAdministration ? ', and MedicationAdministration' : ''} resources.`,
      });

      // Reset form for next entry
      resetForm();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to execute immunization workflow:', err);
      setError('Failed to save immunization. Please try again.');
      toast.error('Failed to Save Immunization', {
        description: 'There was an error saving the immunization. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'completed' | 'not-done' | 'entered-in-error' }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="not-done">Not Done</SelectItem>
            <SelectItem value="entered-in-error">Entered in Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vaccine Code */}
      <div className="space-y-2">
        <Label htmlFor="vaccineCode">Vaccine *</Label>
        <Select
          value={formData.vaccineCode}
          onValueChange={(value) => setFormData(prev => ({ ...prev, vaccineCode: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select vaccine" />
          </SelectTrigger>
          <SelectContent>
            {vaccineOptions.map((vaccine) => (
              <SelectItem key={vaccine.code} value={vaccine.code}>
                {vaccine.display}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date and Time */}
      <div className="space-y-2">
        <Label htmlFor="occurrenceDateTime">Date & Time *</Label>
        <Input
          id="occurrenceDateTime"
          type="datetime-local"
          value={formData.occurrenceDateTime}
          onChange={(e) => setFormData(prev => ({ ...prev, occurrenceDateTime: e.target.value }))}
          required
        />
      </div>

      {/* Performer */}
      <div className="space-y-2">
        <Label htmlFor="performer">Performer</Label>
        <Input
          id="performer"
          value={formData.performer}
          onChange={(e) => setFormData(prev => ({ ...prev, performer: e.target.value }))}
          placeholder="Enter performer name or ID"
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="Enter location name or ID"
        />
      </div>

      {/* Lot Number, Manufacturer, and Expiration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lotNumber">Lot Number</Label>
          <Input
            id="lotNumber"
            value={formData.lotNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, lotNumber: e.target.value }))}
            placeholder="Enter lot number"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input
            id="manufacturer"
            value={formData.manufacturer}
            onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
            placeholder="Enter manufacturer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expirationDate">Expiration Date</Label>
          <Input
            id="expirationDate"
            type="date"
            value={formData.expirationDate}
            onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
          />
        </div>
      </div>

      {/* Site and Route */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="site">Administration Site</Label>
          <Select
            value={formData.site}
            onValueChange={(value) => setFormData(prev => ({ ...prev, site: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select site" />
            </SelectTrigger>
            <SelectContent>
              {siteOptions.map((site) => (
                <SelectItem key={site.code} value={site.code}>
                  {site.display}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="route">Administration Route</Label>
          <Select
            value={formData.route}
            onValueChange={(value) => setFormData(prev => ({ ...prev, route: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select route" />
            </SelectTrigger>
            <SelectContent>
              {routeOptions.map((route) => (
                <SelectItem key={route.code} value={route.code}>
                  {route.display}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dose Quantity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="doseValue">Dose Value</Label>
          <Input
            id="doseValue"
            type="number"
            step="0.1"
            value={formData.doseQuantity.value}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              doseQuantity: { ...prev.doseQuantity, value: parseFloat(e.target.value) || 0 }
            }))}
            placeholder="Enter dose value"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="doseUnit">Dose Unit</Label>
          <Input
            id="doseUnit"
            value={formData.doseQuantity.unit}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              doseQuantity: { ...prev.doseQuantity, unit: e.target.value }
            }))}
            placeholder="Enter dose unit (e.g., ml, mg)"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Form will reset after successful submission
        </div>
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Add Immunization
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
