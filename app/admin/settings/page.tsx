'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import adminService from '@/services/admin.service';
import { adminSettingsService, AdminSettings } from '@/services/admin-settings.service';
import { toast } from 'sonner';
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  DollarSign,
  Calendar,
  Mail,
  Shield,
  Database,
  Upload,
  Download,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface MaintenanceSettings {
  maintenance_mode: boolean;
}

interface PaymentSettings {
  payment_amount: number;
  payment_deadline: string;
  countdown_title: string;
  countdown_message: string;
  system_open: boolean;
  late_payment_fee: number;
}

const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('payment');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [systemResponse, paymentResponse] = await Promise.all([
        adminService.getSystemSettings(),
        adminSettingsService.getSettings()
      ]);
      setMaintenanceSettings({ maintenance_mode: systemResponse.data?.maintenance_mode || false });
      setPaymentSettings(paymentResponse);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveMaintenanceSettings = async () => {
    if (!maintenanceSettings) return;
    
    try {
      setIsSaving(true);
      await adminService.updateSystemSettings(maintenanceSettings);
      toast.success('Maintenance settings saved successfully!');
      // Refresh settings to ensure sync
      await fetchSettings();
    } catch (error: any) {
      console.error('Maintenance settings save error:', error);
      if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        toast.error(`Validation failed: ${errorMessages.join(', ')}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to save maintenance settings');
      }
    } finally {
      setIsSaving(false);
    }
  };



  const savePaymentSettings = async () => {
    if (!paymentSettings) return;
    
    // Validate required fields
    if (!paymentSettings.payment_amount || paymentSettings.payment_amount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }
    
    if (!paymentSettings.payment_deadline) {
      toast.error('Payment deadline is required');
      return;
    }
    
    // Check if deadline is in the future
    const deadline = new Date(paymentSettings.payment_deadline);
    const now = new Date();
    if (deadline <= now) {
      toast.error('Payment deadline must be in the future');
      return;
    }
    
    try {
      setIsSaving(true);
      // Use the general updateSettings endpoint for payment settings
      await adminSettingsService.updateSettings(paymentSettings);
      toast.success('Payment settings saved successfully!');
      // Refresh settings to ensure sync
      await fetchSettings();
    } catch (error: any) {
      console.error('Payment settings save error:', error);
      if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        toast.error(`Validation failed: ${errorMessages.join(', ')}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to save payment settings');
      }
    } finally {
      setIsSaving(false);
    }
  };



  const clearCache = async () => {
    try {
      await adminService.clearCache();
      toast.success('System cache cleared successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to clear cache');
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file to upload');
      return;
    }

    // Validate file type
    if (!csvFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a valid CSV file');
      return;
    }

    // Validate file size (10MB max)
    if (csvFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const response = await adminService.uploadCsv(csvFile);
      
      if (response.success) {
        toast.success(response.message);
        
        if (response.statistics) {
          const { success_count, error_count, errors } = response.statistics;
          
          // Show detailed results
          if (success_count > 0) {
            toast.success(`Successfully processed ${success_count} student records`);
          }
          
          if (error_count > 0) {
            toast.warning(`${error_count} records had errors. Check details below.`);
            console.log('Upload errors:', errors);
            
            // Show first few errors to user
            if (errors && errors.length > 0) {
              const errorMessage = errors.slice(0, 3).join('\n');
              toast.error(`First few errors:\n${errorMessage}`);
            }
          }
        }
      } else {
        toast.error(response.message || 'Upload failed');
      }

      setCsvFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('CSV Upload Error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload CSV file');
    } finally {
      setIsUploading(false);
    }
  };







  const downloadCsvTemplate = async () => {
    try {
      const blob = await adminService.downloadCsvTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'student_import_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('CSV template downloaded successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to download CSV template');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('Please select a valid CSV file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setCsvFile(file);
    }
  };

  const updateMaintenanceSetting = (key: keyof MaintenanceSettings, value: any) => {
    if (maintenanceSettings) {
      setMaintenanceSettings({ ...maintenanceSettings, [key]: value });
    }
  };



  const updatePaymentSetting = (key: keyof PaymentSettings, value: any) => {
    if (paymentSettings) {
      setPaymentSettings({ ...paymentSettings, [key]: value });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen animate-fade-in">
        <LoadingSpinner
          size="xl"
          text="Loading settings..."
          className="animate-scale-in"
        />
      </div>
    );
  }

  return (
    <ProtectedRoute userType="admin">
      <div className="min-h-screen bg-background">
        {/* Fixed Sidebar */}
        <Sidebar />

        {/* Navbar */}
        <Navbar userType="admin" />

        {/* Main Content */}
        <main className="ml-0 md:ml-64 overflow-y-auto h-screen pt-28 md:pt-32 pb-24 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">System Settings</h1>
                  <p className="text-muted-foreground">
                    Configure system-wide settings and preferences.
                  </p>
                </div>
                <Link href="/admin">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </Link>
              </div>

              {/* Settings Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                </TabsList>



                {/* Payment Settings */}
                <TabsContent value="payment" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Payment Configuration
                      </CardTitle>
                      <CardDescription>
                        Configure payment amounts, deadlines, and countdown messages.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="payment_amount">Payment Amount (₦)</Label>
                          <Input
                            id="payment_amount"
                            type="number"
                            value={paymentSettings?.payment_amount || 0}
                            onChange={(e) => updatePaymentSetting('payment_amount', parseFloat(e.target.value))}
                            placeholder="Enter payment amount"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="late_payment_fee">Late Payment Fee (₦)</Label>
                          <Input
                            id="late_payment_fee"
                            type="number"
                            value={paymentSettings?.late_payment_fee || 0}
                            onChange={(e) => updatePaymentSetting('late_payment_fee', parseFloat(e.target.value))}
                            placeholder="Enter late payment fee"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payment_deadline">Payment Deadline</Label>
                          <Input
                            id="payment_deadline"
                            type="datetime-local"
                            value={paymentSettings?.payment_deadline ? new Date(paymentSettings.payment_deadline).toISOString().slice(0, 16) : ''}
                            onChange={(e) => updatePaymentSetting('payment_deadline', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="countdown_title">Countdown Title</Label>
                        <Input
                          id="countdown_title"
                          value={paymentSettings?.countdown_title || ''}
                          onChange={(e) => updatePaymentSetting('countdown_title', e.target.value)}
                          placeholder="Update Deadline"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="countdown_message">Countdown Message</Label>
                        <Textarea
                          id="countdown_message"
                          value={paymentSettings?.countdown_message || ''}
                          onChange={(e) => updatePaymentSetting('countdown_message', e.target.value)}
                          placeholder="Complete your Info Update before the deadline"
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>System Open for Payments</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow students to make payments
                          </p>
                        </div>
                        <Switch
                          checked={paymentSettings?.system_open || false}
                          onCheckedChange={(checked) => updatePaymentSetting('system_open', checked)}
                        />
                      </div>

                      <Button onClick={savePaymentSettings} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>



                {/* Maintenance Settings */}
                <TabsContent value="maintenance" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        System Maintenance
                      </CardTitle>
                      <CardDescription>
                        System maintenance and administrative tools.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Maintenance Mode</Label>
                          <p className="text-sm text-muted-foreground">
                            Enable maintenance mode to prevent user access
                          </p>
                        </div>
                        <Switch
                          checked={maintenanceSettings?.maintenance_mode || false}
                          onCheckedChange={(checked) => updateMaintenanceSetting('maintenance_mode', checked)}
                        />
                      </div>

                      {maintenanceSettings?.maintenance_mode && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Warning:</strong> Maintenance mode is enabled. Users will not be able to access the system.
                          </AlertDescription>
                        </Alert>
                      )}

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">System Tools</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                Clear Cache
                              </CardTitle>
                              <CardDescription>
                                Clear system cache to improve performance
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Button variant="outline" onClick={clearCache}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Clear Cache
                              </Button>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Student NYSC Data Import
                              </CardTitle>
                              <CardDescription>
                                Upload CSV file to import student data into NYSC system. Students must already exist in the main database.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="csv-file">Select CSV File (Max 10MB)</Label>
                                <Input
                                  id="csv-file"
                                  type="file"
                                  accept=".csv"
                                  onChange={handleFileChange}
                                  disabled={isUploading}
                                />
                                {csvFile && (
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                      Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                                    </p>
                                    {csvFile.size > 10 * 1024 * 1024 && (
                                      <p className="text-sm text-red-600">
                                        File too large! Maximum size is 10MB.
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="bg-blue-50 p-3 rounded-md">
                                <p className="text-sm text-blue-800">
                                  <strong>Note:</strong> This will create/update records in the student_nysc table. 
                                  Make sure matric numbers match existing students in the system.
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={downloadCsvTemplate}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Template
                                </Button>
                                <Button
                                  onClick={handleCsvUpload}
                                  disabled={!csvFile || isUploading || (csvFile && csvFile.size > 10 * 1024 * 1024)}
                                  size="sm"
                                >
                                  {isUploading ? (
                                    <>
                                      <LoadingSpinner size="sm" className="mr-2" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="mr-2 h-4 w-4" />
                                      Upload to NYSC
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <Button onClick={saveMaintenanceSettings} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminSettingsPage;