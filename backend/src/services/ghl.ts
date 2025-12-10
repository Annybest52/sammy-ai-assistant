interface GHLAppointment {
  calendarId: string;
  contactId?: string;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  title: string;
  assignedTo?: string;
  notes?: string;
  locationId?: string;
}

interface GHLContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  source?: string;
}

export class GHLService {
  private apiKey: string;
  private locationId: string;
  private baseUrl: string = 'https://services.leadconnectorhq.com';

  constructor(apiKey: string, locationId: string) {
    this.apiKey = apiKey;
    this.locationId = locationId;
  }

  // Create or get contact by email
  async createOrGetContact(contact: GHLContact): Promise<string | null> {
    try {
      console.log('🔵 Searching for existing contact...');
      console.log('   Email:', contact.email);
      
      // First, try to find existing contact
      const searchUrl = `${this.baseUrl}/contacts/search?locationId=${this.locationId}&email=${encodeURIComponent(contact.email)}`;
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
      });

      console.log('   Search response status:', searchResponse.status);

      if (searchResponse.ok) {
        const searchData = await searchResponse.json() as { contacts?: Array<{ id: string }> };
        if (searchData.contacts && searchData.contacts.length > 0) {
          console.log(`✅ Found existing contact: ${searchData.contacts[0].id}`);
          return searchData.contacts[0].id;
        }
        console.log('   No existing contact found, creating new one...');
      } else {
        const errorText = await searchResponse.text();
        console.warn('   Search failed (will try to create):', errorText);
      }

      // Contact doesn't exist, create new one
      const contactData = {
        locationId: this.locationId,
        email: contact.email,
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        phone: contact.phone || '',
        source: contact.source || 'Sammy AI Assistant',
      };
      
      console.log('🔵 Creating new contact...');
      console.log('   Contact data:', JSON.stringify(contactData, null, 2));
      
