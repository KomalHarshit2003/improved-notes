// server.js file - COMPLETE REWRITE
const express = require('express');
const bodyParser = require('body-parser');
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require('crypto');

// Create Express server
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(bodyParser.json());
const corsOptions = {
    origin: '*',
    methods: "*",
    allowedHeaders: "*",
};
app.use('/api', cors(corsOptions));

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const IV_LENGTH = 16;

// Encryption utilities
function encrypt(text) {
  try {
    if (!text) return text;
    
    // Convert text to string if it's not already
    const textToEncrypt = String(text);
    
    // Generate IV
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    // Encrypt
    let encrypted = cipher.update(textToEncrypt);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted.toString('hex');
    
  } catch (error) {
    console.error('Encryption error:', error);
    // Return original text if encryption fails
    return text;
  }
}

function decrypt(text) {
  try {
    // Handle non-encrypted data
    if (!text || typeof text !== 'string' || !text.includes(':')) {
      return text;
    }
    
    // Split IV and data
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    // Decrypt
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    // Return original text if decryption fails
    return text;
  }
}

// MongoDB connection
const dbURI = "mongodb+srv://komalharshit2003:Qazwsx%40123456@notes.cb9vb.mongodb.net/notes";
mongoose.connect(dbURI);

// MongoDB connection events
mongoose.connection.on("connected", () => {
    console.log("Connected to MongoDB Atlas");
});

mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
});

// Define MongoDB models
const User = mongoose.model("User", {
    email: { type: String, required: true, unique: true },
    secret: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const PendingSetup = mongoose.model("PendingSetup", {
    email: { type: String, required: true, unique: true },
    secret: { type: String, required: true },
    created: { type: Date, default: Date.now }
});

const Note = mongoose.model("Note", {
    title: { type: String, required: true },
    content: { type: String, required: true },
    date: String,
    userEmail: { type: String, required: true }
});

// Email setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'setupkeyforyrauthenticator@gmail.com',
        pass: 'ykwe uogh yxrb yhhi'
    }
});

// Helper function for sending setup emails
function sendSetupEmail(email, setupKey) {
    const mailOptions = {
        from: 'setupkeyforyrauthenticator@gmail.com',
        to: email,
        subject: 'Your Secure Authentication Setup',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #4285f4;">Complete Your Authentication Setup</h2>
                <p>Thank you for registering. To complete your setup, you need to configure Google Authenticator with the following key:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; text-align: center; font-family: monospace; font-size: 18px; margin: 20px 0;">
                    ${setupKey}
                </div>
                <h3>Setup Instructions:</h3>
                <ol>
                    <li>Install Google Authenticator on your smartphone</li>
                    <li>Open the app and tap the + button to add a new account</li>
                    <li>Select "Enter setup key"</li>
                    <li>Enter your email as the account name</li>
                    <li>Enter the setup key shown above</li>
                    <li>After adding the account, return to our website and enter the 6-digit code shown in the app to complete setup</li>
                </ol>
                <p>This setup key will expire in 1 hour for security reasons.</p>
                <p>If you did not request this setup, please ignore this email.</p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Email error:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });

    console.log(`Setup key for ${email}: ${setupKey}`);
}

