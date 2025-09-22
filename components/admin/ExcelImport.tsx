'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import excelImportService from '@/services/excel-import.service';
import { EligibleImportRecord } from '@/types/admin.types';
import { toast } from '@/hooks/use-toast';

export default function ExcelImport() {
  const [records, setRecords] = useState<EligibleImportRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; errors: number } | null>(null);

  useEffect(() => {
    loadEligibleRecords();
  }, []);

  const loadEligibleRecords = async () => {
    setLoading(true);
    try {
      const { records } = await excelImportService.getEligibleRecords();
      setRecords(records);
    } catch (error) {
      console.error('Failed to load eligible records:', error);
      toast({
        title: 'Error',
        description: 'Failed to load eligible records from CSV files',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map((record) => record.matric_no));
    }
  };

  const toggleSelectRecord = (matricNo: string) => {
    if (selectedRecords.includes(matricNo)) {
      setSelectedRecords(selectedRecords.filter((id) => id !== matricNo));
    } else {
      setSelectedRecords([...selectedRecords, matricNo]);
    }
  };

  const importSelected = async () => {
    if (selectedRecords.length === 0) {
      toast({
        title: 'No Records Selected',
        description: 'Please select at least one record to import',
        variant: 'default',
      });
      return;
    }

    setImporting(true);
    try {
      console.log('Sending selected records for import:', selectedRecords);
      const result = await excelImportService.importSelectedRecords(selectedRecords);
      console.log('Import result:', result);
      setImportResult(result);
      toast({
        title: result.success ? 'Import Successful' : 'Import Completed with Errors',
        description: `Successfully imported ${result.imported} records. ${result.errors > 0 ? `Failed to import ${result.errors} records.` : ''}`,
        variant: result.success && result.errors === 0 ? 'default' : 'destructive',
      });
      // Refresh the list after import
      loadEligibleRecords();
    } catch (error) {
      console.error('Failed to import records:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred while importing records',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const importAll = async () => {
    if (records.length === 0) {
      toast({
        title: 'No Records Available',
        description: 'There are no eligible records to import',
        variant: 'default',
      });
      return;
    }

    setImporting(true);
    try {
      console.log('Importing all records, count:', records.length);
      const result = await excelImportService.importAllRecords();
      console.log('Import all result:', result);
      setImportResult(result);
      toast({
        title: result.success ? 'Import Successful' : 'Import Completed with Errors',
        description: `Successfully imported ${result.imported} records. ${result.errors > 0 ? `Failed to import ${result.errors} records.` : ''}`,
        variant: result.success && result.errors === 0 ? 'default' : 'destructive',
      });
      // Refresh the list after import
      loadEligibleRecords();
    } catch (error) {
      console.error('Failed to import all records:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred while importing all records',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Excel Import
        </CardTitle>
        <CardDescription>
          Import student NYSC data from CSV files. The system will scan both list.csv and response.csv files
          and display matching records that are not yet in the database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {importResult && (
          <Alert className={`mb-4 ${importResult.success && importResult.errors === 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
            {importResult.success && importResult.errors === 0 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
            <AlertTitle>
              {importResult.success && importResult.errors === 0
                ? 'Import Successful'
                : 'Import Completed with Some Issues'}
            </AlertTitle>
            <AlertDescription>
              Successfully imported {importResult.imported} records.
              {importResult.errors > 0 && ` Failed to import ${importResult.errors} records.`}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between mb-4">
          <Button
            variant="outline"
            onClick={loadEligibleRecords}
            disabled={loading || importing}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh List
          </Button>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={importSelected}
              disabled={selectedRecords.length === 0 || loading || importing}
            >
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Import Selected ({selectedRecords.length})
            </Button>
            <Button
              variant="default"
              onClick={importAll}
              disabled={records.length === 0 || loading || importing}
            >
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Import All ({records.length})
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading eligible records...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No eligible records found. All student data from CSV files has already been imported.
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRecords.length === records.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Matric Number</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Program</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.matric_no}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRecords.includes(record.matric_no)}
                        onCheckedChange={() => toggleSelectRecord(record.matric_no)}
                      />
                    </TableCell>
                    <TableCell>{record.matric_no}</TableCell>
                    <TableCell>{record.student_name}</TableCell>
                    <TableCell>{record.department || 'N/A'}</TableCell>
                    <TableCell>{record.level || 'N/A'}</TableCell>
                    <TableCell>{record.program || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}