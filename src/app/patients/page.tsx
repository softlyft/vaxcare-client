'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePatients } from '@/hooks/usePatients';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { Patient } from '@/hooks/usePatients';

export default function PatientsPage() {
  const { patients, isLoading, deletePatient } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.name[0]?.given?.join(' ')} ${patient.name[0]?.family}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this patient?')) {
      setDeletingId(id);
      try {
        await deletePatient(id);
      } catch (error) {
        console.error('Failed to delete patient:', error);
        alert('Failed to delete patient. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Patients</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage patient records and vaccinations
            </p>
          </div>
          <Link href="/patients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </Link>
        </div>

        {/* Search and Stats */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary">
            {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Records</CardTitle>
            <CardDescription>
              All registered patients in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPatients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Birth Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        {formatName(patient)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {patient.gender}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatAge(patient.birthDate)} years
                      </TableCell>
                      <TableCell>
                        {new Date(patient.birthDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={patient.active !== false ? "default" : "secondary"}>
                          {patient.active !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/patients/${patient.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/patients/${patient.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(patient.id)}
                            disabled={deletingId === patient.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No patients found matching your search.' : 'No patients registered yet.'}
                </p>
                {!searchTerm && (
                  <Link href="/patients/new">
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Patient
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
