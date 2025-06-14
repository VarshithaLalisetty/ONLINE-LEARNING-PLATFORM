const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/taaraa_learning', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    progress: {
        completedCourses: { type: Number, default: 0 },
        quizzesPassed: { type: Number, default: 0 },
        totalHours: { type: Number, default: 0 }
    },
    courseProgress: [{
        courseId: Number,
        progress: Number,
        completed: Boolean,
        quizScore: Number
    }]
});

// Course Schema
const courseSchema = new mongoose.Schema({
    id: Number,
    title: String,
    description: String,
    thumbnail: String,
    videoUrl: String,
    quiz: [{
        question: String,
        options: [String],
        correctAnswer: Number
    }]
});

const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);

// Authentication Middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new Error();
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

// Routes

// Register user
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '24h' });

        res.status(201).json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '24h' });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user progress
app.get('/api/progress', auth, async (req, res) => {
    try {
        res.json(req.user.progress);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update course progress
app.post('/api/progress/course/:courseId', auth, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { progress, quizScore } = req.body;

        const courseProgress = req.user.courseProgress.find(cp => cp.courseId === parseInt(courseId));

        if (courseProgress) {
            courseProgress.progress = progress;
            if (quizScore) {
                courseProgress.quizScore = quizScore;
                if (quizScore >= 70) {
                    courseProgress.completed = true;
                    req.user.progress.quizzesPassed++;
                    if (progress === 100) {
                        req.user.progress.completedCourses++;
                        req.user.progress.totalHours += 2; // Assume 2 hours per course
                    }
                }
            }
        } else {
            req.user.courseProgress.push({
                courseId: parseInt(courseId),
                progress,
                quizScore,
                completed: quizScore >= 70
            });
        }

        await req.user.save();
        res.json(req.user.progress);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all courses
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get specific course
app.get('/api/courses/:courseId', async (req, res) => {
    try {
        const course = await Course.findOne({ id: req.params.courseId });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});