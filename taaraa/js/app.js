// Sample course data - In a real application, this would come from a backend API
const courses = [
    {
        id: 1,
        title: 'Introduction to Web Development',
        description: 'Learn the basics of HTML, CSS, and JavaScript',
        thumbnail: 'https://placehold.co/600x400',
        videoUrl: 'path/to/video.mp4',
        progress: 0,
        quiz: [
            {
                question: 'What does HTML stand for?',
                options: [
                    'Hyper Text Markup Language',
                    'High Tech Modern Language',
                    'Hyper Transfer Markup Language',
                    'Home Tool Markup Language'
                ],
                correctAnswer: 0
            },
            {
                question: 'Which property is used to change the background color?',
                options: [
                    'color',
                    'bgcolor',
                    'background-color',
                    'background'
                ],
                correctAnswer: 2
            }
        ]
    },
    // Add more courses here
];

// DOM Elements
const courseGrid = document.querySelector('.course-grid');
const videoModal = document.getElementById('videoModal');
const quizModal = document.getElementById('quizModal');
const videoPlayer = document.getElementById('videoPlayer');
const quizContainer = document.getElementById('quizContainer');
const loginBtn = document.getElementById('loginBtn');

// User progress data - In a real application, this would be stored in a database
let userProgress = {
    completedCourses: 0,
    quizzesPassed: 0,
    totalHours: 0
};

// Initialize the application
function init() {
    loadCourses();
    updateProgressStats();
    setupEventListeners();
}

// Load courses into the grid
function loadCourses() {
    courseGrid.innerHTML = courses.map(course => `
        <div class="course-card" data-course-id="${course.id}">
            <img src="${course.thumbnail}" alt="${course.title}" class="course-image">
            <div class="course-content">
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <div class="course-progress">
                    <div class="progress-bar" style="width: ${course.progress}%"></div>
                </div>
                <button class="cta-btn watch-btn">Watch Video</button>
                <button class="cta-btn quiz-btn">Take Quiz</button>
            </div>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Course video buttons
    document.querySelectorAll('.watch-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const courseId = e.target.closest('.course-card').dataset.courseId;
            openVideoPlayer(courseId);
        });
    });

    // Course quiz buttons
    document.querySelectorAll('.quiz-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const courseId = e.target.closest('.course-card').dataset.courseId;
            openQuiz(courseId);
        });
    });

    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            videoModal.style.display = 'none';
            quizModal.style.display = 'none';
            videoPlayer.pause();
        });
    });

    // Submit quiz button
    document.getElementById('submitQuiz').addEventListener('click', submitQuiz);

    // Login button
    loginBtn.addEventListener('click', handleLogin);
}

// Open video player modal
function openVideoPlayer(courseId) {
    const course = courses.find(c => c.id === parseInt(courseId));
    videoPlayer.src = course.videoUrl;
    videoModal.style.display = 'block';

    // Track progress
    videoPlayer.addEventListener('ended', () => {
        updateCourseProgress(courseId, 50); // 50% progress for watching video
    });
}

// Open quiz modal
function openQuiz(courseId) {
    const course = courses.find(c => c.id === parseInt(courseId));
    const quizHtml = course.quiz.map((q, index) => `
        <div class="quiz-question" data-question="${index}">
            <h3>Question ${index + 1}: ${q.question}</h3>
            <div class="quiz-options">
                ${q.options.map((option, optIndex) => `
                    <div class="quiz-option" data-option="${optIndex}">
                        ${option}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    document.getElementById('quizQuestions').innerHTML = quizHtml;
    quizModal.style.display = 'block';

    // Add click handlers for quiz options
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const questionDiv = e.target.closest('.quiz-question');
            questionDiv.querySelectorAll('.quiz-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            e.target.classList.add('selected');
        });
    });
}

// Submit quiz answers
function submitQuiz() {
    const selectedAnswers = Array.from(document.querySelectorAll('.quiz-question')).map(q => {
        const selected = q.querySelector('.quiz-option.selected');
        return selected ? parseInt(selected.dataset.option) : -1;
    });

    const courseId = document.querySelector('.course-card').dataset.courseId;
    const course = courses.find(c => c.id === parseInt(courseId));
    
    // Calculate score
    const correctAnswers = selectedAnswers.filter((answer, index) => 
        answer === course.quiz[index].correctAnswer
    ).length;
    
    const score = (correctAnswers / course.quiz.length) * 100;

    if (score >= 70) { // Pass threshold
        userProgress.quizzesPassed++;
        updateCourseProgress(courseId, 100); // Complete the course
        alert(`Congratulations! You passed with ${score}%`);
    } else {
        alert(`You scored ${score}%. Try again to pass.`);
    }

    quizModal.style.display = 'none';
    updateProgressStats();
}

// Update course progress
function updateCourseProgress(courseId, progress) {
    const course = courses.find(c => c.id === parseInt(courseId));
    if (progress > course.progress) {
        course.progress = progress;
        if (progress === 100) {
            userProgress.completedCourses++;
            userProgress.totalHours += 2; // Assume 2 hours per course
        }
        loadCourses(); // Refresh course display
        updateProgressStats();
    }
}

// Update progress statistics display
function updateProgressStats() {
    document.getElementById('completedCourses').textContent = userProgress.completedCourses;
    document.getElementById('quizzesPassed').textContent = userProgress.quizzesPassed;
    document.getElementById('totalHours').textContent = userProgress.totalHours;
}

// Handle login (to be implemented)
function handleLogin() {
    alert('Login functionality to be implemented');
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);