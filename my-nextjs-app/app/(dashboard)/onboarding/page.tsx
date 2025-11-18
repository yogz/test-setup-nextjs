'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    sex: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill form with existing user data
  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        dateOfBirth: (session.user as any).dateOfBirth || '',
        sex: (session.user as any).sex || '',
        phone: (session.user as any).phone || '',
      });
    }
  }, [session]);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Update user profile with collected data via API route
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
          sex: formData.sex,
          phone: formData.phone,
          hasCompletedOnboarding: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Force a full page reload to refresh the session
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      alert('Failed to save your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedStep1 = formData.name.trim().length > 0;
  const canProceedStep2 = true; // Date of birth is now optional
  const canProceedStep3 = true; // Sex and phone are now optional

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6 sm:p-8">
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Step {step} of 3
            </span>
            <span className="text-xs sm:text-sm font-medium text-black">
              {Math.round((step / 3) * 100)}% Complete
            </span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </div>

        {/* Welcome Header */}
        <CardHeader className="p-0 mb-6 sm:mb-8">
          <CardTitle className="text-2xl sm:text-3xl text-center">
            Welcome to Upgrade Coaching!
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-center">
            Let's get to know you better to personalize your experience
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="onboarding-name">What's your name?</Label>
              <Input
                id="onboarding-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter your full name"
                autoFocus
                className="text-base sm:text-lg"
              />
            </div>
            <Button
              onClick={handleNext}
              disabled={!canProceedStep1}
              className="w-full"
              size="lg"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Date of Birth */}
        {step === 2 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="onboarding-dob">
                When were you born? <span className="text-gray-500 font-normal">(optional)</span>
              </Label>
              <Input
                id="onboarding-dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                autoFocus
                className="text-base sm:text-lg"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="secondary"
                className="flex-1"
                size="lg"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceedStep2}
                className="flex-1"
                size="lg"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Gender & Phone */}
        {step === 3 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="onboarding-sex">
                How do you identify? <span className="text-gray-500 font-normal">(optional)</span>
              </Label>
              <Select
                value={formData.sex}
                onValueChange={(value) =>
                  setFormData({ ...formData, sex: value })
                }
              >
                <SelectTrigger className="w-full text-base sm:text-lg">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboarding-phone">
                Phone number <span className="text-gray-500 font-normal">(optional)</span>
              </Label>
              <Input
                id="onboarding-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value;

                  // Allow user to enter any format, just ensure it starts with +
                  if (value.length === 0) {
                    setFormData({ ...formData, phone: '' });
                  } else if (value.startsWith('+')) {
                    // User is entering international format, allow it as-is
                    setFormData({ ...formData, phone: value });
                  } else if (value.startsWith('0') && value.replace(/\D/g, '').length <= 10) {
                    // French format starting with 0, auto-convert to +33
                    const digits = value.replace(/\D/g, '');
                    if (digits.startsWith('0')) {
                      const formatted = '+33 ' + digits.substring(1);
                      setFormData({ ...formData, phone: formatted });
                    } else {
                      setFormData({ ...formData, phone: value });
                    }
                  } else if (!value.includes('+')) {
                    // No + sign, add it
                    setFormData({ ...formData, phone: '+' + value });
                  } else {
                    setFormData({ ...formData, phone: value });
                  }
                }}
                placeholder="+33 6 12 34 56 78"
                className="text-base sm:text-lg"
              />
              <p className="mt-1 text-xs text-gray-500">International format (e.g., +33 6 12 34 56 78, +1 555 123 4567)</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="secondary"
                className="flex-1"
                size="lg"
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!canProceedStep3 || isSubmitting}
                className="flex-1"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 sm:h-5 sm:w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Skip for now option */}
        <div className="mt-4 sm:mt-6 text-center">
          <Button
            variant="link"
            onClick={async () => {
              // Mark onboarding as completed without filling data
              await fetch('/api/update-profile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  hasCompletedOnboarding: true,
                }),
              });
              window.location.href = '/dashboard';
            }}
            className="text-xs sm:text-sm"
          >
            Skip for now
          </Button>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
