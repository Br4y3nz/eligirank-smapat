 const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use your email service provider
    auth: {
        user: 'your-email@gmail.com', // Your email
        pass: 'your-email-password' // Your email password or app password
    }
});

// In-memory storage for codes (for demonstration purposes)
let verificationCodes = {};

// Generate a random 6-digit code
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Forgot Password Endpoint
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;

    // Here you would typically check if the email exists in your database

    const code = generateCode();
    const expirationTime = Date.now() + 5 * 60 * 1000; // 5 minutes from now

    // Store the code and expiration time
    verificationCodes[email] = { code, expirationTime };

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Password Reset Request',
        text: `Your verification code is: ${code}. It will expire in 5 minutes.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error sending email');
        }
        res.status(200).send('Password reset email sent successfully');
    });
});

// Verify Code Endpoint
app.post('/api/verify-code', (req, res) => {
    const { email, code } = req.body;

    const storedData = verificationCodes[email];

    if (!storedData) {
        return res.status(400).send('No verification code found for this email.');
    }

    const { code: storedCode, expirationTime } = storedData;

    if (Date.now() > expirationTime) {
        delete verificationCodes[email]; // Remove expired code
        return res.status(400).send('Verification code has expired.');
    }

    if (code === storedCode) {
        delete verificationCodes[email]; // Remove used code
        return res.status(200).send('Verification code is valid.');
    } else {
        return res.status(400).send('Invalid verification code.');
    }
});

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://YOUR_PROJECT_URL.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// User Registration Endpoint
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    const { user, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        return res.status(400).send('Registration failed: ' + error.message);
    }

    res.status(200).send('Registration successful! User ID: ' + user.id);
});

// User Login Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const { user, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return res.status(400).send('Login failed: ' + error.message);
    }

    res.status(200).send('Login successful! User ID: ' + user.id);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

 const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use your email service provider
    auth: {
        user: 'your-email@gmail.com', // Your email
        pass: 'your-email-password' // Your email password or app password
    }
});

// In-memory storage for codes (for demonstration purposes)
let verificationCodes = {};

// Generate a random 6-digit code
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Forgot Password Endpoint
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;

    // Here you would typically check if the email exists in your database

    const code = generateCode();
    const expirationTime = Date.now() + 5 * 60 * 1000; // 5 minutes from now

    // Store the code and expiration time
    verificationCodes[email] = { code, expirationTime };

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Password Reset Request',
        text: `Your verification code is: ${code}. It will expire in 5 minutes.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error sending email');
        }
        res.status(200).send('Password reset email sent successfully');
    });
});

// Verify Code Endpoint
app.post('/api/verify-code', (req, res) => {
    const { email, code } = req.body;

    const storedData = verificationCodes[email];

    if (!storedData) {
        return res.status(400).send('No verification code found for this email.');
    }

    const { code: storedCode, expirationTime } = storedData;

    if (Date.now() > expirationTime) {
        delete verificationCodes[email]; // Remove expired code
        return res.status(400).send('Verification code has expired.');
    }

    if (code === storedCode) {
        delete verificationCodes[email]; // Remove used code
        return res.status(200).send('Verification code is valid.');
    } else {
        return res.status(400).send('Invalid verification code.');
    }
});

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yauwsxvgjmmyleheclpi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdXdzeHZnam1teWxlaGVjbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDY3NjUsImV4cCI6MjA2MDQ4Mjc2NX0.sIXEAS4gW2WLB7vk_359Jp3QB6R9NT3Qv9gGdE9u2JY';
const supabase = createClient(supabaseUrl, supabaseKey);

// User Registration Endpoint
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    const { user, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        return res.status(400).send('Registration failed: ' + error.message);
    }

    res.status(200).send('Registration successful! User ID: ' + user.id);
});

// User Login Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const { user, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return res.status(400).send('Login failed: ' + error.message);
    }

    res.status(200).send('Login successful! User ID: ' + user.id);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
