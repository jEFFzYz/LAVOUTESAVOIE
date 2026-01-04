/**
 * Reservation Routes
 * Handles all reservation-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const ReservationService = require('../services/reservationService');
const EmailService = require('../services/emailService');

// Validation middleware
const reservationValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères')
        .escape(),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Email invalide')
        .normalizeEmail(),

    body('phone')
        .trim()
        .matches(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/)
        .withMessage('Numéro de téléphone invalide'),

    body('date')
        .isISO8601()
        .withMessage('Date invalide')
        .custom((value) => {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                throw new Error('La date ne peut pas être dans le passé');
            }

            // Check max 3 months ahead
            const maxDate = new Date();
            maxDate.setMonth(maxDate.getMonth() + 3);
            if (selectedDate > maxDate) {
                throw new Error('Réservation possible jusqu\'à 3 mois à l\'avance');
            }

            // Check closed days (Wednesday = 3, Thursday = 4)
            const dayOfWeek = selectedDate.getDay();
            if (dayOfWeek === 3 || dayOfWeek === 4) {
                throw new Error('Le restaurant est fermé le mercredi et le jeudi');
            }

            return true;
        }),

    body('time')
        .isIn(['12:00', '12:30', '13:00', '19:00', '19:30', '20:00', '20:30'])
        .withMessage('Créneau horaire invalide')
        .custom((value, { req }) => {
            const selectedDate = new Date(req.body.date);
            const dayOfWeek = selectedDate.getDay();

            // Sunday: only lunch
            if (dayOfWeek === 0 && value >= '19:00') {
                throw new Error('Le restaurant n\'est pas ouvert le dimanche soir');
            }

            return true;
        }),

    body('guests')
        .isInt({ min: 1, max: 8 })
        .withMessage('Nombre de convives invalide (1-8)')
        .toInt(),

    body('message')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Message trop long (500 caractères max)')
        .escape()
];

/**
 * POST /api/reservations
 * Create a new reservation request
 */
router.post('/', reservationValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        const { name, email, phone, date, time, guests, message } = req.body;

        // Check availability
        const isAvailable = await ReservationService.checkAvailability(date, time, guests);
        if (!isAvailable.available) {
            return res.status(409).json({
                success: false,
                message: isAvailable.message || 'Ce créneau n\'est plus disponible. Veuillez choisir un autre horaire.'
            });
        }

        // Create reservation
        const reservation = {
            id: uuidv4(),
            name,
            email,
            phone: phone.replace(/\s/g, ''),
            date,
            time,
            guests,
            message: message || '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            ip: req.ip
        };

        // Save reservation
        await ReservationService.createReservation(reservation);

        // Send confirmation emails
        try {
            await EmailService.sendCustomerConfirmation(reservation);
            await EmailService.sendRestaurantNotification(reservation);
        } catch (emailError) {
            console.error('Email error:', emailError);
            // Don't fail the reservation if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Votre demande de réservation a été envoyée avec succès !',
            data: {
                id: reservation.id,
                date: reservation.date,
                time: reservation.time,
                guests: reservation.guests
            }
        });

    } catch (error) {
        console.error('Reservation error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de la réservation. Veuillez réessayer.'
        });
    }
});

/**
 * GET /api/reservations/:id
 * Get reservation status by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const reservation = await ReservationService.getReservation(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        // Return limited info for security
        res.json({
            success: true,
            data: {
                id: reservation.id,
                name: reservation.name,
                date: reservation.date,
                time: reservation.time,
                guests: reservation.guests,
                status: reservation.status
            }
        });

    } catch (error) {
        console.error('Get reservation error:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue'
        });
    }
});

module.exports = router;
