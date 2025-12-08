import { Router, Request, Response } from 'express';
import { CalendarService } from '../services/calendar.js';

const router = Router();
const calendarService = new CalendarService();

// GET /api/calendar/auth - Get OAuth URL
router.get('/auth', (req: Request, res: Response) => {
  const authUrl = calendarService.getAuthUrl();
  res.json({
    success: true,
    authUrl,
  });
});

// GET /api/calendar/callback - OAuth callback
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const tokens = await calendarService.getTokensFromCode(code);

    // In production, store tokens securely (e.g., encrypted in database)
    res.json({
      success: true,
      message: 'Calendar connected successfully',
      // Don't expose full tokens in production
    });
  } catch (error) {
    console.error('Calendar callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect calendar',
    });
  }
});

// GET /api/calendar/availability/:date - Check availability
router.get('/availability/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const slots = await calendarService.getAvailableSlots(new Date(date));

    res.json({
      success: true,
      date,
      slots,
    });
  } catch (error) {
    console.error('Availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get availability',
    });
  }
});

// POST /api/calendar/book - Book appointment
router.post('/book', async (req: Request, res: Response) => {
  try {
    const { title, description, startTime, endTime, attendees } = req.body;

    if (!title || !startTime || !endTime || !attendees) {
      return res.status(400).json({
        error: 'Missing required fields: title, startTime, endTime, attendees',
      });
    }

    const event = await calendarService.createEvent({
      title,
      description: description || '',
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendees,
    });

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to book appointment',
    });
  }
});

// GET /api/calendar/upcoming - Get upcoming events
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const events = await calendarService.getUpcomingEvents(limit);

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('Upcoming events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upcoming events',
    });
  }
});

export { router as calendarRouter };


