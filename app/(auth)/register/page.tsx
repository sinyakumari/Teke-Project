'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { authService } from '@/lib/auth-service'

export default function RegisterPage() {
  const router = useRouter()
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [isMockMode, setIsMockMode] = useState(false)

  const isFormValid = name && (authMode === 'email' ? (email && password && confirmPassword) : (phone && password && confirmPassword)) && agreedToTerms

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1]
    if (value && !/^\d+$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  async function handleSendOTP() {
    if (!name || !phone) {
      setError('Please enter your name and phone number')
      return;
    }
    setLoading(true)
    setError('')
    try {
      const fullPhone = `${countryCode}${phone}`.startsWith('+') 
        ? `${countryCode}${phone}` 
        : `+${countryCode}${phone}`;
        
      const response = await authService.sendOtp(fullPhone);
      
      if (!response.success) {
        setError(response.error || 'Failed to send OTP')
        return;
      }

      if (response.mockMode) {
        setIsMockMode(true);
      } else {
        setIsMockMode(false);
      }
      
      setOtpSent(true)
      setCountdown(60)
    } catch {
      setError('Failed to send OTP. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister() {
    if (!isFormValid) return
    
    if (authMode === 'email') {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
    }

    setLoading(true)
    setError('')
    
    try {
      const supabase = createClient()
      
      if (authMode === 'email') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        })
        if (error) {
          setError(error.message)
          return
        }
        setRegistered(true)
      } else {
        // Phone Auth Verification
        const otpCode = otp.join('')
        if (otpCode.length < 6) {
          setError('Please enter a valid 6-digit OTP')
          setLoading(false)
          return
        }

        const fullPhone = `${countryCode}${phone}`.startsWith('+') 
          ? `${countryCode}${phone}` 
          : `+${countryCode}${phone}`;

        const response = await authService.verifyOtp(fullPhone, otpCode, isMockMode);

        if (!response.success) {
          setError(response.error || 'Invalid OTP')
          setLoading(false)
          return
        }

        // Mock verification handled successfully
        if (response.mockMode) {
          console.log('Mock OTP Verified successfully (Developing Mode)');
          // For Mock mode, we still try to create the user in Supabase if possible, 
          // but if provider is missing, we might just have to skip real signup 
          // or use a temporary workaround if needed. 
          // For now, let's try to register them with signUp if it's mock.
          try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              phone: fullPhone,
              password: password,
              options: { data: { name } }
            });
            
            // If it fails because of phone provider, we ignore it in DEV and just "pretend" login
            // If it fails because of phone provider being disabled, we ignore it in DEV and just "pretend" register
            const msg = signUpError?.message?.toLowerCase();
            if (msg && (msg.includes('phone') && (msg.includes('disable') || msg.includes('unsupported') || msg.includes('provider')))) {
              console.warn('Sign up failed due to provider, bypassing for DEV experience');
              document.cookie = 'mock_auth=true; path=/';
            } else if (signUpError) {
              setError(signUpError.message);
              return;
            }
          } catch (signUpErr) {
            console.error('Mock Sign up error caught:', signUpErr);
          }
          
          router.push('/home')
          router.refresh()
        } else if (response.data?.user) {
          // Real verification success
          // Update name since signInWithOtp doesn't set metadata during verification for new users easily
          await supabase.auth.updateUser({
            password: password,
            data: { name }
          })
          router.push('/home')
          router.refresh()
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1a1f2e] mb-2">Check your email!</h1>
          <p className="text-gray-500 text-sm mb-8">
            We sent a confirmation link to{' '}
            <span className="font-semibold text-[#1a1f2e]">{email}</span>.
            {' '}Please confirm your email before logging in.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-[#1a1f2e] text-white rounded-2xl py-3.5 font-semibold text-base hover:bg-[#2d3548] transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        {/* Back + Title */}
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center mb-6 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1a1f2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <h1 className="text-2xl font-bold text-[#1a1f2e] mb-1">Create account</h1>
        <p className="text-gray-400 text-sm mb-6">Start tracking your training journey</p>

        {/* Toggle */}
        <div className="bg-[#f2f2f7] p-1 rounded-2xl flex mb-6">
          <button
            onClick={() => {
              setAuthMode('email')
              setError('')
              setOtpSent(false)
              setOtp(['', '', '', '', '', ''])
              setIsMockMode(false)
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              authMode === 'email' ? 'bg-white text-[#1a1f2e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => {
              setAuthMode('phone')
              setError('')
              setIsMockMode(false)
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              authMode === 'phone' ? 'bg-white text-[#1a1f2e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Phone
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Full name</label>
          <input
            type="text"
            placeholder="Rahul Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors"
          />
        </div>

        {authMode === 'email' ? (
          <>
            <div className="mb-4">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors"
              />
            </div>

            <div className="mb-4">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="········"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors pr-12"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M1 1l22 22" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9ca3af" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="········"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors pr-12"
                />
                <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M1 1l22 22" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9ca3af" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Phone number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={otpSent}
                  className="w-16 bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-2 py-3 text-sm text-[#1a1f2e] text-center outline-none focus:border-[#1a1f2e] transition-colors disabled:opacity-50"
                />
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  disabled={otpSent}
                  className="flex-1 bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors disabled:opacity-50"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-2 ml-1">
                We&apos;ll send a 6-digit code via SMS to verify your number.
              </p>
            </div>

            <div className="mb-4">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="········"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={otpSent}
                  className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors pr-12 disabled:opacity-50"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M1 1l22 22" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9ca3af" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="········"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={otpSent}
                  className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors pr-12 disabled:opacity-50"
                />
                <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M1 1l22 22" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9ca3af" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {otpSent && (
              <div className="mb-6 transition-all duration-300 overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-[#1a1f2e]">Enter OTP</label>
                  <button
                    onClick={handleSendOTP}
                    disabled={countdown > 0 || loading}
                    className="text-xs font-bold text-[#1a1f2e] hover:underline disabled:text-gray-400"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
                {isMockMode && (
                  <p className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded inline-block mb-2">
                    Development Mode: Use 123456 for testing
                  </p>
                )}
                <div className="flex gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-full aspect-square bg-[#f2f2f7] border-2 border-transparent rounded-xl text-center text-lg font-bold text-[#1a1f2e] focus:border-[#1a1f2e] outline-none transition-colors"
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Terms */}
        <div className="flex items-start gap-3 mb-6">
          <button
            onClick={() => setAgreedToTerms(!agreedToTerms)}
            className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
              agreedToTerms ? 'bg-[#1a1f2e] border-[#1a1f2e]' : 'border-gray-300 bg-white'
            }`}
          >
            {agreedToTerms && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <p className="text-sm text-gray-500">
            I agree to the{' '}
            <span className="underline text-[#1a1f2e] font-medium cursor-pointer">Terms of Service</span>
            {' '}and{' '}
            <span className="underline text-[#1a1f2e] font-medium cursor-pointer">Privacy Policy</span>
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={authMode === 'phone' && !otpSent ? handleSendOTP : handleRegister}
          disabled={!isFormValid || loading}
          className={`w-full rounded-2xl py-3.5 font-semibold text-base mb-4 transition-colors ${
            isFormValid && !loading
              ? 'bg-[#1a1f2e] text-white hover:bg-[#2d3548]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {authMode === 'phone' && !otpSent ? 'Sending OTP...' : 'Verifying...'}
            </div>
          ) : (
            authMode === 'phone' 
              ? (otpSent ? 'Verify & Create Account' : 'Send OTP') 
              : 'Create Account'
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google */}
        <button className="w-full bg-white border-2 border-gray-200 rounded-2xl py-3.5 font-semibold text-sm text-[#1a1f2e] flex items-center justify-center gap-3 mb-6 hover:bg-gray-50 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-[#1a1f2e] font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}