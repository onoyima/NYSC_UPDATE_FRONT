'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/utils/axios';
import { 
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  MapPinIcon,
  DocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface TempSubmission {
  id: number;
  student_id: number;
  fname: string;
  lname: string;
  mname: string;
  matric_no: string;
  email: string;
  phone: string;
  department: string;
  faculty: string;
  gender: string;
  dob: string;
  marital_status: string;
  state: string;
  lga: string;
  cgpa: string;
  graduation_year: string;
  jamb_no: string;
  course_study: string;
  submission_status: string;
  updated_at: string;
  created_at: string;
}

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<TempSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axios.get(`/api/nysc/admin/submissions?limit=1000`);
        const found = res.data.submissions.find((s: any) => s.id === Number(id));
        if (found) {
          setSubmission(found);
        } else {
          toast.error('Submission not found');
        }
      } catch (error) {
        toast.error('Failed to load submission detail');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleAction = async (status: string) => {
    try {
      // Note: Assuming there's a status update endpoint, if not we'd need to implement it.
      // For now we just show a toast as a placeholder if endpoint doesn't exist yet.
      // await axios.post(`/api/nysc/admin/submissions/${id}/status`, { status });
      toast.info(`Status update to ${status} is coming soon!`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!submission) return <div className="p-20 text-center underline cursor-pointer" onClick={() => router.back()}>Back to list</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="mb-6 flex items-center text-slate-600 hover:text-indigo-600 transition-colors font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Submissions
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">{submission.fname} {submission.mname} {submission.lname}</h1>
                <p className="text-indigo-100 mt-1 font-mono tracking-widest">{submission.matric_no}</p>
              </div>
              <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest">
                {submission.submission_status}
              </span>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Personal Info */}
            <section className="space-y-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center">
                <UserIcon className="w-4 h-4 mr-2" /> Personal Information
              </h2>
              <div className="space-y-4">
                <InfoRow label="Gender" value={submission.gender} />
                <InfoRow label="Date of Birth" value={submission.dob} />
                <InfoRow label="Marital Status" value={submission.marital_status} />
                <InfoRow label="State of Origin" value={submission.state} />
                <InfoRow label="LGA" value={submission.lga} />
              </div>
            </section>

            {/* Contact Info */}
            <section className="space-y-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center">
                <PhoneIcon className="w-4 h-4 mr-2" /> Contact details
              </h2>
              <div className="space-y-4">
                <InfoRow icon={<EnvelopeIcon className="w-4 h-4" />} label="Email" value={submission.email} />
                <InfoRow icon={<PhoneIcon className="w-4 h-4" />} label="Phone" value={submission.phone} />
              </div>

               <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center mt-10">
                <AcademicCapIcon className="w-4 h-4 mr-2" /> Academic Info
              </h2>
              <div className="space-y-4">
                <InfoRow label="Department" value={submission.department} />
                <InfoRow label="Course" value={submission.course_study} />
                <InfoRow label="CGPA" value={submission.cgpa} />
                <InfoRow label="Grad Year" value={submission.graduation_year} />
                <InfoRow label="JAMB No" value={submission.jamb_no} />
              </div>
            </section>
          </div>

          <div className="bg-slate-50 p-8 border-t border-slate-100 flex justify-between items-center">
             <div className="flex items-center text-slate-400 text-xs">
                <ClockIcon className="w-4 h-4 mr-1" />
                Submitted: {new Date(submission.created_at).toLocaleString()}
             </div>
             <div className="flex space-x-3">
                <button onClick={() => handleAction('rejected')} className="px-6 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors font-bold text-sm">Reject</button>
                <button onClick={() => handleAction('approved')} className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-shadow shadow-lg font-bold text-sm">Approve Submission</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-50">
      <div className="flex items-center text-slate-500 text-sm">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </div>
      <div className="text-slate-900 font-semibold text-sm">{value || 'N/A'}</div>
    </div>
  );
}
