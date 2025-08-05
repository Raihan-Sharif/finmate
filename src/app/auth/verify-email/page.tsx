'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get email from URL params or current user
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // Try to get current user email
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          setEmail(user.email);
        }
      });
    }

    // Check if user is already verified
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        toast.success('Email already verified!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      toast.error('No email address found');
      return;
    }

    try {
      setIsResending(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
        }
      });

      if (error) throw error;

      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      console.error('Error resending verification:', error);
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const signInWithDifferentEmail = () => {
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to your email address
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {email && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Verification email sent to:
                </p>
                <p className="font-medium text-gray-900 mt-1">{email}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What to do next:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check your email inbox</li>
                    <li>Look for an email from FinMate</li>
                    <li>Click the verification link in the email</li>
                    <li>You'll be automatically signed in</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Don't see the email?</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check your spam/junk folder</li>
                    <li>Wait a few minutes for delivery</li>
                    <li>Make sure the email address is correct</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={resendVerification}
                disabled={isResending || !email}
                className="w-full"
                variant="outline"
              >
                {isResending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Resend Verification Email
              </Button>

              <Button
                onClick={signInWithDifferentEmail}
                variant="ghost"
                className="w-full"
              >
                Sign in with a different email
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Having trouble? Contact support for help.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}