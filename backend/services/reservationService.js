/**
 * Reservation Service
 * Handles all reservation business logic and data management
 */

const fs = require('fs').promises;
const path = require('path');

// Database file path (JSON-based storage)
const DB_PATH = path.join(__dirname, '../../database/reservations.json');
const CONFIG_PATH = path.join(__dirname, '../../database/config.json');

// Restaurant configuration
const DEFAULT_CONFIG = {
    tables: [
        { id: 1, capacity: 2, name: 'Table 1' },
        { id: 2, capacity: 2, name: 'Table 2' },
        { id: 3, capacity: 2, name: 'Table 3' },
        { id: 4, capacity: 4, name: 'Table 4' },
        { id: 5, capacity: 4, name: 'Table 5' },
        { id: 6, capacity: 4, name: 'Table 6' },
        { id: 7, capacity: 4, name: 'Table 7' },
        { id: 8, capacity: 6, name: 'Table 8' },
        { id: 9, capacity: 6, name: 'Table 9' },
        { id: 10, capacity: 6, name: 'Table 10' },
        { id: 11, capacity: 8, name: 'Table 11' },
        { id: 12, capacity: 8, name: 'Table 12' },
        { id: 13, capacity: 2, name: 'Table 13' },
        { id: 14, capacity: 4, name: 'Table 14' },
        { id: 15, capacity: 4, name: 'Table 15' },
        { id: 16, capacity: 2, name: 'Table 16' },
        { id: 17, capacity: 4, name: 'Table 17' },
        { id: 18, capacity: 6, name: 'Table 18' },
        { id: 19, capacity: 4, name: 'Table 19' },
        { id: 20, capacity: 2, name: 'Table 20' }
    ],
    timeSlots: {
        lunch: ['12:00', '12:30', '13:00'],
        dinner: ['19:00', '19:30', '20:00', '20:30']
    },
    serviceDuration: 120, // minutes
    bufferTime: 15 // minutes between services
};

class ReservationService {
    /**
     * Initialize database files if they don't exist
     */
    static async initDB() {
        try {
            // Ensure database directory exists
            const dbDir = path.dirname(DB_PATH);
            await fs.mkdir(dbDir, { recursive: true });

            // Initialize reservations file
            try {
                await fs.access(DB_PATH);
            } catch {
                await fs.writeFile(DB_PATH, JSON.stringify({ reservations: [] }, null, 2));
            }

            // Initialize config file
            try {
                await fs.access(CONFIG_PATH);
            } catch {
                await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
            }
        } catch (error) {
            console.error('DB init error:', error);
        }
    }

    /**
     * Read reservations from database
     */
    static async readDB() {
        await this.initDB();
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    }

    /**
     * Write reservations to database
     */
    static async writeDB(data) {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    }

    /**
     * Get restaurant configuration
     */
    static async getConfig() {
        await this.initDB();
        try {
            const data = await fs.readFile(CONFIG_PATH, 'utf8');
            return JSON.parse(data);
        } catch {
            return DEFAULT_CONFIG;
        }
    }

    /**
     * Check availability for a specific date, time, and party size
     */
    static async checkAvailability(date, time, guests) {
        const db = await this.readDB();
        const config = await this.getConfig();

        // Get reservations for this date and time (only confirmed and pending)
        const existingReservations = db.reservations.filter(r =>
            r.date === date &&
            r.time === time &&
            (r.status === 'confirmed' || r.status === 'pending')
        );

        // Calculate occupied capacity
        const occupiedCapacity = existingReservations.reduce((sum, r) => sum + r.guests, 0);

        // Calculate total capacity
        const totalCapacity = config.tables.reduce((sum, t) => sum + t.capacity, 0);

        // Check if we can accommodate the party
        const availableCapacity = totalCapacity - occupiedCapacity;

        // Find suitable tables
        const occupiedTables = existingReservations.map(r => r.tableId).filter(Boolean);
        const availableTables = config.tables.filter(t =>
            !occupiedTables.includes(t.id) &&
            t.capacity >= guests
        );

        // Sort by capacity (assign smallest suitable table)
        availableTables.sort((a, b) => a.capacity - b.capacity);

        if (availableTables.length === 0 || availableCapacity < guests) {
            return {
                available: false,
                message: 'Ce créneau est complet. Veuillez choisir un autre horaire.',
                suggestedTimes: await this.getSuggestedTimes(date, guests)
            };
        }

        return {
            available: true,
            suggestedTable: availableTables[0],
            remainingCapacity: availableCapacity - guests
        };
    }

    /**
     * Get suggested alternative times
     */
    static async getSuggestedTimes(date, guests) {
        const config = await this.getConfig();
        const allTimes = [...config.timeSlots.lunch, ...config.timeSlots.dinner];
        const suggestions = [];

        for (const time of allTimes) {
            const availability = await this.checkAvailability(date, time, guests);
            if (availability.available) {
                suggestions.push(time);
            }
        }

        return suggestions.slice(0, 3);
    }

