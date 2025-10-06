'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { PatientForm } from '@/components/forms/PatientForm';
import { usePatients, Patient } from '@/hooks/usePatients';
import { Loader2 } from 'lucide-react';

export default function PatientEditPage() {
  const params = useParams();
  const router = useRouter();
  const { getPatientById } = usePatients();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPatient = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const patientId = params.id as string;
        const patientData = await getPatientById(patientId);
        
        if (!patientData) {
          setError('Patient not found');
          return;
        }
        
        setPatient(patientData);
      } catch (err) {
        console.error('Failed to load patient:', err);
        setError('Failed to load patient data');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadPatient();
    }
  }, [params.id, getPatientById]);

  const handleSave = (updatedPatient: Patient) => {
    // Redirect back to patient detail page
    router.push(`/patients/${params.id}`);
  };

  const handleCancel = () => {
    // Redirect back to patient detail page
    router.push(`/patients/${params.id}`);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !patient) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {error || 'Patient not found'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The patient you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <button
              onClick={() => router.push('/patients')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Patients
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Patient
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Update patient information
            </p>
          </div>
        </div>

        <PatientForm
          patient={patient}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </Layout>
  );
}
