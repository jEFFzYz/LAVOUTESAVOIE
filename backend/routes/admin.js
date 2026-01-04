/**
 * Admin Routes
 * Secure endpoints for restaurant management
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');

const ReservationService = require('../services/reservationService');
const EmailService = require('../services/emailService');

// Simple API key authentication middleware
const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Non autorisé'
        });
    }

    next();
};

// Apply auth to all admin routes
router.use(authMiddleware);

/**
 * GET /api/admin/reservations
 * List all reservations (with optional filters)
 */
router.get('/reservations', async (req, res) => {
    try {
        const { date, status, page = 1, limit = 50 } = req.query;

        const filters = {};
        if (date) filters.date = date;
        if (status) filters.status = status;

        const reservations = await ReservationService.getAllReservations(filters, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: reservations
        });

    } catch (error) {
        console.error('Admin list error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue'
        });
    }
});

/**
 * GET /api/admin/reservations/:id
 * Get full reservation details
 */
router.get('/reservations/:id', async (req, res) => {
    try {
        const reservation = await ReservationService.getReservation(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        res.json({
            success: true,
            data: reservation
        });

    } catch (error) {
        console.error('Admin get error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue'
        });
    }
});

/**
 * PUT /api/admin/reservations/:id/confirm
 * Confirm a reservation
 */
router.put('/reservations/:id/confirm', async (req, res) => {
    try {
        const reservation = await ReservationService.getReservation(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        // Update status
        const updated = await ReservationService.updateReservation(req.params.id, {
            status: 'confirmed',
            confirmedAt: new Date().toISOString()
        });

        // Send confirmation email to customer
        try {
            await EmailService.sendReservationConfirmed({
                ...reservation,
                status: 'confirmed'
            });
        } catch (emailError) {
            console.error('Confirmation email error:', emailError);
        }

        res.json({
            success: true,
            message: 'Réservation confirmée',
            data: updated
        });

    } catch (error) {
        console.error('Confirm error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue'
        });
    }
});

/**
 * PUT /api/admin/reservations/:id/cancel
 * Cancel a reservation
 */
router.put('/reservations/:id/cancel', [
    body('reason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
    try {
        const reservation = await ReservationService.getReservation(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        const { reason } = req.body;

        // Update status
        const updated = await ReservationService.updateReservation(req.params.id, {
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancellationReason: reason || ''
        });

        // Send cancellation email to customer
        try {
            await EmailService.sendReservationCancelled({
                ...reservation,
                status: 'cancelled',
                cancellationReason: reason
            });
        } catch (emailError) {
            console.error('Cancellation email error:', emailError);
        }

        res.json({
            success: true,
            message: 'Réservation annulée',
            data: updated
        });

    } catch (error) {
        console.error('Cancel error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue'
        });
    }
});

/**
 * DELETE /api/admin/reservations/:id
 * Delete a reservation (hard delete)
 */
router.delete('/reservations/:id', async (req, res) => {
    try {
        const deleted = await ReservationService.deleteReservation(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        res.json({
            success: true,
            message: 'Réservation supprimée'
        });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue'
        });
    }
});

/**
 * GET /api/admin/stats
 * Get reservation statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await ReservationService.getStats();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue'
        });
    }
});

/**
 * GET /api/admin/dashboard/:date
 * Get dashboard data for a specific date
 */
router.get('/dashboard/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const dashboardData = await ReservationService.getDashboardData(date);

        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue'
        });
    }
});

/**
 * GET /api/admin/settings
 * Get restaurant settings (hours, closed days, etc.)
 */
router.get('/settings', async (req, res) => {
    try {
        const config = await ReservationService.getConfig();
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue'
        });
    }
});

/**
 * PUT /api/admin/settings
 * Update restaurant settings
 */
router.put('/settings', [
    body('closedDays').optional().isArray(),
    body('sundayDinnerClosed').optional().isBoolean(),
    body('hours').optional().isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const updated = await ReservationService.updateConfig(req.body);
        res.json({
            success: true,
            message: 'Paramètres mis à jour',
            data: updated
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue'
        });
    }
});

/**
 * GET /api/admin/verify
 * Verify API key is valid
 */
router.get('/verify', (req, res) => {
    res.json({
        success: true,
        message: 'Clé API valide'
    });
});

module.exports = router;
