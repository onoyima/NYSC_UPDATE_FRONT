'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, CheckCircle, XCircle, AlertCircle, Filter, Users } from 'lucide-react';

export interface ReviewData {
  student_id: number;
  matric_no: string;
  student_name: string;
  current_class_of_degree: string | null;
  proposed_class_of_degree: string;
  match_confidence: 'exact' | 'partial';
  needs_update: boolean;
  approved: boolean;
  source: string;
  row_number: number | null;
}

interface ImportReviewTableProps {
  data: ReviewData[];
  onApprovalChange: (matricNo: string, approved: boolean) => void;
  onBulkApproval: (approved: boolean) => void;
  isLoading?: boolean;
}

const ImportReviewTable: React.FC<ImportReviewTableProps> = ({
  data,
  onApprovalChange,
  onBulkApproval,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'needs_update' | 'approved' | 'rejected'>('all');

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.matric_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'needs_update':
        filtered = filtered.filter(item => item.needs_update);
        break;
      case 'approved':
        filtered = filtered.filter(item => item.approved);
        break;
      case 'rejected':
        filtered = filtered.filter(item => !item.approved && item.needs_update);
        break;
      default:
        break;
    }

    return filtered;
  }, [data, searchTerm, filterType]);

  // Statistics
  const stats = useMemo(() => {
    const total = data.length;
    const needsUpdate = data.filter(item => item.needs_update).length;
    const approved = data.filter(item => item.approved).length;
    const noUpdateNeeded = data.filter(item => !item.needs_update).length;

    return { total, needsUpdate, approved, noUpdateNeeded };
  }, [data]);

  const handleSelectAll = (checked: boolean) => {
    filteredData.forEach(item => {
      if (item.needs_update) {
        onApprovalChange(item.matric_no, checked);
      }
    });
  };

  const allFilteredApproved = filteredData.filter(item => item.needs_update).every(item => item.approved);
  const someFilteredApproved = filteredData.filter(item => item.needs_update).some(item => item.approved);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Update</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.needsUpdate}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Update Needed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.noUpdateNeeded}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Review Extracted Data</CardTitle>
          <CardDescription>
            Review and approve the Class of Degree updates for matched students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by matric number or student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All ({data.length})
              </Button>
              <Button
                variant={filterType === 'needs_update' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('needs_update')}
              >
                Needs Update ({stats.needsUpdate})
              </Button>
              <Button
                variant={filterType === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('approved')}
              >
                Approved ({stats.approved})
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {stats.needsUpdate > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={allFilteredApproved}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select all filtered records that need updates
                  {someFilteredApproved && !allFilteredApproved && (
                    <span className="text-xs text-gray-500 ml-1">(some selected)</span>
                  )}
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onBulkApproval(true)}
                  disabled={isLoading}
                >
                  Approve All Filtered
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onBulkApproval(false)}
                  disabled={isLoading}
                >
                  Reject All Filtered
                </Button>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Action</TableHead>
                  <TableHead>Matric No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Current Class</TableHead>
                  <TableHead>Proposed Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchTerm || filterType !== 'all' 
                        ? 'No records match your filters' 
                        : 'No data available'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.matric_no} className={item.approved ? 'bg-green-50' : ''}>
                      <TableCell>
                        {item.needs_update ? (
                          <Checkbox
                            checked={item.approved}
                            onCheckedChange={(checked) => 
                              onApprovalChange(item.matric_no, checked as boolean)
                            }
                            disabled={isLoading}
                          />
                        ) : (
                          <span title="No update needed">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.matric_no}</TableCell>
                      <TableCell className="font-medium">{item.student_name}</TableCell>
                      <TableCell>
                        {item.current_class_of_degree ? (
                          <Badge variant="outline">{item.current_class_of_degree}</Badge>
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.needs_update ? "default" : "secondary"}
                          className={item.needs_update ? "bg-blue-600" : ""}
                        >
                          {item.proposed_class_of_degree}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!item.needs_update ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            No Change
                          </Badge>
                        ) : item.approved ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.source}
                          </Badge>
                          {item.row_number && (
                            <span className="text-xs text-gray-500">
                              Row {item.row_number}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Alert */}
          {stats.approved > 0 && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {stats.approved} record{stats.approved !== 1 ? 's' : ''} approved for update. 
                Click &quot;Apply Updates&quot; to save changes to the database.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportReviewTable;