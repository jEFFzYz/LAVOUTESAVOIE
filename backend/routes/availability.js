/**
 * Availability Routes
 * Check table availability for specific dates/times
 */

const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');

const ReservationService = require('../services/reservationService');

/**
 * GET /api/availability/config
 * Get public restaurant configuration (for frontend booking widget)
 */
router.get('/config', async (req, res) => {
    try {
        const config = await ReservationService.getConfig();
        res.json({
            success: true,
            data: {
                closedDays: config.closedDays || [3, 4],
                sundayDinnerClosed: config.sundayDinnerClosed !== false,
                timeSlots: config.timeSlots || {
                    lunch: ['12:00', '12:30', '13:00'],
                    dinner: ['19:00', '19:30', '20:00', '20:30']
                },
                hours: config.hours || null
            }
        });
    } catch (error) {
        console.error('Config error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue'
        });
    }
});

/**
 * GET /api/availability
 * Check availability for a specific date
 */
router.get('/', [
    query('date')
        .isISO8601()
        .withMessage('Date invalide')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { date } = req.query;
        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getDay();

        // Get config for closed days
        const config = await ReservationService.getConfig();
        const closedDays = config.closedDays || [3, 4];

        // Check if restaurant is closed
        if (closedDays.includes(dayOfWeek)) {
            return res.json({
                success: true,
                data: {
                    date,
                    closed: true,
                    message: 'Restaurant fermé ce jour',
                    slots: []
                }
            });
        }

        // Get available time slots
        const slots = await ReservationService.getAvailableSlots(date);

        // Filter Sunday dinner if configured
        const sundayDinnerClosed = config.sundayDinnerClosed !== false;
        const filteredSlots = (dayOfWeek === 0 && sundayDinnerClosed)
            ? slots.filter(slot => slot.time < '19:00')
            : slots;

        res.json({
            success: true,
            data: {
                date,
                closed: false,
                slots: filteredSlots
            }
        });

    } catch (error) {
        console.error('Availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue'
        });
    }
});

/**
 * GET /api/availability/slot
 * Check specific slot availability
 */
router.get('/slot', [
    query('date').isISO8601().withMessage('Date invalide'),
    query('time').isIn(['12:00', '12:30', '13:00', '19:00', '19:30', '20:00', '20:30']).withMessage('Horaire invalide'),
    query('guests').isInt({ min: 1, max: 8 }).withMessage('Nombre de convives invalide')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { date, time, guests } = req.query;
        const availability = await ReservationService.checkAvailability(date, time, parseInt(guests));

        res.json({
            success: true,
            data: availability
        });

    } catch (error) {
        console.error('Slot availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue'
        });
    }
});

module.exports = router;
