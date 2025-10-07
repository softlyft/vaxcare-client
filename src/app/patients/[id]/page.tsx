'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePatients, Patient } from '@/hooks/usePatients';
import { useImmunizations, Immunization } from '@/hooks/useImmunizations';
import { ArrowLeft, Plus, Syringe, Calendar, User, Phone, Mail, MapPin, Edit, Eye, Pencil, Flame } from 'lucide-react';
import { ImmunizationForm } from '@/components/forms/ImmunizationForm';

interface PatientDetailPageProps {
  params: {
    id: string;
  };
}

export default function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { getPatientById } = usePatients();
  const { getImmunizationsByPatient, createImmunization } = useImmunizations();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [immunizations, setImmunizations] = useState<Immunization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [patientId, setPatientId] = useState<string>('');
  const [selectedImmunization, setSelectedImmunization] = useState<Immunization | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const [showAddImmunization, setShowAddImmunization] = useState(false);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setPatientId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!patientId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError('');

        const patientData = await getPatientById(patientId);
        if (!patientData) {
          setError('Patient not found');
          return;
        }

        setPatient(patientData);
        const immunizationsData = await getImmunizationsByPatient(patientId);
        setImmunizations(immunizationsData);
      } catch (err) {
        console.error('Failed to load patient data:', err);
        setError('Failed to load patient data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [patientId, getPatientById, getImmunizationsByPatient]);

  const formatName = (patient: Patient) => {
    const name = patient.name[0];
    return `${name?.given?.join(' ')} ${name?.family}`;
  };

  const formatAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleAddImmunization = async (immunizationData: Omit<Immunization, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createImmunization({
        ...immunizationData,
        patient: {
          reference: `Patient/${patient?.id}`,
          display: formatName(patient!),
        },
      });
      
      // Reload immunizations
      const updatedImmunizations = await getImmunizationsByPatient(patientId);
      setImmunizations(updatedImmunizations);
    } catch (err) {
      console.error('Failed to add immunization:', err);
      throw err;
    }
  };

  const handleImmunizationSuccess = () => {
    // Close the dialog
    setShowAddImmunization(false);
  };

  const handleViewImmunization = (immunization: Immunization) => {
    setSelectedImmunization(immunization);
    setShowViewDialog(true);
  };

  const handleEditImmunization = (immunization: Immunization) => {
    setSelectedImmunization(immunization);
    setShowEditDialog(true);
  };

  const handleViewJson = (immunization: Immunization) => {
    setSelectedImmunization(immunization);
    setShowJsonDialog(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !patient) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error || 'Patient not found'}</p>
          <Link href="/patients">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/patients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatName(patient)}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Patient ID: {patient.id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/patients/${patient.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Patient
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Immunization
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Immunization</DialogTitle>
                  <DialogDescription>
                    Record a new vaccination for {formatName(patient)}
                  </DialogDescription>
                </DialogHeader>
                <ImmunizationForm
                  patientId={patient.id}
                  onSave={handleAddImmunization}
                  onSuccess={handleImmunizationSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* View Immunization Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Immunization Details</DialogTitle>
              <DialogDescription>
                Full details for {selectedImmunization?.vaccineCode.coding[0]?.display || 'Unknown Vaccine'}
              </DialogDescription>
            </DialogHeader>
            {selectedImmunization && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Vaccine</label>
                    <p className="text-sm">{selectedImmunization.vaccineCode.coding[0]?.display || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <Badge variant={
                      selectedImmunization.status === 'completed' ? 'default' :
                      selectedImmunization.status === 'not-done' ? 'secondary' : 'destructive'
                    }>
                      {selectedImmunization.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
                    <p className="text-sm">{new Date(selectedImmunization.occurrenceDateTime).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Performer</label>
                    <p className="text-sm">{selectedImmunization.performer?.[0]?.actor?.display || 'Unknown'}</p>
                  </div>
                </div>
                {selectedImmunization.lotNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Lot Number</label>
                    <p className="text-sm">{selectedImmunization.lotNumber}</p>
                  </div>
                )}
                {selectedImmunization.manufacturer && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Manufacturer</label>
                    <p className="text-sm">{selectedImmunization.manufacturer.display}</p>
                  </div>
                )}
                {selectedImmunization.doseQuantity && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Dose</label>
                    <p className="text-sm">{selectedImmunization.doseQuantity.value} {selectedImmunization.doseQuantity.unit}</p>
                  </div>
                )}
                {selectedImmunization.site && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Site</label>
                    <p className="text-sm">{selectedImmunization.site.coding[0]?.display || 'Unknown'}</p>
                  </div>
                )}
                {selectedImmunization.route && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Route</label>
                    <p className="text-sm">{selectedImmunization.route.coding[0]?.display || 'Unknown'}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Immunization Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Immunization</DialogTitle>
              <DialogDescription>
                Update vaccination details for {selectedImmunization?.vaccineCode.coding[0]?.display || 'Unknown Vaccine'}
              </DialogDescription>
            </DialogHeader>
            {selectedImmunization && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Edit functionality coming soon...</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowEditDialog(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View JSON Dialog */}
        <Dialog open={showJsonDialog} onOpenChange={setShowJsonDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Flame className="mr-2 h-5 w-5 text-orange-500" />
                FHIR Immunization Resource
              </DialogTitle>
              <DialogDescription>
                Raw JSON data for {selectedImmunization?.vaccineCode.coding[0]?.display || 'Unknown Vaccine'}
              </DialogDescription>
            </DialogHeader>
            {selectedImmunization && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto">
                  <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {JSON.stringify(selectedImmunization, null, 2)}
                  </pre>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Resource Type: {selectedImmunization.resourceType}</span>
                  <span>ID: {selectedImmunization.id}</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatName(patient)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</p>
                  <Badge variant="outline">{patient.gender}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatAge(patient.birthDate)} years
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Birth Date</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(patient.birthDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                  <Badge variant={patient.active !== false ? "default" : "secondary"}>
                    {patient.active !== false ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            {patient.contact && patient.contact.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.contact.map((contact, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      {contact.system === 'phone' && <Phone className="h-4 w-4 text-gray-400" />}
                      {contact.system === 'email' && <Mail className="h-4 w-4 text-gray-400" />}
                      <span className="text-sm text-gray-900 dark:text-white">{contact.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Address Information */}
            {patient.address && patient.address.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div className="text-sm text-gray-900 dark:text-white">
                      {patient.address[0]?.line?.join(', ')}
                      {patient.address[0]?.city && <>, {patient.address[0].city}</>}
                      {patient.address[0]?.state && <>, {patient.address[0].state}</>}
                      {patient.address[0]?.postalCode && <>, {patient.address[0].postalCode}</>}
                      {patient.address[0]?.country && <>, {patient.address[0].country}</>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Immunizations */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Syringe className="mr-2 h-5 w-5" />
                  Immunization History
                </CardTitle>
                <CardDescription>
                  {immunizations.length} vaccination{immunizations.length !== 1 ? 's' : ''} recorded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {immunizations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vaccine</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Performer</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {immunizations.map((immunization) => (
                        <TableRow key={immunization.id}>
                          <TableCell className="font-medium">
                            {immunization.vaccineCode.coding[0]?.display || 'Unknown Vaccine'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{new Date(immunization.occurrenceDateTime).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              immunization.status === 'completed' ? 'default' :
                              immunization.status === 'not-done' ? 'secondary' : 'destructive'
                            }>
                              {immunization.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {immunization.performer?.[0]?.actor?.display || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewImmunization(immunization)}
                                className="h-8 w-8 p-0"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditImmunization(immunization)}
                                className="h-8 w-8 p-0"
                                title="Edit Record"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewJson(immunization)}
                                className="h-8 w-8 p-0"
                                title="View FHIR JSON"
                              >
                                <Flame className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Syringe className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      No immunizations recorded yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