// API ROUTES
// Register route
app.post('/api/register', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const secret = speakeasy.generateSecret({
            length: 20,
            name: `SecureApp:${email}`
        });

        await PendingSetup.findOneAndDelete({ email });
        
        await PendingSetup.create({
            email,
            secret: encrypt(secret.base32),
            created: new Date()
        });

        sendSetupEmail(email, secret.base32);

        res.json({
            success: true,
            message: 'Registration initiated. Please check your email for the setup key.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

// Verify setup route
app.post('/api/verify-setup', async (req, res) => {
    try {
        const { email, setupKey, totp } = req.body;

        if (!email || !setupKey || !totp) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const pendingSetup = await PendingSetup.findOne({ email });
        console.log("Pending setup for verification:", pendingSetup);
        
        if (!pendingSetup) {
            return res.status(400).json({ success: false, message: 'No pending setup found' });
        }

        const decryptedSecret = decrypt(pendingSetup.secret);
        
        if (decryptedSecret !== setupKey) {
            return res.status(400).json({ success: false, message: 'Invalid setup key' });
        }

        const verified = speakeasy.totp.verify({
            secret: decryptedSecret,
            encoding: 'base32',
            token: totp,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({ success: false, message: 'Invalid TOTP code' });
        }

        await User.create({
            email,
            secret: encrypt(setupKey),
            createdAt: new Date()
        });

        await PendingSetup.findOneAndDelete({ email });

        res.json({
            success: true,
            message: 'TOTP setup verified successfully'
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    try {
        const { email, totp } = req.body;

        if (!email || !totp) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        const decryptedSecret = decrypt(user.secret);
        
        const verified = speakeasy.totp.verify({
            secret: decryptedSecret,
            encoding: 'base32',
            token: totp,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({ success: false, message: 'Invalid TOTP code' });
        }

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

// Get notes route
app.get("/api/notes", async (req, res) => {
    try {
        const userEmail = req.query.userEmail;

        if(!userEmail) {
            return res.status(400).json({ message: "User email is required" });
        }
        
        console.log("Fetching notes for user:", userEmail);
        const notes = await Note.find({ userEmail });
        console.log(`Found ${notes.length} notes`);

        const decryptedNotes = notes.map(note => ({
            _id: note._id,
            title: decrypt(note.title),
            content: decrypt(note.content),
            date: note.date,
            userEmail: note.userEmail
        }));
        
        res.json(decryptedNotes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ message: error.message });
    }
});

// Update note route
app.put("/api/notes/:id", async (req, res) => {
    try {
        const { title, content, date, userEmail } = req.body;
        const noteId = req.params.id;

        console.log("Updating note:", noteId);
        console.log("Request data:", { title, date, userEmail });

        const existingNote = await Note.findById(noteId);
        if(!existingNote || existingNote.userEmail !== userEmail) {
            return res.status(403).json({ message: "You are not authorized to update this note" });
        }

        const encryptedTitle = encrypt(title);
        const encryptedContent = encrypt(content);
        
        const updatedNote = await Note.findByIdAndUpdate(
            noteId,
            { 
                title: encryptedTitle, 
                content: encryptedContent, 
                date 
            },
            { new: true }
        );
        
        console.log("Note updated successfully");
        
        res.json({
            _id: updatedNote._id,
            title: title,
            content: content,
            date: updatedNote.date,
            userEmail: updatedNote.userEmail
        });
    } catch (error) {
        console.error("Error updating note:", error);
        res.status(404).json({ message: "Note not found" });
    }
});

// Delete note route
app.delete("/api/notes/:id", async (req, res) => {
    try {
        const noteId = req.params.id;
        const userEmail = req.query.userEmail;

        console.log("Deleting note:", noteId, "for user:", userEmail);

        const existingNote = await Note.findById(noteId);
        if(!existingNote || existingNote.userEmail !== userEmail) {
            return res.status(403).json({ message: "You are not authorized to delete this note" });
        }
        
        await Note.findByIdAndDelete(noteId);
        console.log("Note deleted successfully");
        
        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(404).json({ message: "Note not found" });
    }
});

// Add note route
app.post("/api/notes", async (req, res) => {
    try {
        console.log("POST /api/notes - Request received");
        console.log("Request body:", req.body);
        
        const { title, content, date, userEmail } = req.body;

        if(!userEmail) {
            console.log("User email missing");
            return res.status(400).json({ message: "User email is required" });
        }

        if(!title || !content) {
            console.log("Title or content missing");
            return res.status(400).json({ message: "Title and content are required" });
        }

        console.log("Encrypting note for user:", userEmail);
        const encryptedTitle = encrypt(title);
        const encryptedContent = encrypt(content);
        
        console.log("Creating new note document");
        const note = new Note({
            title: encryptedTitle,
            content: encryptedContent,
            date: date || new Date().toLocaleDateString("en-GB"),
            userEmail
        });
        
        console.log("Saving note to database...");
        const newNote = await note.save();
        console.log("Note saved with ID:", newNote._id);
        
        res.status(201).json({
            _id: newNote._id,
            title: title,
            content: content,
            date: newNote.date,
            userEmail
        });
    } catch (error) {
        console.error("Error saving note:", error);
        res.status(400).json({ message: error.message });
    }
});

// Cleanup expired pending setups
setInterval(async () => {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const result = await PendingSetup.deleteMany({ created: { $lt: oneHourAgo } });
        if (result.deletedCount > 0) {
            console.log(`Removed ${result.deletedCount} expired setup requests`);
        }
    } catch (error) {
        console.error('Error cleaning up expired setups:', error);
    }
}, 60 * 60 * 1000);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});