      const createResponse = await fetch(
        `${this.baseUrl}/contacts/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
          },
          body: JSON.stringify(contactData),
        }
      );

      console.log('   Create response status:', createResponse.status, createResponse.statusText);

      if (createResponse.ok) {
        const responseData = await createResponse.json() as { contact?: { id: string } };
        const contactId = responseData.contact?.id || null;
        if (contactId) {
          console.log(`✅ Contact created successfully: ${contactId}`);
        } else {
          console.warn('⚠️ Contact created but no ID in response');
        }
        return contactId;
      }

      const errorText = await createResponse.text();
      console.error('❌ Failed to create contact:');
      console.error('   Status:', createResponse.status);
      console.error('   Error:', errorText);
      
      if (createResponse.status === 400) {
        console.error('   → Invalid contact data (check email format, required fields)');
      } else if (createResponse.status === 401) {
        console.error('   → API key is invalid');
      } else if (createResponse.status === 403) {
        console.error('   → API key does not have permission to create contacts');
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ GHL contact creation exception:', error);
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
      return null;
    }
  }

  // Check calendar availability for a time slot
  async checkAvailability(calendarId: string, startTime: string, endTime: string): Promise<{ available: boolean; conflictingAppointments?: any[] }> {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      // Get appointments for the date range (check a wider range to catch overlaps)
      const dayStart = new Date(start);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(start);
      dayEnd.setHours(23, 59, 59, 999);

      const response = await fetch(
        `${this.baseUrl}/calendars/${calendarId}/appointments?locationId=${this.locationId}&startTime=${dayStart.toISOString()}&endTime=${dayEnd.toISOString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
          },
        }
      );

      if (response.ok) {
        const data = await response.json() as { appointments?: Array<{ startTime: string; endTime: string }> };
        const appointments = data.appointments || [];
        
        // Check for conflicts
        const conflicts = appointments.filter(apt => {
          const aptStart = new Date(apt.startTime);
          const aptEnd = new Date(apt.endTime);
          
          // Check if there's any overlap
          return (aptStart < end && aptEnd > start);
        });

        return {
          available: conflicts.length === 0,
          conflictingAppointments: conflicts,
        };
      }

      // If we can't check, assume available (fail open)
      return { available: true };
    } catch (error) {
      console.error('GHL availability check error:', error);
      // Fail open - assume available if check fails
      return { available: true };
    }
  }

  // Get calendar ID (you may need to configure this)
  async getCalendarId(calendarName?: string): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/calendars/?locationId=${this.locationId}`;
      console.log('🔵 Fetching calendars from GHL...');
      console.log('   URL:', url);
      console.log('   Location ID:', this.locationId);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
      });

      console.log('   Response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json() as { calendars?: Array<{ id: string; name?: string }> };
        const calendars = data.calendars || [];
        
        console.log(`   Found ${calendars.length} calendar(s):`);
        calendars.forEach((cal: any, idx: number) => {
          console.log(`     [${idx + 1}] ${cal.name || 'Unnamed'} (ID: ${cal.id})`);
        });
        
        if (calendars.length === 0) {
          console.error('❌ No calendars found in GHL!');
          console.error('   → You need to create a calendar in GHL first.');
          console.error('   → Go to GHL Dashboard → Calendar → Create Calendar');
          return null;
        }
        
        if (calendarName) {
          const calendar = calendars.find((c: any) => 
            c.name?.toLowerCase().includes(calendarName.toLowerCase())
          );
          if (calendar) {
            console.log(`✅ Using calendar: ${calendar.name} (ID: ${calendar.id})`);
            return calendar.id;
          }
          console.warn(`⚠️ Calendar "${calendarName}" not found, using first calendar`);
        }
        
        const selectedCalendar = calendars[0];
        console.log(`✅ Using first calendar: ${selectedCalendar.name || 'Unnamed'} (ID: ${selectedCalendar.id})`);
        return selectedCalendar.id;
      }

      const errorText = await response.text();
      console.error('❌ Failed to fetch calendars:');
      console.error('   Status:', response.status);
      console.error('   Error:', errorText);
      
      if (response.status === 401) {
        console.error('   → API key is invalid or expired');
      } else if (response.status === 403) {
        console.error('   → API key does not have permission to access calendars');
      } else if (response.status === 404) {
        console.error('   → Location ID is incorrect');
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ GHL get calendar exception:', error);
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
      return null;
    }
  }

  // Create appointment in GHL
  async createAppointment(appointment: GHLAppointment): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
    try {
      const requestBody = {
        locationId: this.locationId,
        contactId: appointment.contactId,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        title: appointment.title,
        assignedTo: appointment.assignedTo,
        notes: appointment.notes,
      };
      
      console.log('🔵 Sending appointment to GHL API...');
      console.log('   URL:', `${this.baseUrl}/calendars/${appointment.calendarId}/appointments`);
      console.log('   Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(
        `${this.baseUrl}/calendars/${appointment.calendarId}/appointments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('   Response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json() as { appointment?: { id: string } };
        console.log('   Response data:', JSON.stringify(data, null, 2));
        const appointmentId = data.appointment?.id;
        if (appointmentId) {
          console.log('✅✅✅ GHL API returned appointment ID:', appointmentId);
        } else {
          console.warn('⚠️ GHL API response OK but no appointment ID in response');
        }
        return {
          success: true,
          appointmentId,
        };
      }

      const errorText = await response.text();
      console.error('❌ GHL appointment creation failed:');
      console.error('   Status:', response.status);
      console.error('   Error response:', errorText);
      return {
        success: false,
        error: `GHL API error (${response.status}): ${errorText}`,
      };
    } catch (error: any) {
      console.error('❌ GHL appointment exception:', error);
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  // Book appointment with contact creation
  async bookAppointment(
    email: string,
    name: string,
    service: string,
    date: string,
    time: string,
    phone?: string,
    notes?: string
  ): Promise<{ success: boolean; appointmentId?: string; contactId?: string; error?: string }> {
    try {
      console.log('🔵 GHL bookAppointment called with:');
      console.log('   Email:', email);
      console.log('   Name:', name);
      console.log('   Service:', service);
      console.log('   Date:', date);
      console.log('   Time:', time);
      console.log('   Phone:', phone || 'not provided');
      
      // Parse name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      console.log('   Parsed name - First:', firstName, 'Last:', lastName);

      // Create or get contact
      console.log('🔵 Creating/getting contact...');
      const contactId = await this.createOrGetContact({
        email,
        firstName,
        lastName,
        phone,
        source: 'Sammy AI Assistant',
      });

      if (!contactId) {
        console.error('❌ Failed to create or find contact');
        return {
          success: false,
          error: 'Failed to create or find contact',
        };
      }
      console.log('✅ Contact ID:', contactId);

      // Get calendar ID
      console.log('🔵 Getting calendar ID...');
      const calendarId = await this.getCalendarId();
      if (!calendarId) {
        console.error('❌ No calendar found in GHL');
        return {
          success: false,
          error: 'No calendar found. Please configure a calendar in GHL.',
        };
      }
      console.log('✅ Calendar ID:', calendarId);

      // Parse date and time
      console.log('🔵 Parsing date/time...');
      console.log('   Date string:', date);
      console.log('   Time string:', time);
      const startDateTime = this.parseDateTime(date, time);
      if (!startDateTime) {
        console.error('❌ Failed to parse date/time');
        return {
          success: false,
          error: `Invalid date or time format. Received: date="${date}", time="${time}"`,
        };
      }
      console.log('✅ Parsed start time:', startDateTime.toISOString());

      // Create appointment (default 1 hour duration)
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1);

      // Check availability BEFORE booking
      console.log('🔵 Checking availability...');
      const availability = await this.checkAvailability(
        calendarId,
        startDateTime.toISOString(),
        endDateTime.toISOString()
      );
      console.log('   Availability:', availability.available ? '✅ Available' : '❌ Not available');

      if (!availability.available) {
        console.error('❌ Time slot not available');
        return {
          success: false,
          error: `This time slot is not available. There's already an appointment scheduled at that time.`,
        };
      }

      console.log('🔵 Creating appointment in GHL...');
      const appointmentResult = await this.createAppointment({
        calendarId,
        contactId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        title: `${service} - ${name}`,
        notes: notes || `Booked via Sammy AI Assistant\nService: ${service}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}`,
        locationId: this.locationId,
      });

      if (appointmentResult.success) {
        console.log('✅✅✅ Appointment created successfully!');
        console.log('   Appointment ID:', appointmentResult.appointmentId);
        return {
          success: true,
          appointmentId: appointmentResult.appointmentId,
          contactId,
        };
      }

      console.error('❌ Appointment creation failed:', appointmentResult.error);
      return appointmentResult;
    } catch (error: any) {
      console.error('GHL book appointment error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  // Parse date and time strings into Date object
  private parseDateTime(dateStr: string, timeStr: string): Date | null {
    try {
      console.log('   🔵 parseDateTime called with:', { dateStr, timeStr });
      // Handle relative dates
      let date = new Date();
      
      if (dateStr.toLowerCase().includes('tomorrow')) {
        date.setDate(date.getDate() + 1);
      } else if (dateStr.toLowerCase().includes('monday')) {
        const daysUntilMonday = (1 - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + daysUntilMonday);
      } else if (dateStr.toLowerCase().includes('tuesday')) {
        const daysUntilTuesday = (2 - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + daysUntilTuesday);
      } else if (dateStr.toLowerCase().includes('wednesday')) {
        const daysUntilWednesday = (3 - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + daysUntilWednesday);
      } else if (dateStr.toLowerCase().includes('thursday')) {
        const daysUntilThursday = (4 - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + daysUntilThursday);
      } else if (dateStr.toLowerCase().includes('friday')) {
        const daysUntilFriday = (5 - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + daysUntilFriday);
      } else if (dateStr.toLowerCase().includes('saturday')) {
        const daysUntilSaturday = (6 - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + daysUntilSaturday);
      } else if (dateStr.toLowerCase().includes('sunday')) {
        const daysUntilSunday = (0 - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + daysUntilSunday);
      }

      // Parse time
      let hours = 9; // Default 9 AM
      let minutes = 0;

      if (timeStr.toLowerCase().includes('morning')) {
        hours = 10;
      } else if (timeStr.toLowerCase().includes('afternoon')) {
        hours = 14;
      } else if (timeStr.toLowerCase().includes('evening')) {
        hours = 17;
      } else {
        // Try to parse time like "2 PM" or "14:00"
        const timeMatch = timeStr.match(/(\d{1,2})\s*(am|pm|AM|PM)/);
        if (timeMatch) {
          hours = parseInt(timeMatch[1]);
          if (timeMatch[2].toLowerCase() === 'pm' && hours !== 12) {
            hours += 12;
          }
          if (timeMatch[2].toLowerCase() === 'am' && hours === 12) {
            hours = 0;
          }
        }
      }

      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch (error) {
      console.error('Date parsing error:', error);
      return null;
    }
  }
}

// Helper function to get GHL service instance
export function getGHLService(): GHLService | null {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    console.warn('⚠️ GHL not configured: GHL_API_KEY and GHL_LOCATION_ID required');
    return null;
  }

  return new GHLService(apiKey, locationId);
}

