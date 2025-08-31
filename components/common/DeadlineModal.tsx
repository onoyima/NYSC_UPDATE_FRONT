'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import Link from 'next/link';

interface DeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  deadline: string;
  currentFee: number;
  isLate: boolean;
  isDataConfirmed: boolean;
}

const DeadlineModal: React.FC<DeadlineModalProps> = ({
  isOpen,
  onClose,
  deadline,
  currentFee,
  isLate,
  isDataConfirmed
}) => {
  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = () => {
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return 'Deadline has passed';

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} and ${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLate ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : isDataConfirmed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-orange-600" />
            )}
            {isDataConfirmed ? 'Data Confirmed' : 'Data Confirmation Required'}
          </DialogTitle>
          <DialogDescription className="space-y-3">
            {isDataConfirmed ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-green-700 font-medium">
                  Your data has been confirmed and submitted successfully!
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  You can view your updated information in your profile.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center py-2">
                  <p className="font-medium text-foreground">
                    Please confirm your data before the deadline
                  </p>
                </div>
                
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Deadline:</span>
                    <span className="text-sm">{formatDeadline(deadline)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Time Remaining:</span>
                    <Badge variant={isLate ? 'destructive' : 'default'} className="text-xs">
                      {getTimeRemaining()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Current Fee:</span>
                    <span className="text-sm font-bold">{formatCurrency(currentFee)}</span>
                  </div>
                </div>

                {isLate && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Late fee is now applicable
                    </p>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  Review and confirm your personal information to proceed with payment and complete your registration.
                </p>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            {isDataConfirmed ? 'Close' : 'Already Confirmed'}
          </Button>
          {!isDataConfirmed && (
            <Link href="/student/confirm" className="w-full sm:w-auto">
              <Button className="w-full">
                Confirm Data Now
              </Button>
            </Link>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeadlineModal;