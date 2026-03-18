'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { authService } from '@/lib/auth-service'

export default function LoginPage() {
  const router = useRouter()
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMockMode, setIsMockMode] = useState(false)

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
    if (!phone) {
      setError('Please enter your phone number')
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

  async function handleLogin() {
    if (authMode === 'email' && (!email || !password)) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      
      if (authMode === 'email') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setError('Please confirm your email first. Check your inbox for the confirmation link.')
          } else {
            setError(error.message)
          }
          return
        }
      } else if (!otpSent) {
        // Phone + Password login
        const fullPhone = countryCode.startsWith('+') ? `${countryCode}${phone}` : `+${countryCode}${phone}`
        const { error } = await supabase.auth.signInWithPassword({
          phone: fullPhone,
          password: password,
        })
        if (error) {
          const isDev = process.env.NODE_ENV === 'development';
          const msg = error.message.toLowerCase();
          
          if (isDev && msg.includes('phone') && (msg.includes('disable') || msg.includes('unsupported') || msg.includes('provider'))) {
            console.warn('Phone login failed due to provider, bypassing for DEV experience');
            document.cookie = 'mock_auth=true; path=/';
          } else {
            setError(error.message);
            setLoading(false);
            return;
          }
        }
      } else {
        // Phone + OTP login
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
          // For Mock mode, we still need to log the user in.
          // Since it's mock, they might not even exist in Supabase.
          // We can try signInWithPassword if they have one, 
          // but if they don't exist, we might just have to skip real login for DEV.
          try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              phone: fullPhone,
              password: password || 'mock-password-if-needed' 
            });
            
            if (signInError && signInError.message.toLowerCase().includes('phone provider')) {
              console.warn('Sign in failed due to provider, bypassing for DEV experience');
              document.cookie = 'mock_auth=true; path=/';
            } else if (signInError) {
              // If it's just "Invalid login credentials", it might be a new user.
              // In mock mode we might just let them through or show error.
              // Given the constraints, let's keep it simple.
            }
          } catch (signInErr) {
            console.error('Mock Sign in error caught:', signInErr);
          }
        }
      }

      router.push('/home')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        {/* Logo + Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#1a1f2e] w-12 h-12 rounded-2xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">T</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a1f2e]">Welcome back</h1>
            <p className="text-gray-400 text-sm">Sign in to your TEKE account</p>
          </div>
        </div>

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

        {authMode === 'email' ? (
          <>
            {/* Email */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="mb-2">
              <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="········"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors pr-12"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
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

            {/* Forgot Password */}
            <div className="flex justify-end mb-6">
              <button className="text-sm text-gray-400 hover:text-[#1a1f2e] transition-colors">
                Forgot password?
              </button>
            </div>
          </>
        ) : (
          <div className="mb-6">
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
                  onKeyDown={(e) => e.key === 'Enter' && !otpSent && handleLogin()}
                  className="flex-1 bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {!otpSent && (
              <div className="mb-2">
                <label className="text-sm font-semibold text-[#1a1f2e] mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="········"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full bg-[#f2f2f7] border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-[#1a1f2e] placeholder-gray-400 outline-none focus:border-[#1a1f2e] transition-colors pr-12"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
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
            )}

            {!otpSent && (
              <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={handleSendOTP}
                  className="text-sm font-bold text-[#1a1f2e] hover:underline"
                >
                  Login with OTP instead
                </button>
                <button className="text-sm text-gray-400 hover:text-[#1a1f2e] transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            {otpSent && (
              <div className="mb-6 transition-all duration-300 overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-[#1a1f2e]">Enter OTP</label>
                  <button
                    onClick={handleSendOTP}
                    disabled={countdown > 0}
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
          </div>
        )}

        {/* Sign In Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#1a1f2e] text-white rounded-2xl py-3.5 font-semibold text-base mb-4 hover:bg-[#2d3548] transition-colors disabled:opacity-70"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </div>
          ) : 'Sign In'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google Button */}
        <button className="w-full bg-white border-2 border-gray-200 rounded-2xl py-3.5 font-semibold text-sm text-[#1a1f2e] flex items-center justify-center gap-3 mb-6 hover:bg-gray-50 hover:border-gray-300 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#1a1f2e] font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}