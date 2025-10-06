'use client';

import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePatients } from '@/hooks/usePatients';
import { useImmunizations } from '@/hooks/useImmunizations';
import { Users, Syringe, Activity, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { patients, isLoading: patientsLoading } = usePatients();
  const { immunizations, isLoading: immunizationsLoading } = useImmunizations();

  const stats = [
    {
      title: 'Total Patients',
      value: patients.length,
      description: 'Registered patients',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Immunizations',
      value: immunizations.length,
      description: 'Vaccinations recorded',
      icon: Syringe,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Completed',
      value: immunizations.filter(imm => imm.status === 'completed').length,
      description: 'Completed vaccinations',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Success Rate',
      value: patients.length > 0 ? `${Math.round((immunizations.filter(imm => imm.status === 'completed').length / Math.max(patients.length, 1)) * 100)}%` : '0%',
      description: 'Vaccination coverage',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
  ];

  if (patientsLoading || immunizationsLoading) {
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of your vaccination program
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>
                Latest registered patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patients.slice(0, 5).length > 0 ? (
                <div className="space-y-3">
                  {patients.slice(0, 5).map((patient) => (
                    <div key={patient.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {patient.name[0]?.given?.[0]?.charAt(0) || 'P'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {patient.name[0]?.given?.join(' ')} {patient.name[0]?.family}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {patient.gender} • {new Date(patient.birthDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No patients registered yet
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Immunizations</CardTitle>
              <CardDescription>
                Latest vaccination records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {immunizations.slice(0, 5).length > 0 ? (
                <div className="space-y-3">
                  {immunizations.slice(0, 5).map((immunization) => (
                    <div key={immunization.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Syringe className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {immunization.vaccineCode.coding[0]?.display || 'Vaccine'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(immunization.occurrenceDateTime).toLocaleDateString()} • {immunization.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No immunizations recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
