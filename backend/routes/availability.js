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
 * GET /api/availability/menu
 * Get public menu (for frontend display)
 */
router.get('/menu', async (req, res) => {
    try {
        const config = await ReservationService.getConfig();

        // Default menu if not set
        const defaultMenu = {
            entrees: [
                { id: 1, name: "Foie Gras au Vin de Savoie", description: "Foie gras de canard mi-cuit au cacao et au vin de Savoie (PAKHUS), chutney d'oignons, pain grillé et éclats de cacao", tag: "Signature" },
                { id: 2, name: "Œuf en Meurette et Crumble de Beaufort", description: "Œuf poché servi dans une sauce champignons et lardons artisanaux de la Maison BAUD au vin rouge, accompagné d'un crumble de Beaufort", tag: "Maison BAUD" },
                { id: 3, name: "Salade Savoyarde", description: "Croustillant de reblochon fermier, charcuterie de la Maison BAUD, salade verte, tomates séchées et graines torréfiées", tag: "Produits locaux" }
            ],
            plats: [
                { id: 1, name: "Filet de Dorade Royale", description: "Filet de dorade royale grillé, sauce chimichurri maison aux herbes fraîches, risotto de riz sauvage au lait de coco et légumes de saison croquants", tag: "" },
                { id: 2, name: "Cocotte de Reblochon", description: "Cocotte de reblochon, pommes de terre, salade avec charcuterie de la Maison BAUD (ou sans)", tag: "Spécialité Savoyarde" },
                { id: 3, name: "Suprême de Poulet Jaune aux Morilles", description: "Suprême de poulet jaune français aux morilles (peut être servi sans), jus léger infusé aux herbes fraîches, pommes de terre grenailles dorées et légumes primeurs", tag: "Origine France" },
                { id: 4, name: "Faux-filet Montbéliard ou Normand", description: "Faux-filet grillé et tranché, pommes de terre grenailles aux herbes, jeunes légumes de saison et sauce au vin rouge de Savoie parfumée aux herbes fraîches", tag: "Selon arrivage" },
                { id: 5, name: "Gibier du Moment", description: "Gibier du moment sauce grand veneur, accompagné de sa polenta au Beaufort et légumes de saison", tag: "De saison" }
            ],
            desserts: [
                { id: 1, name: "Parfait Glacé aux Marrons", description: "Parfait glacé onctueux aux marrons, texture fondante", tag: "" },
                { id: 2, name: "Le Gourmand", description: "Assortiment de mignardises - peut être servi en café gourmand, thé gourmand, digestif gourmand ou champagne gourmand", tag: "Signature" },
                { id: 3, name: "Pavlova", description: "Meringue croustillante garnie d'une crème légère à la vanille, boule de glace mandarine de Sicile artisanale et fruits frais", tag: "" },
                { id: 4, name: "Mi-cuit au Chocolat Noir", description: "Mi-cuit au chocolat noir cœur fondant, sorbet fruits rouges et éclats de fèves torréfiées", tag: "" },
                { id: 5, name: "Assiette de Fromages Savoyards", description: "Sélection de fromages affinés de nos montagnes", tag: "Produits locaux" },
                { id: 6, name: "Faisselle de Savoie", description: "Faisselle de Savoie au sucre ou au coulis de fruits rouges", tag: "" },
                { id: 7, name: "Parfait Glacé à la Chartreuse Verte", description: "Parfait glacé à la Chartreuse verte et sa sauce chocolat", tag: "" },
                { id: 8, name: "Profiteroles Maison", description: "Choux garnis de glace maison au pain d'épice, crème fouettée vanille et sauce au chocolat noir", tag: "Fait maison" }
            ],
            menuEnfant: "Émincés de poulet accompagnés de frites maison ou légumes, boule de glace artisanale et sirop",
            validityDate: "2026-04-10"
        };

        res.json({
            success: true,
            data: config.menu || defaultMenu
        });
    } catch (error) {
        console.error('Menu error:', error);
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
