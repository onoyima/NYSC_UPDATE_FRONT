'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import studentService from '@/services/student.service';
import { toast } from 'sonner';
import { User, Mail, Phone, Calendar, MapPin, GraduationCap, CheckCircle, AlertCircle, ArrowLeft, CreditCard, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface UpdatedStudentInfo {
  id: number;
  fname: string;
  lname: string;
  mname?: string;
  full_name: string;
  matric_no: string;
  matric_number: string;
  username?: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  marital_status?: string;
  address?: string;
  current_address?: string;
  state: string;
  lga: string;
  lga_of_origin: string;
  institution: string;
  course_of_study?: string | null;
  department?: string;
  faculty?: string | null;
  level?: string;
  graduation_year?: number;
  year_of_graduation?: number;
  degree_class?: string;
  cgpa?: number;
  jamb_no?: string;
  study_mode?: string;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_contact_address?: string | null;
  blood_group?: string | null;
  genotype?: string | null;
  height?: string | null;
  weight?: string | null;
  is_paid: boolean;
  payment_amount?: number | null;
  payment_reference?: string | null;
  payment_date?: string | null;
  is_submitted: boolean;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

const UpdatedInfoPage: React.FC = () => {
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState<UpdatedStudentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUpdatedStudentInfo();
  }, []);

  const fetchUpdatedStudentInfo = async () => {
    try {
      const response = await studentService.getUpdatedStudentInfo();
      setStudentInfo(response.data.data);
      setError(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch updated student information';
      setError(errorMessage);
      if (error.response?.status !== 404) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute userType="student">
        <div className="min-h-screen bg-background">
          <Navbar />
          <Sidebar />
          <div className="flex">
            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-28 md:pt-32 pb-24 min-h-screen flex items-center justify-center">
              <LoadingSpinner 
                size="xl" 
                text="Loading student information..."
                className="animate-fade-in"
              />
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute userType="student">
        <div className="min-h-screen bg-background">
          <Navbar />
          <Sidebar />
          <div className="flex">
            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen pt-28 md:pt-32 pb-24">
              <div className="max-w-4xl mx-auto px-2 sm:px-0">
                <div className="mb-6">
                  <Link href="/student">
                    <Button variant="outline" className="mb-4">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Dashboard
                    </Button>
                  </Link>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Updated Information</h1>
                  <p className="text-muted-foreground">
                    View your submitted student details update information
                  </p>
                </div>

                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Submitted Data Found</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven&apos;t submitted your student details update data yet.
                      </p>
                      <Link href="/student/confirm">
                        <Button>
                          Complete Update
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="student">
      <div className="min-h-screen bg-background">
        <Navbar />
        <Sidebar />
        <div className="flex">
          <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen pt-28 md:pt-32 pb-24">
            <div className="max-w-4xl mx-auto px-2 sm:px-0">
              <div className="mb-6">
                <Link href="/student">
                  <Button variant="outline" className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </Link>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2">Updated Student Information</h1>
                <p className="text-muted-foreground">
                  Your submitted student details update information
                </p>
              </div>

              {/* Status Alert */}
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>
                      Your student details update has been successfully submitted and 
                      {studentInfo?.is_paid ? ' payment completed' : ' payment is pending'}.
                    </span>
                    <div className="flex space-x-2">
                      <Badge className={studentInfo?.is_submitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {studentInfo?.is_submitted ? 'Submitted' : 'Pending'}
                      </Badge>
                      <Badge className={studentInfo?.is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {studentInfo?.is_paid ? 'Paid' : 'Payment Pending'}
                      </Badge>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">First Name</label>
                        <p className="text-lg font-semibold">{studentInfo?.fname}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                        <p className="text-lg font-semibold">{studentInfo?.lname}</p>
                      </div>
                      {studentInfo?.mname && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Middle Name</label>
                          <p className="font-medium">{studentInfo?.mname}</p>
                        </div>
                      )}
                      {studentInfo?.username && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Username</label>
                          <p className="font-medium">{studentInfo.username}</p>
                        </div>
                      )}
                      {studentInfo?.matric_no && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Matric Number</label>
                          <p className="font-medium">{studentInfo.matric_no}</p>
                        </div>
                      )}
                      {studentInfo?.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="font-medium">{studentInfo.email}</p>
                          </div>
                        </div>
                      )}
                      {studentInfo?.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="font-medium">{studentInfo.phone}</p>
                          </div>
                        </div>
                      )}
                      {studentInfo?.dob && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                            <p className="font-medium">
                              {format(new Date(studentInfo.dob), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      )}
                      {studentInfo?.gender && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Gender</label>
                          <p className="font-medium capitalize">{studentInfo.gender}</p>
                        </div>
                      )}
                      {studentInfo?.marital_status && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Marital Status</label>
                          <p className="font-medium capitalize">{studentInfo.marital_status}</p>
                        </div>
                      )}
                    </div>
                    {studentInfo?.address && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                        <p className="font-medium">{studentInfo.address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Location Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {studentInfo?.state && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">State of Origin</label>
                        <p className="font-medium">{studentInfo?.state}</p>
                      </div>
                    )}
                    {(studentInfo?.lga_of_origin || studentInfo?.lga) && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">LGA of Origin</label>
                        <p className="font-medium">{studentInfo?.lga_of_origin || studentInfo?.lga}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Academic Information */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Academic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studentInfo?.course_of_study && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Course of Study</label>
                        <p className="font-medium">{studentInfo.course_of_study}</p>
                      </div>
                    )}
                    {studentInfo?.department && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Department</label>
                        <p className="font-medium">{studentInfo.department}</p>
                      </div>
                    )}
                    {studentInfo?.faculty && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Faculty</label>
                        <p className="font-medium">{studentInfo.faculty}</p>
                      </div>
                    )}
                    {studentInfo?.level && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Level</label>
                        <p className="font-medium">{studentInfo.level}</p>
                      </div>
                    )}
                    {(studentInfo?.graduation_year || studentInfo?.year_of_graduation) && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Year of Graduation</label>
                        <p className="font-medium">{studentInfo?.graduation_year || studentInfo?.year_of_graduation}</p>
                      </div>
                    )}
                    {studentInfo?.cgpa && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">CGPA</label>
                        <p className="font-medium">{Number(studentInfo.cgpa).toFixed(2)}</p>
                      </div>
                    )}
                    {studentInfo?.jamb_no && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">JAMB Number</label>
                        <p className="font-medium">{studentInfo?.jamb_no}</p>
                      </div>
                    )}
                    {studentInfo?.study_mode && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Study Mode</label>
                        <p className="font-medium">{studentInfo.study_mode}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>



                {/* Emergency Contact Information */}
                {(studentInfo?.emergency_contact_name || studentInfo?.emergency_contact_phone) && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Emergency Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentInfo?.emergency_contact_name && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Emergency Contact Name</label>
                          <p className="font-medium">{studentInfo.emergency_contact_name}</p>
                        </div>
                      )}
                      {studentInfo?.emergency_contact_phone && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Emergency Contact Phone</label>
                          <p className="font-medium">{studentInfo.emergency_contact_phone}</p>
                        </div>
                      )}
                      {studentInfo?.emergency_contact_relationship && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                          <p className="font-medium capitalize">{studentInfo.emergency_contact_relationship}</p>
                        </div>
                      )}
                      {studentInfo?.emergency_contact_address && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">Emergency Contact Address</label>
                          <p className="font-medium">{studentInfo.emergency_contact_address}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Additional Information */}
                {(studentInfo?.blood_group || studentInfo?.genotype || studentInfo?.height || studentInfo?.weight) && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Additional Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {studentInfo?.blood_group && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Blood Group</label>
                          <p className="font-medium">{studentInfo.blood_group}</p>
                        </div>
                      )}
                      {studentInfo?.genotype && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Genotype</label>
                          <p className="font-medium">{studentInfo.genotype}</p>
                        </div>
                      )}
                      {studentInfo?.height && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Height</label>
                          <p className="font-medium">{studentInfo.height}</p>
                        </div>
                      )}
                      {studentInfo?.weight && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Weight</label>
                          <p className="font-medium">{studentInfo.weight}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Submission Information */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Submission Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Submission Status</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={studentInfo?.is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
  {studentInfo?.is_paid ? 'Paid' : 'Payment Pending'}
</Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={studentInfo?.is_submitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
  {studentInfo?.is_submitted ? 'Submitted' : 'Pending'}
</Badge>

                      </div>
                    </div>
                    {studentInfo?.submitted_at && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Submitted At</label>
                         <p className="font-medium">
                           {format(new Date(studentInfo.submitted_at), 'MMM dd, yyyy HH:mm')}
                         </p>
                       </div>
                     )}
                     {studentInfo?.updated_at && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                         <p className="font-medium">
                           {format(new Date(studentInfo.updated_at), 'MMM dd, yyyy HH:mm')}
                         </p>
                       </div>
                     )}
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-center space-x-4">
                <Link href="/student/payment-history">
                  <Button variant="outline">
                    <CreditCard className="mr-2 h-4 w-4" />
                    View Payment History
                  </Button>
                </Link>
                {!Boolean(studentInfo?.is_paid) && (
                  <Link href="/student/payment">
                    <Button>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Complete Payment
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default UpdatedInfoPage;