    /**
     * Get available slots for a date
     */
    static async getAvailableSlots(date) {
        const config = await this.getConfig();
        const allTimes = [...config.timeSlots.lunch, ...config.timeSlots.dinner];
        const slots = [];

        for (const time of allTimes) {
            const db = await this.readDB();
            const existingReservations = db.reservations.filter(r =>
                r.date === date &&
                r.time === time &&
                (r.status === 'confirmed' || r.status === 'pending')
            );

            const occupiedCapacity = existingReservations.reduce((sum, r) => sum + r.guests, 0);
            const totalCapacity = config.tables.reduce((sum, t) => sum + t.capacity, 0);
            const availableCapacity = totalCapacity - occupiedCapacity;

            slots.push({
                time,
                available: availableCapacity > 0,
                availableCapacity,
                reservationCount: existingReservations.length
            });
        }

        return slots;
    }

    /**
     * Create a new reservation
     */
    static async createReservation(reservation) {
        const db = await this.readDB();

        // Assign a table if available
        const availability = await this.checkAvailability(
            reservation.date,
            reservation.time,
            reservation.guests
        );

        if (availability.available && availability.suggestedTable) {
            reservation.tableId = availability.suggestedTable.id;
            reservation.tableName = availability.suggestedTable.name;
        }

        db.reservations.push(reservation);
        await this.writeDB(db);

        return reservation;
    }

    /**
     * Get a reservation by ID
     */
    static async getReservation(id) {
        const db = await this.readDB();
        return db.reservations.find(r => r.id === id);
    }

    /**
     * Update a reservation
     */
    static async updateReservation(id, updates) {
        const db = await this.readDB();
        const index = db.reservations.findIndex(r => r.id === id);

        if (index === -1) {
            return null;
        }

        db.reservations[index] = {
            ...db.reservations[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await this.writeDB(db);
        return db.reservations[index];
    }

    /**
     * Delete a reservation
     */
    static async deleteReservation(id) {
        const db = await this.readDB();
        const index = db.reservations.findIndex(r => r.id === id);

        if (index === -1) {
            return false;
        }

        db.reservations.splice(index, 1);
        await this.writeDB(db);
        return true;
    }

    /**
     * Get all reservations with filters
     */
    static async getAllReservations(filters = {}, pagination = { page: 1, limit: 50 }) {
        const db = await this.readDB();
        let reservations = [...db.reservations];

        // Apply filters
        if (filters.date) {
            reservations = reservations.filter(r => r.date === filters.date);
        }

        if (filters.status) {
            reservations = reservations.filter(r => r.status === filters.status);
        }

        // Sort by date and time
        reservations.sort((a, b) => {
            const dateCompare = new Date(a.date) - new Date(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.time.localeCompare(b.time);
        });

        // Pagination
        const startIndex = (pagination.page - 1) * pagination.limit;
        const paginatedReservations = reservations.slice(startIndex, startIndex + pagination.limit);

        return {
            reservations: paginatedReservations,
            total: reservations.length,
            page: pagination.page,
            totalPages: Math.ceil(reservations.length / pagination.limit)
        };
    }

    /**
     * Get statistics
     */
    static async getStats() {
        const db = await this.readDB();
        const today = new Date().toISOString().split('T')[0];

        const stats = {
            total: db.reservations.length,
            pending: db.reservations.filter(r => r.status === 'pending').length,
            confirmed: db.reservations.filter(r => r.status === 'confirmed').length,
            cancelled: db.reservations.filter(r => r.status === 'cancelled').length,
            todayReservations: db.reservations.filter(r => r.date === today).length,
            upcomingReservations: db.reservations.filter(r =>
                r.date >= today &&
                (r.status === 'confirmed' || r.status === 'pending')
            ).length
        };

        // Calculate total guests
        stats.totalGuests = db.reservations
            .filter(r => r.status === 'confirmed' || r.status === 'pending')
            .reduce((sum, r) => sum + r.guests, 0);

        return stats;
    }

    /**
     * Get dashboard data for a specific date
     */
    static async getDashboardData(date) {
        const db = await this.readDB();
        const config = await this.getConfig();

        const dayReservations = db.reservations.filter(r =>
            r.date === date &&
            (r.status === 'confirmed' || r.status === 'pending')
        );

        // Organize by service
        const lunch = dayReservations.filter(r =>
            config.timeSlots.lunch.includes(r.time)
        );

        const dinner = dayReservations.filter(r =>
            config.timeSlots.dinner.includes(r.time)
        );

        // Calculate capacity usage
        const totalCapacity = config.tables.reduce((sum, t) => sum + t.capacity, 0);
        const lunchGuests = lunch.reduce((sum, r) => sum + r.guests, 0);
        const dinnerGuests = dinner.reduce((sum, r) => sum + r.guests, 0);

        return {
            date,
            lunch: {
                reservations: lunch,
                totalGuests: lunchGuests,
                capacityUsage: Math.round((lunchGuests / totalCapacity) * 100)
            },
            dinner: {
                reservations: dinner,
                totalGuests: dinnerGuests,
                capacityUsage: Math.round((dinnerGuests / totalCapacity) * 100)
            },
            tables: config.tables,
            totalCapacity
        };
    }

    /**
     * Update restaurant configuration
     */
    static async updateConfig(updates) {
        await this.initDB();
        const currentConfig = await this.getConfig();

        const updatedConfig = {
            ...currentConfig,
            ...updates
        };

        await fs.writeFile(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2));
        return updatedConfig;
    }
}

module.exports = ReservationService;
