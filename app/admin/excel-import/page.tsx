'use client';

import ExcelImport from '../../../components/admin/ExcelImport';
import { PageHeader } from '../../../components/common/PageHeader';
import { FileSpreadsheet } from 'lucide-react';

export default function ExcelImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Excel Import"
        description="Import student NYSC data from CSV files"
        icon={<FileSpreadsheet className="h-6 w-6" />}
      />
      <ExcelImport />
    </div>
  );
}