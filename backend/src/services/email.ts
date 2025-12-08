import { Resend } from 'resend';

// Initialize Resend with API key
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface BookingDetails {
  name: string;
  email: string;
  service: string;
  date?: string;
  time?: string;
  phone?: string;
}

export async function sendBookingConfirmation(booking: BookingDetails): Promise<boolean> {
  if (!resend) {
    console.log('⚠️ RESEND_API_KEY not configured - skipping email');
    console.log('📧 Would have sent email to:', booking.email);
    return false;
  }

  try {
    const dateTime = [booking.date, booking.time].filter(Boolean).join(' at ');
    
    const { data, error } = await resend.emails.send({
      from: 'Sammy <onboarding@resend.dev>', // Using Resend default until domain verified
      to: booking.email,
      subject: `✅ Appointment Confirmed - ${booking.service}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                        🤖 Sammy
                      </h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
                        Dealey Media International
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #22c55e; margin: 0 0 20px; font-size: 24px;">
                        ✅ Appointment Confirmed!
                      </h2>
                      
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                        Hi <strong>${booking.name}</strong>,<br><br>
                        Great news! Your appointment has been successfully booked. Here are your details:
                      </p>
                      
                      <!-- Booking Details Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <tr>
                          <td style="padding: 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                  <span style="color: #6b7280; font-size: 14px;">📋 Name</span><br>
                                  <strong style="color: #111827; font-size: 16px;">${booking.name}</strong>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                  <span style="color: #6b7280; font-size: 14px;">🎯 Service</span><br>
                                  <strong style="color: #111827; font-size: 16px;">${booking.service}</strong>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                  <span style="color: #6b7280; font-size: 14px;">📅 Date & Time</span><br>
                                  <strong style="color: #111827; font-size: 16px;">${dateTime || 'To be confirmed'}</strong>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0;">
                                  <span style="color: #6b7280; font-size: 14px;">📧 Email</span><br>
                                  <strong style="color: #111827; font-size: 16px;">${booking.email}</strong>
                                </td>
                              </tr>
                              ${booking.phone ? `
                              <tr>
                                <td style="padding: 12px 0; border-top: 1px solid #e2e8f0;">
                                  <span style="color: #6b7280; font-size: 14px;">📱 Phone</span><br>
                                  <strong style="color: #111827; font-size: 16px;">${booking.phone}</strong>
                                </td>
                              </tr>
                              ` : ''}
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                        Our team will reach out to you shortly to confirm the exact time. If you need to reschedule or have any questions, please reply to this email or contact us at:
                      </p>
                      
                      <p style="color: #374151; font-size: 14px; margin: 15px 0 0;">
                        📧 <a href="mailto:info@dealeymediainternational.com" style="color: #6366f1;">info@dealeymediainternational.com</a><br>
                        🌐 <a href="https://dealeymediainternational.com" style="color: #6366f1;">dealeymediainternational.com</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0;">
                        This email was sent by Sammy, your AI assistant at Dealey Media International.
                      </p>
                      <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0;">
                        © ${new Date().getFullYear()} Dealey Media International. All rights reserved.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Email error:', error);
      return false;
    }

    console.log('✅ Confirmation email sent:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

// Send notification to business owner
export async function sendBookingNotification(booking: BookingDetails): Promise<boolean> {
  if (!resend) {
    console.log('⚠️ RESEND_API_KEY not configured - skipping notification');
    return false;
  }

  const businessEmail = process.env.BUSINESS_EMAIL || 'info@dealeymediainternational.com';

  try {
    const dateTime = [booking.date, booking.time].filter(Boolean).join(' at ');
    
    const { data, error } = await resend.emails.send({
      from: 'Sammy <onboarding@resend.dev>', // Using Resend default until domain verified
      to: businessEmail,
      subject: `🆕 New Booking: ${booking.name} - ${booking.service}`,
      html: `
        <h2>🆕 New Appointment Booking</h2>
        <p>A new appointment was booked via Sammy:</p>
        <ul>
          <li><strong>Name:</strong> ${booking.name}</li>
          <li><strong>Email:</strong> ${booking.email}</li>
          <li><strong>Phone:</strong> ${booking.phone || 'Not provided'}</li>
          <li><strong>Service:</strong> ${booking.service}</li>
          <li><strong>Preferred Time:</strong> ${dateTime || 'Not specified'}</li>
        </ul>
        <p>Please follow up with the customer to confirm the appointment.</p>
      `,
    });

    if (error) {
      console.error('❌ Notification error:', error);
      return false;
    }

    console.log('✅ Business notification sent:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
    return false;
  }
}
