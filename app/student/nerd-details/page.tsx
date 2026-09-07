'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import studentService from '@/services/student.service';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Save, Lock, ClipboardCheck } from 'lucide-react';

const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa-Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross-River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT-Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

interface AccessError {
  title: string;
  message: string;
}

interface NerdField {
  value: string | null;
  is_readonly: boolean;
  editable: boolean;
}

interface FieldConfig {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  hint?: string;
  alwaysReadOnly?: boolean;
}

const FIELD_CONFIG: FieldConfig[] = [
  { key: 'nin', label: 'NIN', type: 'text', placeholder: '11-digit NIN', hint: 'Your 11-digit National Identification Number.' },
  { key: 'matric_no', label: 'Matric Number', type: 'text', placeholder: 'e.g. VUG/SEN/22/8245' },
  { key: 'student_email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
  { key: 'phone_number', label: 'Phone Number', type: 'tel', placeholder: 'e.g. 09060019184' },
  { key: 'first_name', label: 'First Name', type: 'text' },
  { key: 'middle_name', label: 'Middle Name', type: 'text', alwaysReadOnly: true },
  { key: 'surname', label: 'Surname', type: 'text' },
  { key: 'sex', label: 'Gender', type: 'select' },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { key: 'state', label: 'State', type: 'state' },
  { key: 'admission_date', label: 'Admission Date', type: 'date', hint: 'Enter the exact date shown on the admission letter issued to you by the school.' },
];

const NerdDetailsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<Record<string, NerdField>>({});
  const [missingCount, setMissingCount] = useState(0);
  const [complete, setComplete] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [states, setStates] = useState<string[]>(NIGERIA_STATES);
  const [accessError, setAccessError] = useState<AccessError | null>(null);

  useEffect(() => {
    fetchNerdDetails();
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await studentService.getStates();
      if (Array.isArray(response.states) && response.states.length > 0) {
        setStates(response.states);
      }
    } catch (error) {
      console.error('Failed to load states:', error);
    }
  };

  const fetchNerdDetails = async () => {
    setLoading(true);
    setAccessError(null);
    try {
      const response = await studentService.getNerdDetails();
      const data = response.data;
      setFields(data.fields || {});
      setMissingCount(data.missing_count || 0);
      setComplete(!!data.complete);

      // Initialise the editable form fields (empty -> missing field to fill).
      const initial: Record<string, any> = {};
      Object.keys(data.fields || {}).forEach((key) => {
        const f = data.fields[key];
        if (f?.editable) {
          initial[key] = '';
        }
      });
      setFormData(initial);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        const code = error?.response?.data?.error_code;
        const message = error?.response?.data?.message || 'This page is not available to you.';
        setAccessError({
          title: code === 'nerd_feature_disabled'
            ? 'Nerd details update is disabled'
            : 'No nerd record found',
          message,
        });
        return;
      }
      toast.error('Failed to load nerd details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {};
    Object.keys(formData).forEach((key) => {
      const v = (formData[key] ?? '').toString().trim();
      if (v !== '') {
        payload[key] = v;
      }
    });

    if (Object.keys(payload).length === 0) {
      toast.info('No missing fields to update.');
      return;
    }

    setSaving(true);
    try {
      const response = await studentService.updateNerdDetails(payload);
      if (response.success) {
        toast.success(response.message || 'Nerd details updated successfully.');
        setMissingCount(response.data?.missing_count ?? 0);
        setComplete(response.data?.complete ?? false);
        await fetchNerdDetails();
      } else {
        toast.error(response.message || 'Update failed');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(', ')
        : 'Update failed. Please check the entered values.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen animate-fade-in">
        <LoadingSpinner size="xl" text="Loading nerd details..." className="animate-scale-in" />
      </div>
    );
  }

  if (accessError) {
    return (
      <ProtectedRoute userType="student">
        <div className="min-h-screen bg-background">
          <Navbar />
          <Sidebar />
          <div className="flex">
            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-28 md:pt-32 pb-24 min-h-screen">
              <div className="max-w-lg mx-auto">
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                  <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                    <Lock className="h-10 w-10 text-yellow-600" />
                    <h2 className="text-xl font-semibold">{accessError.title}</h2>
                    <p className="text-sm text-muted-foreground">{accessError.message}</p>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const readOnlyFields = FIELD_CONFIG.filter((f) => f.alwaysReadOnly || (fields[f.key] && !fields[f.key].editable));
  const editableFields = FIELD_CONFIG.filter((f) => !f.alwaysReadOnly && fields[f.key]?.editable);

  return (
    <ProtectedRoute userType="student">
      <div className="min-h-screen bg-background">
        <Navbar />
        <Sidebar />
        <div className="flex">
          <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-28 md:pt-32 pb-24 min-h-screen">
            <div className="space-y-6 animate-fade-in">
              {/* Header */}
              <div className="flex flex-col space-y-2 animate-fade-in-up">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 gradient-text">
                  <ClipboardCheck className="h-8 w-8 text-green-600 animate-bounce-in" />
                  Nerd Details
                </h1>
                <p className="text-muted-foreground animate-slide-in-right">
                  Verify and complete your graduate record. Only missing fields are editable.
                </p>
              </div>

              {/* Completion status */}
              <Card className={complete ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950'}>
                <CardContent className="flex items-center gap-3 p-4">
                  {complete ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">
                      {complete ? 'Your nerd record is complete' : `${missingCount} field${missingCount === 1 ? ' is' : 's are'} missing`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {complete
                        ? 'All required details are filled and cannot be edited.'
                        : 'Complete the missing fields below. Fields you edit must match your official records.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <form onSubmit={handleSubmit}>
                {/* Read-only fields */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Already Filled (Read-only)
                    </CardTitle>
                    <CardDescription>
                      These details are already stored and cannot be changed here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {readOnlyFields.map((config) => {
                      const field = fields[config.key];
                      const value = field?.value ?? '';
                      return (
                        <div key={config.key} className="space-y-2">
                          <Label htmlFor={`ro-${config.key}`}>{config.label}</Label>
                          <Input
                            id={`ro-${config.key}`}
                            value={value}
                            disabled
                            readOnly
                            className="bg-muted"
                          />
                        </div>
                      );
                    })}
                    {readOnlyFields.length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-full">
                        No pre-filled details found.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Editable (missing) fields */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5" />
                      Missing Details
                    </CardTitle>
                    <CardDescription>
                      Fill in the fields below that are missing from your record. This does not require any payment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {editableFields.map((config) => (
                      <div key={config.key} className="space-y-2">
                        <Label htmlFor={`ed-${config.key}`}>{config.label} {!['sex'].includes(config.key) && <span className="text-red-500">*</span>}</Label>
                        {config.type === 'select' ? (
                          <Select
                            value={formData[config.key] || ''}
                            onValueChange={(val) => handleChange(config.key, val)}
                          >
                            <SelectTrigger id={`ed-${config.key}`}>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : config.type === 'state' ? (
                          <>
                            <Input
                              id={`ed-${config.key}`}
                              value={formData[config.key] || ''}
                              onChange={(e) => handleChange(config.key, e.target.value)}
                              list="nigeria-states"
                              placeholder="Select or type your state"
                              required
                            />
                            <datalist id="nigeria-states">
                              {states.map((s) => (
                                <option key={s} value={s} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <Input
                            id={`ed-${config.key}`}
                            type={config.type === 'date' ? 'date' : config.type}
                            inputMode={config.key === 'nin' ? 'numeric' : undefined}
                            maxLength={config.key === 'nin' ? 11 : undefined}
                            value={formData[config.key] || ''}
                            onChange={(e) => handleChange(config.key, e.target.value)}
                            placeholder={config.placeholder}
                            required
                          />
                        )}
                        {config.hint && (
                          <Badge variant="outline" className="text-xs font-normal text-muted-foreground whitespace-normal h-auto py-1">
                            {config.hint}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {editableFields.length === 0 && (
                      <div className="col-span-full text-center py-6">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-muted-foreground">All details are complete. Nothing to update.</p>
                      </div>
                    )}
                  </CardContent>
                  {editableFields.length > 0 && (
                    <CardContent className="pt-0">
                      <Button type="submit" className="w-full md:w-auto" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Missing Details'}
                        <Save className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  )}
                </Card>
              </form>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default NerdDetailsPage;