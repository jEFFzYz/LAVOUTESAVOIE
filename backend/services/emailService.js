/**
 * Email Service
 * Handles all email communications using OVH SMTP
 */

const nodemailer = require('nodemailer');

// Create transporter with OVH SMTP settings
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'ssl0.ovh.net',
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: true, // SSL
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false // For self-signed certificates
        }
    });
};

// Email templates
const templates = {
    /**
     * Customer confirmation email (sent when reservation is created)
     */
    customerConfirmation: (reservation) => ({
        subject: `Demande de réservation - La Voûte Savoie`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demande de réservation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #151515; border-radius: 8px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #222;">
                            <h1 style="margin: 0; color: #c9a962; font-size: 28px; font-weight: 400; letter-spacing: 2px;">La Voûte</h1>
                            <p style="margin: 5px 0 0; color: #666; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Savoie</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 22px; font-weight: 400;">
                                Bonjour ${reservation.name},
                            </h2>

                            <p style="margin: 0 0 30px; color: #b3b3b3; font-size: 16px; line-height: 1.6;">
                                Nous avons bien reçu votre demande de réservation. Notre équipe va la traiter dans les plus brefs délais.
                            </p>

                            <!-- Reservation Details -->
                            <div style="background-color: #1a1a1a; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                                <h3 style="margin: 0 0 20px; color: #c9a962; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">
                                    Détails de votre réservation
                                </h3>

                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #222;">
                                            <span style="color: #666; font-size: 14px;">Date</span>
                                        </td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #222; text-align: right;">
                                            <span style="color: #ffffff; font-size: 14px;">${formatDate(reservation.date)}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #222;">
                                            <span style="color: #666; font-size: 14px;">Heure</span>
                                        </td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #222; text-align: right;">
                                            <span style="color: #ffffff; font-size: 14px;">${reservation.time}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #222;">
                                            <span style="color: #666; font-size: 14px;">Convives</span>
                                        </td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #222; text-align: right;">
                                            <span style="color: #ffffff; font-size: 14px;">${reservation.guests} personne${reservation.guests > 1 ? 's' : ''}</span>
                                        </td>
                                    </tr>
                                    ${reservation.message ? `
                                    <tr>
                                        <td colspan="2" style="padding: 15px 0 0;">
                                            <span style="color: #666; font-size: 14px;">Message :</span>
                                            <p style="margin: 5px 0 0; color: #b3b3b3; font-size: 14px; font-style: italic;">"${reservation.message}"</p>
                                        </td>
                                    </tr>
                                    ` : ''}
                                </table>
                            </div>

                            <p style="margin: 0 0 10px; color: #b3b3b3; font-size: 14px; line-height: 1.6;">
                                <strong style="color: #ffffff;">Statut :</strong>
                                <span style="color: #fbbf24;">En attente de confirmation</span>
                            </p>

                            <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                                Vous recevrez un email de confirmation dans les 24 heures.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #111; border-top: 1px solid #222;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 5px; color: #ffffff; font-size: 14px;">La Voûte Savoie</p>
                                        <p style="margin: 0; color: #666; font-size: 12px;">Rue de la Voûte, 73600 Moûtiers</p>
                                        <p style="margin: 5px 0 0; color: #666; font-size: 12px;">
                                            <a href="tel:+33479000000" style="color: #c9a962; text-decoration: none;">04 79 00 00 00</a>
                                        </p>
                                    </td>
                                    <td style="text-align: right; vertical-align: top;">
                                        <p style="margin: 0; color: #666; font-size: 11px;">Maître Restaurateur</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        text: `
La Voûte Savoie - Demande de réservation

Bonjour ${reservation.name},

Nous avons bien reçu votre demande de réservation.

Détails :
- Date : ${formatDate(reservation.date)}
- Heure : ${reservation.time}
- Convives : ${reservation.guests} personne${reservation.guests > 1 ? 's' : ''}
${reservation.message ? `- Message : ${reservation.message}` : ''}

Statut : En attente de confirmation

Vous recevrez un email de confirmation dans les 24 heures.

---
La Voûte Savoie
Rue de la Voûte, 73600 Moûtiers
Tél : 04 79 00 00 00
        `
    }),

    /**
     * Restaurant notification (sent to restaurant when new reservation)
     */
    restaurantNotification: (reservation) => ({
        subject: `🍽️ Nouvelle réservation - ${reservation.name} - ${formatDate(reservation.date)} à ${reservation.time}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Nouvelle réservation</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background-color: #c9a962; padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: #0a0a0a; font-size: 20px;">Nouvelle demande de réservation</h1>
        </div>

        <div style="padding: 30px;">
            <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                <tr style="background-color: #f9f9f9;">
                    <td style="border: 1px solid #eee; font-weight: bold; width: 150px;">Nom</td>
                    <td style="border: 1px solid #eee;">${reservation.name}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #eee; font-weight: bold;">Email</td>
                    <td style="border: 1px solid #eee;"><a href="mailto:${reservation.email}">${reservation.email}</a></td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                    <td style="border: 1px solid #eee; font-weight: bold;">Téléphone</td>
                    <td style="border: 1px solid #eee;"><a href="tel:${reservation.phone}">${formatPhone(reservation.phone)}</a></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #eee; font-weight: bold;">Date</td>
                    <td style="border: 1px solid #eee;"><strong>${formatDate(reservation.date)}</strong></td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                    <td style="border: 1px solid #eee; font-weight: bold;">Heure</td>
                    <td style="border: 1px solid #eee;"><strong>${reservation.time}</strong></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #eee; font-weight: bold;">Convives</td>
                    <td style="border: 1px solid #eee;"><strong>${reservation.guests}</strong> personne${reservation.guests > 1 ? 's' : ''}</td>
                </tr>
                ${reservation.tableName ? `
                <tr style="background-color: #f9f9f9;">
                    <td style="border: 1px solid #eee; font-weight: bold;">Table suggérée</td>
                    <td style="border: 1px solid #eee;">${reservation.tableName}</td>
                </tr>
                ` : ''}
                ${reservation.message ? `
                <tr>
                    <td style="border: 1px solid #eee; font-weight: bold;">Message</td>
                    <td style="border: 1px solid #eee; font-style: italic;">${reservation.message}</td>
                </tr>
                ` : ''}
            </table>

            <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 4px; text-align: center;">
                <p style="margin: 0; color: #856404;">
                    <strong>Action requise :</strong> Confirmer ou refuser cette réservation
                </p>
            </div>

            <p style="margin-top: 20px; color: #666; font-size: 12px;">
                ID de réservation : ${reservation.id}<br>
                Reçue le : ${new Date(reservation.createdAt).toLocaleString('fr-FR')}
            </p>
        </div>
    </div>
</body>
</html>
        `,
        text: `
NOUVELLE RÉSERVATION

Nom: ${reservation.name}
Email: ${reservation.email}
Téléphone: ${formatPhone(reservation.phone)}
Date: ${formatDate(reservation.date)}
Heure: ${reservation.time}
Convives: ${reservation.guests}
${reservation.tableName ? `Table suggérée: ${reservation.tableName}` : ''}
${reservation.message ? `Message: ${reservation.message}` : ''}

ID: ${reservation.id}
Reçue le: ${new Date(reservation.createdAt).toLocaleString('fr-FR')}
        `
    }),

    /**
     * Confirmation email (sent when reservation is confirmed)
     */
    reservationConfirmed: (reservation) => ({
        subject: `✅ Réservation confirmée - La Voûte Savoie`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réservation confirmée</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #151515; border-radius: 8px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #222;">
                            <h1 style="margin: 0; color: #c9a962; font-size: 28px; font-weight: 400; letter-spacing: 2px;">La Voûte</h1>
                            <p style="margin: 5px 0 0; color: #666; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Savoie</p>
                        </td>
                    </tr>

                    <!-- Success Banner -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: rgba(74, 222, 128, 0.1); text-align: center;">
                            <span style="display: inline-block; width: 50px; height: 50px; background-color: #4ade80; border-radius: 50%; line-height: 50px; font-size: 24px;">✓</span>
                            <h2 style="margin: 15px 0 0; color: #4ade80; font-size: 20px; font-weight: 400;">
                                Réservation confirmée !
                            </h2>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 30px; color: #b3b3b3; font-size: 16px; line-height: 1.6;">
                                Cher(e) ${reservation.name},<br><br>
                                Nous avons le plaisir de vous confirmer votre réservation. Notre équipe vous attend avec impatience.
                            </p>

                            <!-- Reservation Details -->
                            <div style="background-color: #1a1a1a; border-radius: 8px; padding: 25px; margin-bottom: 30px; border: 1px solid #c9a962;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #222;">
                                            <span style="color: #c9a962; font-size: 14px;">📅 Date</span>
                                        </td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #222; text-align: right;">
                                            <span style="color: #ffffff; font-size: 16px; font-weight: bold;">${formatDate(reservation.date)}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #222;">
                                            <span style="color: #c9a962; font-size: 14px;">🕐 Heure</span>
                                        </td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #222; text-align: right;">
                                            <span style="color: #ffffff; font-size: 16px; font-weight: bold;">${reservation.time}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0;">
                                            <span style="color: #c9a962; font-size: 14px;">👥 Convives</span>
                                        </td>
                                        <td style="padding: 10px 0; text-align: right;">
                                            <span style="color: #ffffff; font-size: 16px; font-weight: bold;">${reservation.guests} personne${reservation.guests > 1 ? 's' : ''}</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <p style="margin: 0 0 20px; color: #b3b3b3; font-size: 14px; line-height: 1.6;">
                                <strong style="color: #ffffff;">Informations pratiques :</strong>
                            </p>
                            <ul style="margin: 0; padding-left: 20px; color: #b3b3b3; font-size: 14px; line-height: 2;">
                                <li>Merci de nous prévenir en cas d'empêchement</li>
                                <li>Une tolérance de 15 minutes est accordée</li>
                                <li>Un parking est disponible à proximité</li>
                            </ul>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #111; border-top: 1px solid #222;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 5px; color: #ffffff; font-size: 14px;">La Voûte Savoie</p>
                                        <p style="margin: 0; color: #666; font-size: 12px;">Rue de la Voûte, 73600 Moûtiers</p>
                                        <p style="margin: 5px 0 0; color: #666; font-size: 12px;">
                                            <a href="tel:+33479000000" style="color: #c9a962; text-decoration: none;">04 79 00 00 00</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        text: `
RÉSERVATION CONFIRMÉE - La Voûte Savoie

Cher(e) ${reservation.name},

Nous avons le plaisir de vous confirmer votre réservation.

Détails :
- Date : ${formatDate(reservation.date)}
- Heure : ${reservation.time}
- Convives : ${reservation.guests} personne${reservation.guests > 1 ? 's' : ''}

Informations pratiques :
- Merci de nous prévenir en cas d'empêchement
- Une tolérance de 15 minutes est accordée
- Un parking est disponible à proximité

À très bientôt !

---
La Voûte Savoie
Rue de la Voûte, 73600 Moûtiers
Tél : 04 79 00 00 00
        `
    }),

    /**
     * Cancellation email
     */
    reservationCancelled: (reservation) => ({
        subject: `Réservation annulée - La Voûte Savoie`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Réservation annulée</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #151515; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #222;">
                            <h1 style="margin: 0; color: #c9a962; font-size: 28px; font-weight: 400; letter-spacing: 2px;">La Voûte</h1>
                            <p style="margin: 5px 0 0; color: #666; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Savoie</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #f87171; font-size: 20px; font-weight: 400;">
                                Réservation annulée
                            </h2>

                            <p style="margin: 0 0 20px; color: #b3b3b3; font-size: 16px; line-height: 1.6;">
                                Cher(e) ${reservation.name},<br><br>
                                Nous vous informons que votre réservation du <strong>${formatDate(reservation.date)}</strong> à <strong>${reservation.time}</strong> a été annulée.
                            </p>

                            ${reservation.cancellationReason ? `
                            <p style="margin: 0 0 20px; color: #666; font-size: 14px; font-style: italic;">
                                Raison : ${reservation.cancellationReason}
                            </p>
                            ` : ''}

                            <p style="margin: 0; color: #b3b3b3; font-size: 14px; line-height: 1.6;">
                                N'hésitez pas à nous contacter pour effectuer une nouvelle réservation.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 30px 40px; background-color: #111; border-top: 1px solid #222; text-align: center;">
                            <p style="margin: 0; color: #666; font-size: 12px;">
                                <a href="tel:+33479000000" style="color: #c9a962; text-decoration: none;">04 79 00 00 00</a> |
                                <a href="mailto:contact@lavoutesavoie.fr" style="color: #c9a962; text-decoration: none;">contact@lavoutesavoie.fr</a>
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
        text: `
RÉSERVATION ANNULÉE - La Voûte Savoie

Cher(e) ${reservation.name},

Nous vous informons que votre réservation du ${formatDate(reservation.date)} à ${reservation.time} a été annulée.

${reservation.cancellationReason ? `Raison : ${reservation.cancellationReason}` : ''}

N'hésitez pas à nous contacter pour effectuer une nouvelle réservation.

---
La Voûte Savoie
Tél : 04 79 00 00 00
Email : contact@lavoutesavoie.fr
        `
    })
};

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

