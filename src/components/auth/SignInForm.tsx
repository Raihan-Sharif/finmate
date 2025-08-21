'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Github, Loader2, Mail, Wallet } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface SignInForm {
  email: string;
  password: string;
}

export default function SignInForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const { signIn, signInWithOAuth, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>();

  const onSubmit = async (data: SignInForm) => {
    try {
      setError(null);
      await signIn(data.email, data.password);
      router.push(redirectTo);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    }
  };

  const handleProviderSignIn = async (provider: 'google' | 'github') => {
    try {
      setError(null);
      await signInWithOAuth(provider);
    } catch (error: any) {
      setError(error.message || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">FinMate</span>
            </div>
            <CardTitle className="text-2xl font-bold">{t('welcomeBack')}</CardTitle>
            <CardDescription>
              {t('enterCredentials')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('enterEmail')}
                    className="pl-10"
                    {...register('email', {
                      required: t('emailRequired'),
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: t('invalidEmail'),
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('enterPassword')}
                    className="pr-10"
                    {...register('password', {
                      required: t('passwordRequired'),
                      minLength: {
                        value: 6,
                        message: t('passwordMinLength'),
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isSubmitting || loading}
              >
                {isSubmitting || loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('signingIn')}
                  </>
                ) : (
                  t('signIn')
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  {t('orContinueWith')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleProviderSignIn('google')}
                disabled={loading}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Mail className="mr-2 h-4 w-4" />
                {t('google')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleProviderSignIn('github')}
                disabled={loading}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Github className="mr-2 h-4 w-4" />
                {t('github')}
              </Button>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('dontHaveAccount')} </span>
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                {t('signUp')}
              </Link>
            </div>

            <div className="flex items-center justify-between">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                {t('backToHome')}
              </Link>
              <LanguageSwitcher variant="minimal" size="sm" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}