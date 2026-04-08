const express = require('express');
const multer = require('multer');
const { Resend } = require('resend');
const path = require('path');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ─────────────────────────────────────────────
// CONTACT / APPRAISAL REQUEST FORM
// What it does: When a client fills out the contact
// form on the website, this sends you an email with
// their name, phone, email, service type & message.
// ─────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, service, date, message } = req.body;

    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'mensahenoch020@gmail.com',
            subject: `New Appraisal Request from ${name}`,
            html: `
                <h2>New Appraisal Request</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Service Needed:</strong> ${service}</p>
                <p><strong>Preferred Date:</strong> ${date || 'Not specified'}</p>
                <p><strong>Message:</strong> ${message || 'None'}</p>
            `
        });

        res.json({ success: true, message: 'Your request has been sent! We will contact you shortly.' });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ success: false, message: 'Something went wrong. Please call us directly.' });
    }
});

// ─────────────────────────────────────────────
// RESUME SUBMISSION FORM
// What it does: When someone applies for a job,
// this sends you an email with their details and
// their resume attached so you can review it.
// ─────────────────────────────────────────────
app.post('/api/resume', upload.single('resume'), async (req, res) => {
    const { name, email, phone, position } = req.body;
    const file = req.file;

    try {
        const emailData = {
            from: 'onboarding@resend.dev',
            to: 'mensahenoch020@gmail.com',
            subject: `New Resume Submission from ${name}`,
            html: `
                <h2>New Resume Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Position Applying For:</strong> ${position || 'General Application'}</p>
                ${file ? `<p><strong>Resume:</strong> Attached (${file.originalname})</p>` : '<p>No resume file attached.</p>'}
            `,
        };

        if (file) {
            emailData.attachments = [{
                filename: file.originalname,
                content: file.buffer.toString('base64'),
            }];
        }

        await resend.emails.send(emailData);
        res.json({ success: true, message: 'Your resume has been submitted! We will be in touch.' });
    } catch (error) {
        console.error('Resume submission error:', error);
        res.status(500).json({ success: false, message: 'Something went wrong. Please email us directly.' });
    }
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Charles City Appraisal server running on port ${PORT}`);
});
