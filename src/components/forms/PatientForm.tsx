'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatients, Patient } from '@/hooks/usePatients';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface PatientFormProps {
  patient?: Patient;
  onSave?: (patient: Patient) => void;
  onCancel?: () => void;
}

export function PatientForm({ patient, onSave, onCancel }: PatientFormProps) {
  const router = useRouter();
  const { createPatient, updatePatient } = usePatients();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getInitialFormData = () => {
    if (!patient) {
      return {
        name: { family: '', given: '' },
        gender: '',
        birthDate: '',
        contact: { phone: '', email: '' },
        address: { line: '', city: '', state: '', postalCode: '', country: 'Nigeria' },
        active: true,
      };
    }

    return {
      name: {
        family: patient.name?.[0]?.family || '',
        given: patient.name?.[0]?.given?.join(' ') || '',
      },
      gender: patient.gender || '',
      birthDate: patient.birthDate || '',
      contact: {
        phone: patient.contact?.find(c => c.system === 'phone')?.value || '',
        email: patient.contact?.find(c => c.system === 'email')?.value || '',
      },
      address: {
        line: patient.address?.[0]?.line?.join(', ') || '',
        city: patient.address?.[0]?.city || '',
        state: patient.address?.[0]?.state || '',
        postalCode: patient.address?.[0]?.postalCode || '',
        country: patient.address?.[0]?.country || 'Nigeria',
      },
      active: patient.active !== false,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  // Update form data when patient prop changes
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.family || !formData.name.given || !formData.gender || !formData.birthDate) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> = {
        resourceType: 'Patient',
        name: [{
          family: formData.name.family,
          given: formData.name.given.split(' ').filter(Boolean),
          use: 'official',
        }],
        gender: formData.gender as 'male' | 'female' | 'other' | 'unknown',
        birthDate: formData.birthDate,
        contact: [
          ...(formData.contact.phone ? [{
            system: 'phone',
            value: formData.contact.phone,
            use: 'mobile',
          }] : []),
          ...(formData.contact.email ? [{
            system: 'email',
            value: formData.contact.email,
            use: 'home',
          }] : []),
        ],
        address: [{
          use: 'home',
          line: formData.address.line ? formData.address.line.split(',').map(s => s.trim()) : [],
          city: formData.address.city,
          state: formData.address.state,
          postalCode: formData.address.postalCode,
          country: formData.address.country,
        }],
        active: formData.active,
      };

      if (patient) {
        await updatePatient(patient.id, patientData);
        toast.success('Patient Updated Successfully', {
          description: `${formData.name.given} ${formData.name.family} has been updated.`,
        });
      } else {
        await createPatient(patientData);
        toast.success('Patient Created Successfully', {
          description: `${formData.name.given} ${formData.name.family} has been added to the system.`,
        });
      }

      if (onSave) {
        onSave(patientData as Patient);
      } else {
        router.push('/patients');
      }
    } catch (err) {
      console.error('Failed to save patient:', err);
      setError('Failed to save patient. Please try again.');
      toast.error('Failed to Save Patient', {
        description: 'There was an error saving the patient. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/patients');
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{patient ? 'Edit Patient' : 'Add New Patient'}</CardTitle>
        <CardDescription>
          {patient ? 'Update patient information' : 'Enter patient details to register them in the system'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="givenName">First Name *</Label>
              <Input
                id="givenName"
                value={formData.name.given}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: { ...prev.name, given: e.target.value }
                }))}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="familyName">Last Name *</Label>
              <Input
                id="familyName"
                value={formData.name.family}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: { ...prev.name, family: e.target.value }
                }))}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          {/* Gender and Birth Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date *</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.contact.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Address Information</h3>
            <div className="space-y-2">
              <Label htmlFor="addressLine">Address Line</Label>
              <Input
                id="addressLine"
                value={formData.address.line}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: { ...prev.address, line: e.target.value }
                }))}
                placeholder="Enter street address"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value }
                  }))}
                  placeholder="Enter state"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.address.postalCode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, postalCode: e.target.value }
                  }))}
                  placeholder="Enter postal code"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.address.country}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: { ...prev.address, country: e.target.value }
                }))}
                placeholder="Enter country"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="active">Status</Label>
            <Select
              value={formData.active ? 'active' : 'inactive'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, active: value === 'active' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
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
                  {patient ? 'Update Patient' : 'Add Patient'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
