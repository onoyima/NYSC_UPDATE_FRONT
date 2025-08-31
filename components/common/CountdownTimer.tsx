'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface CountdownTimerProps {
  deadline: string;
  standardFee: number;
  lateFee: number;
  className?: string;
  title?: string;
  message?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  deadline,
  standardFee,
  lateFee,
  className = '',
  title = 'Payment Information',
  message
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLate, setIsLate] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference > 0) {
        setIsLate(false);
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setIsLate(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  const currentFee = isLate ? lateFee : standardFee;
  const feeType = isLate ? 'Late Fee' : 'Standard Fee';

  return (
    <Card className={`${className} ${isLate ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isLate ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : (
            <Clock className="h-5 w-5 text-green-600" />
          )}
          {title}
        </CardTitle>
        <CardDescription>
          {message || (isLate ? 'Payment deadline has passed' : 'Time remaining for standard fee')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Fee Display */}
        <div className="text-center p-4 rounded-lg border">
          <div className="text-2xl font-bold mb-2">
            {formatCurrency(currentFee)}
          </div>
          <Badge variant={isLate ? 'destructive' : 'default'}>
            {feeType}
          </Badge>
        </div>

        {/* Countdown Display */}
        {!isLate ? (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded bg-background border">
              <div className="text-lg font-bold">{timeLeft.days}</div>
              <div className="text-xs text-muted-foreground">Days</div>
            </div>
            <div className="p-2 rounded bg-background border">
              <div className="text-lg font-bold">{timeLeft.hours}</div>
              <div className="text-xs text-muted-foreground">Hours</div>
            </div>
            <div className="p-2 rounded bg-background border">
              <div className="text-lg font-bold">{timeLeft.minutes}</div>
              <div className="text-xs text-muted-foreground">Minutes</div>
            </div>
            <div className="p-2 rounded bg-background border">
              <div className="text-lg font-bold">{timeLeft.seconds}</div>
              <div className="text-xs text-muted-foreground">Seconds</div>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <p className="text-red-700 dark:text-red-300 font-medium">
              Payment deadline has passed. Late fee now applies.
            </p>
          </div>
        )}

        {/* Fee Comparison */}
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Standard Fee:</span>
            <span>{formatCurrency(standardFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Late Fee:</span>
            <span>{formatCurrency(lateFee)}</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span>Deadline:</span>
            <span>{new Date(deadline).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CountdownTimer;