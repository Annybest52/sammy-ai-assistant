import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

interface BookingDetails {
  name: string;
  email: string;
  phone?: string;
  service: string;
  date?: string;
  time?: string;
}

// Send SMS confirmation to customer
export async function sendBookingSMS(booking: BookingDetails): Promise<boolean> {
  if (!client || !twilioPhone) {
    console.log('⚠️ Twilio not configured - skipping SMS');
    console.log('📱 Would have sent SMS to:', booking.phone);
    return false;
  }

  if (!booking.phone) {
    console.log('⚠️ No phone number provided - skipping SMS');
    return false;
  }

  try {
    const dateTime = [booking.date, booking.time].filter(Boolean).join(' at ');
    
    const message = await client.messages.create({
      body: `✅ Hi ${booking.name}! Your appointment is confirmed.

📋 Service: ${booking.service}
📅 When: ${dateTime || 'To be confirmed'}

Thank you for choosing Dealey Media International! We'll contact you soon to confirm details.

Questions? Reply to this text or email info@dealeymediainternational.com`,
      from: twilioPhone,
      to: booking.phone,
    });

    console.log('✅ SMS sent:', message.sid);
    return true;
  } catch (error: any) {
    console.error('❌ SMS error:', error.message);
    return false;
  }
}

// Send SMS notification to business
export async function sendBookingNotificationSMS(booking: BookingDetails): Promise<boolean> {
  if (!client || !twilioPhone) {
    console.log('⚠️ Twilio not configured - skipping business SMS');
    return false;
  }

  const businessPhone = process.env.BUSINESS_PHONE;
  if (!businessPhone) {
    console.log('⚠️ No business phone configured - skipping notification SMS');
    return false;
  }

  try {
    const dateTime = [booking.date, booking.time].filter(Boolean).join(' at ');
    
    const message = await client.messages.create({
      body: `🆕 New Booking via Sammy!

👤 ${booking.name}
📧 ${booking.email}
📱 ${booking.phone || 'Not provided'}
🎯 ${booking.service}
📅 ${dateTime || 'Not specified'}

Follow up with this customer!`,
      from: twilioPhone,
      to: businessPhone,
    });

    console.log('✅ Business notification SMS sent:', message.sid);
    return true;
  } catch (error: any) {
    console.error('❌ Business SMS error:', error.message);
    return false;
  }
}

// Format phone number to E.164 format
export function formatPhoneNumber(phone: string): string | null {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle US numbers
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // Handle numbers that already have country code
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // Handle international numbers (assume they include country code)
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  console.log('⚠️ Invalid phone number format:', phone);
  return null;
}

