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
import { CheckCircle, AlertCircle, Save, Lock, ClipboardCheck, Pencil, X } from 'lucide-react';

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
  missing?: boolean;
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
  { key: 'matric_no', label: 'Matric Number', type: 'text', alwaysReadOnly: true },
  { key: 'student_email', label: 'Email Address', type: 'email', alwaysReadOnly: true },
  { key: 'phone_number', label: 'Phone Number', type: 'tel', alwaysReadOnly: true },
  { key: 'first_name', label: 'First Name', type: 'text', alwaysReadOnly: true },
  { key: 'middle_name', label: 'Middle Name', type: 'text', alwaysReadOnly: true },
  { key: 'surname', label: 'Surname', type: 'text', alwaysReadOnly: true },
  { key: 'sex', label: 'Gender', type: 'select' },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { key: 'state', label: 'State', type: 'state' },
  { key: 'admission_date', label: 'Admission Date', type: 'date', hint: 'Enter the exact date shown on the admission letter issued to you by the school.' },
];

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  FIELD_CONFIG.map((config) => [config.key, config.label])
);

// Backend stores dates as Y-m-d; display them as dd/mm/yyyy.
function toDisplayValue(field: NerdField | undefined, config: FieldConfig): string {
  const value = field?.value ?? '';
  if (value === '') return '—';
  if (config.type === 'date' && /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(value)) {
    const [y, m, d] = value.split(/[-/.]/);
    return `${m}-${d}-${y}`;
  }
  return value;
}

// The HTML date input requires Y-m-d.
function toEditValue(field: NerdField | undefined, config: FieldConfig): string {
  const value = field?.value ?? '';
  if (config.type === 'date' && value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const m = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return value || '';
}

const NerdDetailsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<Record<string, NerdField>>({});
  const [missingCount, setMissingCount] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const [states, setStates] = useState<string[]>(NIGERIA_STATES);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
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
      setMissingFields(Array.isArray(data.missing_fields) ? data.missing_fields : []);
      setComplete(!!data.complete);
      setEditingKey(null);
      setEditValue('');
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

  const startEdit = (config: FieldConfig) => {
    setEditValue(toEditValue(fields[config.key], config));
    setEditingKey(config.key);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleSaveEdit = async () => {
    if (!editingKey) return;
    const value = (editValue ?? '').toString().trim();
    if (value === '') {
      toast.error('Value cannot be empty. Cancel to keep the current value.');
      return;
    }

    setSaving(true);
    try {
      const response = await studentService.updateNerdDetails({ [editingKey]: value });
      if (response.success) {
        toast.success(response.message || 'Field corrected successfully.');
        setMissingCount(response.data?.missing_count ?? 0);
        setMissingFields(Array.isArray(response.data?.missing_fields) ? response.data.missing_fields : []);
        setComplete(response.data?.complete ?? false);
        await fetchNerdDetails();
      } else {
        toast.error(response.message || 'Update failed');
      }
    } catch (error: any) {
      const errors = error?.response?.data?.errors;
      const msg = error?.response?.data?.message
        || (errors ? Object.values(errors).flat().join(', ') : 'Update failed. Please check the entered value.');
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

  const visibleFields = FIELD_CONFIG.filter((config) => fields[config.key]);

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
                  You can correct NIN, Gender, Date of Birth, State and Admission Date — one field at a time.
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
                      {complete ? 'Your nerd record is complete' : `${missingCount} field${missingCount === 1 ? ' is' : 's are'} missing: ${missingFields.map((key) => FIELD_LABELS[key] || key).join(', ')}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {complete
                        ? 'You may still correct any field below, one at a time.'
                        : 'Fields you edit must match your official records.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Your record */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Your Graduate Record
                  </CardTitle>
                  <CardDescription>
                    Correct one field at a time using the edit button. Saving a correction does not require any payment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visibleFields.map((config) => {
                    const field = fields[config.key];
                    const readOnly = config.alwaysReadOnly || !field?.editable;
                    const isEditing = editingKey === config.key;
                    const missing = field?.missing && !readOnly;

                    if (readOnly) {
                      return (
                        <div
                          key={config.key}
                          className="flex flex-col md:flex-row md:items-center justify-between gap-2 border rounded-lg p-3 bg-muted/40"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-medium">{config.label}</Label>
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{toDisplayValue(field, config)}</p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">Read-only</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={config.key}
                        className="border rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-medium">{config.label}</Label>
                              {missing && (
                                <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-600">
                                  Missing
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{toDisplayValue(field, config)}</p>
                          </div>
                          {!isEditing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(config)}
                              disabled={saving}
                            >
                              {missing ? 'Add' : 'Edit'}
                              <Pencil className="ml-2 h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        {isEditing && (
                          <div className="mt-3 space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor={`edit-${config.key}`}>New value</Label>
                              {config.type === 'select' ? (
                                <Select
                                  value={editValue}
                                  onValueChange={(val) => setEditValue(val)}
                                >
                                  <SelectTrigger id={`edit-${config.key}`}>
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
                                    id={`edit-${config.key}`}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    list="nigeria-states"
                                    placeholder="Select or type your state"
                                  />
                                  <datalist id="nigeria-states">
                                    {states.map((s) => (
                                      <option key={s} value={s} />
                                    ))}
                                  </datalist>
                                </>
                              ) : (
                                <Input
                                  id={`edit-${config.key}`}
                                  type={config.type === 'date' ? 'date' : config.type}
                                  inputMode={config.key === 'nin' ? 'numeric' : undefined}
                                  maxLength={config.key === 'nin' ? 11 : undefined}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  placeholder={config.placeholder}
                                />
                              )}
                            </div>
                            {config.hint && (
                              <Badge variant="outline" className="text-xs font-normal text-muted-foreground whitespace-normal h-auto py-1">
                                {config.hint}
                              </Badge>
                            )}
                            <div className="flex items-center gap-2">
                              <Button type="button" size="sm" onClick={handleSaveEdit} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Correction'}
                                <Save className="ml-2 h-4 w-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
                                Cancel
                                <X className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {visibleFields.length === 0 && (
                    <p className="text-sm text-muted-foreground">No record fields found.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default NerdDetailsPage;