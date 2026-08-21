'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from '@/utils/axios';
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
import { compressFileIfNeeded } from '@/utils/compressFile';

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
  const [sessions, setSessions] = useState<any[]>([]);
  const [studyModes, setStudyModes] = useState<any[]>([]);
  const [ninSlip, setNinSlip] = useState<File | null>(null);
  const [jambLetter, setJambLetter] = useState<File | null>(null);
  const [ninPreview, setNinPreview] = useState<{url: string, isPdf: boolean} | null>(null);
  const [jambPreview, setJambPreview] = useState<{url: string, isPdf: boolean} | null>(null);
  const [existingDocs, setExistingDocs] = useState<{nin: {url: string, isPdf: boolean} | null, jamb: {url: string, isPdf: boolean} | null}>({nin: null, jamb: null});
  const [originalValues, setOriginalValues] = useState<any>(null);

  useEffect(() => {
    fetchStudentDetails();
    fetchStudyModes();
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('/api/nysc/vua-sessions');
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

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

      // Pre-fill from what the student last submitted (nysc/temp record) when it
      // exists, falling back to the SIS student/academic tables for anything missing.
      const data = response.data;
      const n = data.nysc || {};



      // Helper function to handle 'Not provided' values
        const getValue = (value: any) => {
          return (value && value !== 'Not provided') ? value : '';
        };

        // Dates may arrive as ISO strings with time components - keep YYYY-MM-DD only
        const getDateValue = (value: any) => {
          const v = getValue(value);
          return v ? String(v).slice(0, 10) : '';
        };

        const prefilledData = {
          // Personal Information - prefer submitted values over SIS records
          fname: getValue(n.fname) || getValue(data.student?.fname),
          mname: getValue(n.mname) || getValue(data.student?.mname),
          lname: getValue(n.lname) || getValue(data.student?.lname),
          gender: getValue(n.gender) || getValue(data.student?.gender),
          dob: getDateValue(n.dob) || getDateValue(data.student?.dob),
          marital_status: getValue(n.marital_status) || getValue(data.student?.marital_status),
          state: getValue(n.state) || getValue(data.student?.state),

          // Contact Information - prefer submitted values over SIS records
          phone: getValue(n.phone) || getValue(data.student?.phone),
          username: getValue(n.email) || getValue(data.student?.username),
          address: getValue(n.address) || getValue(data.student?.address),
          lga: getValue(n.lga) || getValue(data.student?.lga),

          // Academic Information - matric/department/level stay authoritative from SIS,
          // the rest prefer what the student submitted
          matric_no: getValue(data.academic?.matric_no),
          department: getValue(typeof data.academic?.department === 'object' ? data.academic?.department?.name : data.academic?.department),
          course_study: getValue(n.course_of_study) || getValue(data.academic?.course_study),
          nin: getValue(n.nin),

          jamb_no: getValue(n.jamb_no) || getValue(data.academic?.jamb_no),
          study_mode: getValue(n.study_mode) || getValue(data.academic?.study_mode),
          level: getValue(data.academic?.level),
          graduation_year: getValue(data.academic?.graduation_year),
          cgpa: getValue(n.cgpa) || getValue(data.academic?.cgpa)

        };

        setFormData(prefilledData);
        // Snapshot of the loaded values - used to detect what the student changed
        setOriginalValues(prefilledData);

        // Show previously uploaded documents so they don't have to re-upload
        const toPreview = (path: any) => {
          if (!path) return null;
          return { url: path, isPdf: String(path).toLowerCase().endsWith('.pdf') };
        };
        setExistingDocs({
          nin: toPreview(n.nin_slip_url),
          jamb: toPreview(n.jamb_admission_letter_url)
        });

        // Default the Graduation Session to the latest ACTIVE session (e.g. 2025/2026),
        // never to the first session in the list or the 'Disabled' entry.
        try {
          const sessRes = await axios.get('/api/nysc/vua-sessions');
          const sessList = sessRes.data.sessions || [];
          const latestActive = sessList.find((s: any) => s.is_active) || sessList[0];
          if (latestActive) {
            const sessionName = latestActive.session || latestActive.session_name || latestActive.name || latestActive.year || '';
            setFormData((prev: any) => ({ ...prev, graduation_year: sessionName }));
            // Keep the snapshot in sync so the auto-filled session isn't
            // mistaken for a user-made change by the diff detection below
            setOriginalValues((prev: any) => (prev ? { ...prev, graduation_year: sessionName } : prev));
          }
        } catch {}
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
        'graduation_year', 'cgpa', 'jamb_no', 'study_mode', 'nin'
      ];

      // Note: We check for 'username' here but map it to 'email' in the API call

      const missingFields = requiredFields.filter(field => field !== 'cgpa' && (!formData[field] || formData[field].toString().trim() === ''));

      if (missingFields.length > 0) {
        toast.error(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      // Detect what changed relative to the loaded record
      const trackedFields = [
        'fname', 'mname', 'lname', 'gender', 'dob', 'marital_status', 'state', 'lga',
        'phone', 'username', 'address', 'matric_no', 'department', 'course_study',
        'jamb_no', 'study_mode', 'level', 'graduation_year', 'cgpa'
      ];
      const norm = (v: any) => String(v ?? '').trim();
      const hasLoadedRecord = !!(studentDetails?.is_submitted && studentDetails?.is_paid && originalValues);
      const otherFieldsChanged = hasLoadedRecord && trackedFields.some(f => norm(formData[f]) !== norm(originalValues[f]));
      const docsReplaced = !!(ninSlip || jambLetter);
      const ninChanged = hasLoadedRecord && norm(formData.nin) !== norm(originalValues.nin);

      // Free NIN-only update: submitted+paid students changing nothing but the NIN
      // are updated instantly without a new payment cycle.
      if (hasLoadedRecord && !otherFieldsChanged && !docsReplaced && ninChanged) {
        const ninVal = norm(formData.nin);
        if (!/^\d{11}$/.test(ninVal)) {
          toast.error('NIN must be exactly 11 digits.');
          setIsSubmitting(false);
          return;
        }
        try {
          await axios.put('/api/nysc/student/update-nin', { nin: ninVal });
          toast.success('NIN updated successfully. No payment was required.');
          setOriginalValues((prev: any) => ({ ...prev, nin: ninVal }));
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to update NIN');
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      if (hasLoadedRecord && !otherFieldsChanged && !docsReplaced && !ninChanged) {
        toast.info('No changes detected. Update your details or your NIN to proceed.');
        setIsSubmitting(false);
        return;
      }

      // Documents are only required when none exist on file yet (first-time submission)
      if ((!ninSlip && !existingDocs.nin) || (!jambLetter && !existingDocs.jamb)) {
        toast.error('NIN Slip and JAMB Admission Letter are required.');
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
        nin: formData.nin || '', // NIN number
        payment_amount: systemStatus.current_fee // Use dynamic payment amount from admin settings
      };

      // Use FormData for file uploads - only attach newly selected files;
      // the backend reuses existing documents when none are provided
      const dataToSend = new FormData();
      Object.keys(confirmData).forEach(key => {
        dataToSend.append(key, confirmData[key]);
      });
      if (ninSlip) {
        dataToSend.append('nin_slip', ninSlip);
      }
      if (jambLetter) {
        dataToSend.append('jamb_admission_letter', jambLetter);
      }

      // Call confirmDetails API to save data to database
      const response = await axios.post('/api/nysc/student/confirm', dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Store the form data temporarily in localStorage for use after payment
      localStorage.setItem('nysc_form_data', JSON.stringify(formData));

      const submissionData = response.data?.data;
      if (submissionData && submissionData.submission_token) {
        localStorage.setItem('nysc_submission_token', submissionData.submission_token);
        
        // Redirect to payment page with token and amount
        router.push(`/student/payment?token=${submissionData.submission_token}&amount=${submissionData.payment_amount}`);
      } else {
        router.push('/student/payment');
      }
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
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navbar />
        <Sidebar />
        <div className="flex">
          <main className="flex-1 min-w-0 ml-0 md:ml-64 p-4 md:p-8 pt-28 md:pt-32 pb-24 min-h-screen">
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
                          You have previously submitted your data. Your NIN can be updated for free — any other change
                          (or document replacement) requires a new payment.
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
                        Submitting new details or replacing a document requires payment. NIN-only updates are free. Please ensure all information is correct before proceeding to payment.
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
                          readOnly
                          className="bg-slate-100 cursor-not-allowed text-slate-600 font-mono"
                          title="Matriculation number cannot be changed"
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
                        <Label htmlFor="nin">NIN (11 digits) *</Label>
                        <Input
                          id="nin"
                          value={formData.nin || ''}
                          onChange={(e) => handleInputChange('nin', e.target.value)}
                          placeholder="e.g. 12345678901"
                          maxLength={11}
                          required
                        />
                      </div>
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
                        <Label htmlFor="graduation_year">Graduation Session *</Label>
                        <Select value={formData.graduation_year || ''} onValueChange={(val) => handleInputChange('graduation_year', val)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={sessions.length > 0 ? "Select session" : "Loading sessions..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {sessions.map((session: any) => (
                              <SelectItem key={session.id} value={session.session || session.session_name || session.name}>
                                {session.session || session.session_name || session.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 pt-4 border-t">
                      <div className="space-y-4">
                        <Label htmlFor="nin_slip" className="text-sm font-semibold">NIN Slip (PDF/Image, max 2MB) *</Label>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 w-full min-w-0">
                            <Input
                              id="nin_slip"
                              type="file"
                              accept=".pdf,image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const maxBytes = 2 * 1024 * 1024;
                                if (file.size > maxBytes) {
                                  toast.info('File exceeds 2MB limit. Auto-compressing to fit...');
                                  const compressed = await compressFileIfNeeded(file, maxBytes);
                                  const savedPercent = Math.round((1 - compressed.size / file.size) * 100);
                                  toast.success(`File compressed by ${savedPercent}% — ready to upload.`);
                                  setNinSlip(compressed);
                                  setNinPreview({
                                    url: URL.createObjectURL(compressed),
                                    isPdf: compressed.type === 'application/pdf'
                                  });
                                } else {
                                  setNinSlip(file);
                                  setNinPreview({
                                    url: URL.createObjectURL(file),
                                    isPdf: file.type === 'application/pdf'
                                  });
                                }
                              }}
                              className="flex-1 min-w-0 bg-white border-slate-300 text-slate-900 cursor-pointer file:cursor-pointer file:bg-indigo-50 file:text-indigo-700 file:border-0 file:rounded-md file:px-4 file:font-semibold hover:file:bg-indigo-100 transition-colors"
                              required={!existingDocs.nin}
                            />
                            {(ninSlip || existingDocs.nin) && <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />}
                          </div>

                          {ninPreview && (
                            <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center min-h-[120px]">
                              {ninPreview.isPdf ? (
                                <div className="flex flex-col items-center p-2">
                                  <svg className="w-12 h-12 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-sm font-medium text-slate-700">PDF Document Selected</span>
                                </div>
                              ) : (
                                <img src={ninPreview.url} alt="NIN Preview" className="max-h-48 rounded object-contain shadow-sm" />
                              )}
                            </div>
                          )}

                          {!ninPreview && existingDocs.nin && (
                            <div className="p-2 border border-emerald-200 rounded-lg bg-emerald-50 flex flex-col items-center justify-center min-h-[120px]">
                              {existingDocs.nin.isPdf ? (
                                <div className="flex flex-col items-center p-2">
                                  <CheckCircle className="w-12 h-12 text-emerald-600 mb-2" />
                                  <span className="text-sm font-medium text-slate-700">NIN Slip already on file (PDF)</span>
                                  <a href={existingDocs.nin.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 underline mt-1">View document</a>
                                </div>
                              ) : (
                                <>
                                  <img src={existingDocs.nin.url} alt="Uploaded NIN Slip" className="max-h-48 rounded object-contain shadow-sm" />
                                  <span className="text-xs text-emerald-700 mt-1">Currently uploaded — select a new file only to replace it</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <Label htmlFor="jamb_letter" className="text-sm font-semibold">JAMB Admission Letter (PDF/Image, max 2MB) *</Label>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 w-full min-w-0">
                            <Input
                              id="jamb_letter"
                              type="file"
                              accept=".pdf,image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const maxBytes = 2 * 1024 * 1024;
                                if (file.size > maxBytes) {
                                  toast.info('File exceeds 2MB limit. Auto-compressing to fit...');
                                  const compressed = await compressFileIfNeeded(file, maxBytes);
                                  const savedPercent = Math.round((1 - compressed.size / file.size) * 100);
                                  toast.success(`File compressed by ${savedPercent}% — ready to upload.`);
                                  setJambLetter(compressed);
                                  setJambPreview({
                                    url: URL.createObjectURL(compressed),
                                    isPdf: compressed.type === 'application/pdf'
                                  });
                                } else {
                                  setJambLetter(file);
                                  setJambPreview({
                                    url: URL.createObjectURL(file),
                                    isPdf: file.type === 'application/pdf'
                                  });
                                }
                              }}
                              className="flex-1 min-w-0 bg-white border-slate-300 text-slate-900 cursor-pointer file:cursor-pointer file:bg-indigo-50 file:text-indigo-700 file:border-0 file:rounded-md file:px-4 file:font-semibold hover:file:bg-indigo-100 transition-colors"
                              required={!existingDocs.jamb}
                            />
                            {(jambLetter || existingDocs.jamb) && <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />}
                          </div>

                          {jambPreview && (
                            <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center min-h-[120px]">
                              {jambPreview.isPdf ? (
                                <div className="flex flex-col items-center p-2">
                                  <svg className="w-12 h-12 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-sm font-medium text-slate-700">PDF Document Selected</span>
                                </div>
                              ) : (
                                <img src={jambPreview.url} alt="JAMB Preview" className="max-h-48 rounded object-contain shadow-sm" />
                              )}
                            </div>
                          )}

                          {!jambPreview && existingDocs.jamb && (
                            <div className="p-2 border border-emerald-200 rounded-lg bg-emerald-50 flex flex-col items-center justify-center min-h-[120px]">
                              {existingDocs.jamb.isPdf ? (
                                <div className="flex flex-col items-center p-2">
                                  <CheckCircle className="w-12 h-12 text-emerald-600 mb-2" />
                                  <span className="text-sm font-medium text-slate-700">JAMB Letter already on file (PDF)</span>
                                  <a href={existingDocs.jamb.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 underline mt-1">View document</a>
                                </div>
                              ) : (
                                <>
                                  <img src={existingDocs.jamb.url} alt="Uploaded JAMB Letter" className="max-h-48 rounded object-contain shadow-sm" />
                                  <span className="text-xs text-emerald-700 mt-1">Currently uploaded — select a new file only to replace it</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
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
                <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:space-x-4">
                  <Link href="/student" className="w-full sm:w-auto">
                    <Button type="button" variant="outline" className="w-full sm:w-auto">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
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
