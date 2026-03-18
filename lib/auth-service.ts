import { createClient } from './supabase'

/**
 * Auth Service to handle Phone OTP Send/Verify with Fallback to Mock Mode in Development.
 */
export const authService = {
  /**
   * Send OTP to a phone number.
   * If SMS provider is not configured, it will return a specific flag to trigger mock mode in UI.
   */
  async sendOtp(phone: string) {
    const isDev = process.env.NODE_ENV === 'development';
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) {
        // Detect missing or disabled SMS provider
        const msg = error.message.toLowerCase();
        if (msg.includes('phone') && (
            msg.includes('unsupported') || 
            msg.includes('disable') || 
            msg.includes('not enabled') ||
            msg.includes('provider')
        )) {
          if (isDev) {
            console.warn('Supabase Phone Auth not configured/enabled. Falling back to Mock OTP in Development.');
            return { 
              success: true, 
              mockMode: true, 
              message: 'Mock OTP sent (Development Mode)' 
            };
          }
          throw new Error('Phone authentication is not configured in this project. Please contact support.');
        }
        throw error;
      }

      return { success: true, mockMode: false };
    } catch (err: any) {
      console.error('Error in sendOtp:', err);
      return { success: false, error: err.message || 'Failed to send OTP' };
    }
  },

  /**
   * Verify OTP for a phone number.
   */
  async verifyOtp(phone: string, token: string, isMock: boolean = false) {
    if (isMock) {
      if (token === '123456') {
        return { success: true, mockMode: true };
      }
      return { success: false, error: 'Invalid verification code' };
    }

    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) throw error;
      return { success: true, mockMode: false, data };
    } catch (err: any) {
      console.error('Error in verifyOtp:', err);
      return { success: false, error: err.message || 'Invalid verification code' };
    }
  }
};
