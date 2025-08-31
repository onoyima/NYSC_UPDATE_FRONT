'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import studentService from '@/services/student.service';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface StudentDetails {
  student: any;
  academic: any;
  contact: any;
  nysc: any;
  is_submitted: boolean;
  is_paid: boolean;
  payment_amount: number | null;
}

const DataConfirmationPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [studyModes, setStudyModes] = useState<any[]>([]);

  useEffect(() => {
    fetchStudentDetails();
    fetchStudyModes();
  }, []);

  const fetchStudyModes = async () => {
    try {
      const response = await studentService.getStudyModes();
      setStudyModes(response.study_modes || []);
    } catch (error) {
      console.error('Error fetching study modes:', error);
      toast.error('Failed to load study modes');
    }
  };

  const fetchStudentDetails = async () => {
    try {
      const response = await studentService.getDetails();

      setStudentDetails(response.data);

      // Pre-fill form ONLY from student, academic, and contact tables (NOT from student_nysc)
      const data = response.data;



      // Helper function to handle 'Not provided' values
        const getValue = (value: any) => {
          return (value && value !== 'Not provided') ? value : '';
        };

        const prefilledData = {
          // Personal Information - from student table
          fname: getValue(data.student?.fname),
          mname: getValue(data.student?.mname),
          lname: getValue(data.student?.lname),
          gender: getValue(data.student?.gender),
          dob: getValue(data.student?.dob),
          marital_status: getValue(data.student?.marital_status),
          state: getValue(data.student?.state),

          // Contact Information - from student table
          phone: getValue(data.student?.phone),
          username: getValue(data.student?.username),
          address: getValue(data.student?.address),
          lga: getValue(data.student?.lga),

          // Academic Information - from academic table
          matric_no: getValue(data.academic?.matric_no),
          department: getValue(typeof data.academic?.department === 'object' ? data.academic?.department?.name : data.academic?.department),
          course_study: getValue(data.academic?.course_study),

          jamb_no: getValue(data.academic?.jamb_no),
          study_mode: getValue(data.academic?.study_mode),
          level: getValue(data.academic?.level),
          graduation_year: getValue(data.academic?.graduation_year),
          cgpa: getValue(data.academic?.cgpa)

        };

      setFormData(prefilledData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch student details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check for required fields
      const requiredFields = [
        'fname', 'lname', 'gender', 'dob', 'marital_status', 'phone', 'username', 'address',
        'lga', 'matric_no', 'department',
        'graduation_year', 'cgpa', 'jamb_no', 'study_mode'
      ];

      // Note: We check for 'username' here but map it to 'email' in the API call

      const missingFields = requiredFields.filter(field => !formData[field] || formData[field].toString().trim() === '');

      if (missingFields.length > 0) {
        toast.error(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      // Get current system status for payment amount
      const systemStatus = await studentService.getSystemStatus();
      
      // Prepare data for API call - include payment_amount
      // Map username to email as backend expects email field
      const confirmData = {
        ...formData,
        email: formData.username, // Use username value as email
        level: formData.level ? String(formData.level) : '', // Ensure level is a string
        phone: formData.phone ? String(formData.phone) : '', // Ensure phone is a string
        matric_no: formData.matric_no ? String(formData.matric_no) : '', // Ensure matric_no is a string
        jamb_no: formData.jamb_no ? String(formData.jamb_no) : '', // Ensure jamb_no is a string
        course_study: formData.course_study || '', // Ensure course_study is included
        payment_amount: systemStatus.current_fee // Use dynamic payment amount from admin settings
      };

      // Call confirmDetails API to save data to database
      const response = await studentService.confirmDetails(confirmData);

      // Store the form data temporarily in localStorage for use after payment
      localStorage.setItem('nysc_form_data', JSON.stringify(formData));

      // Store the session_id from the response for payment initiation
      if (response.data && response.data.session_id) {
        localStorage.setItem('nysc_session_id', response.data.session_id);
      }

      // Redirect to payment page
      router.push('/student/payment');
      toast.success('Data confirmed successfully. Proceeding to payment...');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to confirm data');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen animate-fade-in">
        <LoadingSpinner
          size="xl"
          text="Loading confirmation data..."
          className="animate-scale-in"
        />
      </div>
    );
  }

  // Allow multiple confirmations - students can update data and pay again

  return (
    <ProtectedRoute userType="student">
      <div className="min-h-screen bg-background">
        <Navbar />
        <Sidebar />
        <div className="flex">
          <main className="flex-1 ml-0 md:ml-64 p-4 md:p-6 pt-20 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6 pb-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Confirm Your Data</h1>
                  <p className="text-muted-foreground">
                    Please review and confirm your information before proceeding to payment.
                  </p>
                </div>
                <Link href="/student">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </Link>
              </div>

              {/* Status and Warning */}
              {studentDetails?.is_submitted && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-800">Data Update</h3>
                        <p className="text-blue-700 text-sm">
                          You have previously submitted your data. You can make changes and submit again, but each update requires a new payment.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-800">Payment Required</h3>
                      <p className="text-yellow-700 text-sm">
                        Each data confirmation requires payment. Please ensure all information is correct before proceeding to payment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form */}
              <form onSubmit={handleProceedToPayment} className="space-y-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="fname">First Name *</Label>
                        <Input
                          id="fname"
                          value={formData.fname || ''}
                          onChange={(e) => handleInputChange('fname', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="mname">Middle Name</Label>
                        <Input
                          id="mname"
                          value={formData.mname || ''}
                          onChange={(e) => handleInputChange('mname', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lname">Last Name *</Label>
                        <Input
                          id="lname"
                          value={formData.lname || ''}
                          onChange={(e) => handleInputChange('lname', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="gender">Gender *</Label>
                        <Select value={formData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="dob">Date of Birth *</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={formData.dob || ''}
                          onChange={(e) => handleInputChange('dob', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="marital_status">Marital Status *</Label>
                        <Select value={formData.marital_status || ''} onValueChange={(value) => handleInputChange('marital_status', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                            <SelectItem value="Religious">Religious</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="matric_no">Matriculation Number *</Label>
                        <Input
                          id="matric_no"
                          value={formData.matric_no || ''}
                          onChange={(e) => handleInputChange('matric_no', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="department">Department *</Label>
                        <Input
                          id="department"
                          value={formData.department || ''}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="course_study">Course of Study</Label>
                        <Input
                          id="course_study"
                          value={formData.course_study || ''}
                          onChange={(e) => handleInputChange('course_study', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="jamb_no">JAMB Number</Label>
                        <Input
                          id="jamb_no"
                          value={formData.jamb_no || ''}
                          onChange={(e) => handleInputChange('jamb_no', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="study_mode">Study Mode</Label>
                        <Select value={formData.study_mode || ''} onValueChange={(value) => handleInputChange('study_mode', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select study mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {studyModes.map((mode) => (
                              <SelectItem key={mode.id} value={mode.mode}>
                                {mode.mode}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="level">Current Level</Label>
                        <Input
                          id="level"
                          value={formData.level || ''}
                          onChange={(e) => handleInputChange('level', e.target.value)}
                          placeholder="e.g., 100, 200, 300, 400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="lga">Local Government Area *</Label>
                        <Input
                          id="lga"
                          value={formData.lga || ''}
                          onChange={(e) => handleInputChange('lga', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={formData.state || ''}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          required
                          placeholder="Enter your state"
                        />
                      </div>
                      <div>
                        <Label htmlFor="graduation_year">Graduation Year</Label>
                        <Input
                          id="graduation_year"
                          type="number"
                          min="2000"
                          max="2030"
                          value={formData.graduation_year || ''}
                          onChange={(e) => handleInputChange('graduation_year', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="cgpa">CGPA</Label>
                        <Input
                          id="cgpa"
                          type="number"
                          step="0.01"
                          min="0"
                          max="5"
                          value={formData.cgpa || ''}
                          onChange={(e) => handleInputChange('cgpa', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={formData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Email Address *</Label>
                        <Input
                          id="username"
                          type="username"
                          value={formData.username || ''}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Textarea
                        id="address"
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        required
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Button */}
                <div className="flex justify-end space-x-4">
                  <Link href="/student">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                    {isSubmitting ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                  </Button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default DataConfirmationPage;
