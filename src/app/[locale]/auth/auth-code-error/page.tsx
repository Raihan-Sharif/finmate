'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, Mail } from 'lucide-react';

export default function AuthCodeErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-900">Verification Failed</CardTitle>
            <CardDescription>
              There was an issue verifying your email address
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-800">
                <p className="font-medium mb-2">This could happen if:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>The verification link has expired</li>
                  <li>The link has already been used</li>
                  <li>The link was corrupted in your email</li>
                  <li>There was a temporary server issue</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/signup')}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                Try Signing Up Again
              </Button>

              <Button
                onClick={() => router.push('/auth/signin')}
                variant="outline"
                className="w-full"
              >
                Sign In Instead
              </Button>

              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}