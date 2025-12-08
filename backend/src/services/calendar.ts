import { google, calendar_v3 } from 'googleapis';
import { config } from '../config/index.js';

interface CreateEventParams {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  attendees: string[];
}

export class CalendarService {
  private calendar: calendar_v3.Calendar | null = null;
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
  }

  setCredentials(tokens: { access_token: string; refresh_token?: string }) {
    this.oauth2Client.setCredentials(tokens);
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
    });
  }

  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.setCredentials(tokens as { access_token: string; refresh_token?: string });
    return tokens;
  }

  async createEvent(params: CreateEventParams): Promise<CalendarEvent> {
    if (!this.calendar) {
      // Return mock for development
      console.log('📅 [MOCK] Creating calendar event:', params);
      return {
        id: `mock-${Date.now()}`,
        title: params.title,
        start: params.startTime,
        end: params.endTime,
        attendees: params.attendees,
      };
    }

    const event = {
      summary: params.title,
      description: params.description,
      start: {
        dateTime: params.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: params.endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: params.attendees.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await this.calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all',
    });

    return {
      id: response.data.id || '',
      title: response.data.summary || '',
      start: new Date(response.data.start?.dateTime || ''),
      end: new Date(response.data.end?.dateTime || ''),
      attendees: response.data.attendees?.map(a => a.email || '') || [],
    };
  }

  async getAvailableSlots(date: Date): Promise<string[]> {
    // Business hours: 9 AM - 5 PM
    const businessHours = {
      start: 9,
      end: 17,
      slotDuration: 30, // minutes
    };

    if (!this.calendar) {
      // Return mock available slots
      const slots: string[] = [];
      for (let hour = businessHours.start; hour < businessHours.end; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
      return slots;
    }

    // Get busy times from calendar
    const startOfDay = new Date(date);
    startOfDay.setHours(businessHours.start, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(businessHours.end, 0, 0, 0);

    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        items: [{ id: 'primary' }],
      },
    });

    const busySlots = response.data.calendars?.primary?.busy || [];
    
    // Generate available slots
    const slots: string[] = [];
    const slotDuration = businessHours.slotDuration * 60 * 1000;

    for (
      let time = startOfDay.getTime();
      time < endOfDay.getTime();
      time += slotDuration
    ) {
      const slotStart = new Date(time);
      const slotEnd = new Date(time + slotDuration);

      const isBusy = busySlots.some(busy => {
        const busyStart = new Date(busy.start || '');
        const busyEnd = new Date(busy.end || '');
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      if (!isBusy) {
        slots.push(
          slotStart.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
        );
      }
    }

    return slots;
  }

  async getUpcomingEvents(maxResults: number = 10): Promise<CalendarEvent[]> {
    if (!this.calendar) {
      return [];
    }

    const response = await this.calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return (response.data.items || []).map(event => ({
      id: event.id || '',
      title: event.summary || '',
      start: new Date(event.start?.dateTime || event.start?.date || ''),
      end: new Date(event.end?.dateTime || event.end?.date || ''),
      attendees: event.attendees?.map(a => a.email || '') || [],
    }));
  }
}