function formatPhone(phone) {
    // Format: XX XX XX XX XX
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (match) {
        return `${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
    }
    return phone;
}

class EmailService {
    /**
     * Send customer confirmation email
     */
    static async sendCustomerConfirmation(reservation) {
        const transporter = createTransporter();
        const template = templates.customerConfirmation(reservation);

        await transporter.sendMail({
            from: `"La Voûte Savoie" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: reservation.email,
            subject: template.subject,
            text: template.text,
            html: template.html
        });

        console.log(`Customer confirmation email sent to ${reservation.email}`);
    }

    /**
     * Send restaurant notification email
     */
    static async sendRestaurantNotification(reservation) {
        const transporter = createTransporter();
        const template = templates.restaurantNotification(reservation);

        await transporter.sendMail({
            from: `"Système de réservation" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: process.env.RESTAURANT_EMAIL || process.env.SMTP_USER,
            subject: template.subject,
            text: template.text,
            html: template.html
        });

        console.log(`Restaurant notification sent for reservation ${reservation.id}`);
    }

    /**
     * Send reservation confirmed email
     */
    static async sendReservationConfirmed(reservation) {
        const transporter = createTransporter();
        const template = templates.reservationConfirmed(reservation);

        await transporter.sendMail({
            from: `"La Voûte Savoie" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: reservation.email,
            subject: template.subject,
            text: template.text,
            html: template.html
        });

        console.log(`Confirmation email sent to ${reservation.email}`);
    }

    /**
     * Send reservation cancelled email
     */
    static async sendReservationCancelled(reservation) {
        const transporter = createTransporter();
        const template = templates.reservationCancelled(reservation);

        await transporter.sendMail({
            from: `"La Voûte Savoie" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: reservation.email,
            subject: template.subject,
            text: template.text,
            html: template.html
        });

        console.log(`Cancellation email sent to ${reservation.email}`);
    }

    /**
     * Test SMTP connection
     */
    static async testConnection() {
        try {
            const transporter = createTransporter();
            await transporter.verify();
            console.log('SMTP connection successful');
            return true;
        } catch (error) {
            console.error('SMTP connection failed:', error);
            return false;
        }
    }
}

module.exports = EmailService;
