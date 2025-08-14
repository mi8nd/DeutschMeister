import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, getDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { auth, db } from './firebase.js';
import { handleSignUp, handleLogin, handleSignInWithGoogle, handleLogout, handleLogoutAndReset, handleDeleteAccount, handlePasswordReset, handleVerifyPasswordResetCode, handleConfirmPasswordReset, handleChangePassword } from './auth.js';
import { fetchPlaylistVideoCounts, fetchAndCacheAllVideos, PLAYLISTS } from './youtube.js';
import { quizData } from './quiz.js';
import { translations } from './translations.js';

// Global State
let courseData = {}, currentUser = null, userProgress = {}, currentLevel = null;
let currentPlaylist = [], currentQuiz = [], currentQuestionIndex = 0, score = 0;
let player, timestampInterval;
const elements = {};
let oobCode = null;
let allVideosData = {};
let deferredInstallPrompt = null;

// Helper Functions
const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
};

const applyTheme = (theme) => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    const toggleIcon = document.querySelector('#dark-mode-toggle .material-symbols-outlined');
    if (toggleIcon) {
        toggleIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }
};

// Language and Translation Logic
const setLanguage = (lang) => {
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        const translation = translations[lang]?.[key] || translations['en'][key];
        if (translation) {
            el.textContent = translation;
        }
    });
    // Re-render components that display dynamic strings that are not part of data-translate-key
    // For example, welcome message, no recent activity, and potentially video titles if cached without language in mind
    if (currentUser) {
        renderUserDashboard();
        renderContinueWatching();
        renderAllCourses(); // Re-render courses to update titles based on language
        renderQuizzesView(); // Re-render quizzes to update titles based on language
    }
    // Re-fetch/re-cache videos with new language titles
    fetchAndCacheAllVideos(lang).then(() => {
        if (currentLevel) {
            currentPlaylist = getPlaylistFromCache(currentLevel);
            renderVideoList(); // Re-render video list for the currently viewed course
        }
    });
};

const handleNavigation = (hash, updateHistory = true) => {
    const viewId = hash.substring(1) || 'home';
    if (document.querySelector('.view:not(.hidden)')?.id === 'video-player-view') {
        if (player?.stopVideo) player.stopVideo();
        if (elements.youtubePlayerContainer) elements.youtubePlayerContainer.innerHTML = '';
        clearInterval(timestampInterval);
    }
    document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
    const targetView = document.getElementById(`${viewId}-view`);
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.style.animation = 'viewFadeIn 0.5s ease-out forwards';
    } else {
        document.getElementById('home-view').classList.remove('hidden');
    }
    if (elements.sidebarNav) {
        elements.sidebarNav.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${viewId}`);
        });
    }
    if (updateHistory && window.location.hash !== `#${viewId}`) {
        history.pushState({ hash: viewId }, '', `#${viewId}`);
    }
    if (viewId === 'home' && currentUser) {
        renderUserDashboard();
        renderContinueWatching();
    }
};

const showView = (viewId) => handleNavigation(`#${viewId}`);

const showAuthForm = (isSignUp) => {
    const container = document.getElementById('auth-panel-container');
    if (container) {
        if (isSignUp) {
            container.classList.add("right-panel-active");
        } else {
            container.classList.remove("right-panel-active");
        }
    }
};

const getPlaylistFromCache = (level) => {
    const videosForLevel = Object.values(allVideosData).filter(video => video.level === level);
    videosForLevel.sort((a, b) => a.index - b.index);
    return videosForLevel;
};

// Mobile Menu Logic
const openMobileMenu = () => document.body.classList.add('sidebar-open');
const closeMobileMenu = () => document.body.classList.remove('sidebar-open');

// Smart Avatar Generation
const generateInitialsAvatar = (displayName) => {
    if (!displayName) {
        const defaultAvatar = document.createElement('span');
        defaultAvatar.className = 'material-symbols-outlined';
        defaultAvatar.textContent = 'person';
        return defaultAvatar;
    }
    const names = displayName.split(' ');
    const initials = names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : names[0].substring(0, 2);
    let hash = 0;
    for (let i = 0; i < displayName.length; i++) {
        hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 50%, 40%)`;
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'initials-avatar';
    avatarDiv.style.backgroundColor = color;
    avatarDiv.textContent = initials.toUpperCase();
    return avatarDiv;
};

// Direct Profile Picture Upload & Resize
async function handleProfilePictureUpload(e) {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image is too large. Please choose a file smaller than 5MB.', 'error');
        return;
    }
    elements.pfpSpinnerOverlay?.classList.remove('hidden');
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const targetSize = 256;
            canvas.width = targetSize;
            canvas.height = targetSize;
            const hRatio = canvas.width / img.width;
            const vRatio = canvas.height / img.height;
            const ratio = Math.max(hRatio, vRatio);
            const centerShift_x = (canvas.width - img.width * ratio) / 2;
            const centerShift_y = (canvas.height - img.height * ratio) / 2;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
            const base64String = canvas.toDataURL('image/jpeg', 0.9);
            try {
                const userDocRef = doc(db, "users", currentUser.uid);
                await updateDoc(userDocRef, { photoURL: base64String });
                userProgress.photoURL = base64String;
                renderProfileView();
                showToast('Profile picture updated!', 'success');
            } catch (error) {
                showToast('Failed to update picture. Please try again.', 'error');
            } finally {
                elements.pfpSpinnerOverlay?.classList.add('hidden');
            }
        };
        img.onerror = () => {
            showToast(translations[localStorage.getItem('language') || 'en'].invalidImageFormat, 'error'); // Translated
            elements.pfpSpinnerOverlay?.classList.add('hidden');
        };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

// Quiz Logic
const startQuiz = (level) => {
    currentLevel = level;
    // Select quiz data based on current language
    currentQuiz = quizData[localStorage.getItem('language') || 'en'][level] || [];
    if (!currentQuiz.length) { showToast("No quiz for this level yet.", "info"); return; }
    currentQuestionIndex = 0; score = 0;
    document.getElementById('quiz-results').classList.add('hidden');
    document.getElementById('quiz-content').classList.remove('hidden');
    document.getElementById('quiz-title').textContent = `${translations[localStorage.getItem('language') || 'en'].levelPrefix}${level} Quiz`; // Translated "Level X Quiz"
    displayQuestion();
    showView('quiz');
};

const displayQuestion = () => {
    const question = currentQuiz[currentQuestionIndex];
    // Special handling for True/False questions
    let optionsHTML;
    if (question.options.length === 2 && question.options.includes("True") && question.options.includes("False")) {
        const lang = localStorage.getItem('language') || 'en';
        optionsHTML = `<button class="btn quiz-option-btn" data-index="0">${translations[lang].trueOption}</button>` +
            `<button class="btn quiz-option-btn" data-index="1">${translations[lang].falseOption}</button>`;
    } else {
        optionsHTML = question.options.map((opt, i) => `<button class="btn quiz-option-btn" data-index="${i}">${opt}</button>`).join('');
    }
    document.getElementById('quiz-content').innerHTML = `<h3 id="quiz-question">${question.question}</h3><div id="quiz-options">${optionsHTML}</div><div id="quiz-feedback"></div>`;
};

const handleAnswer = (selectedIndex) => {
    const question = currentQuiz[currentQuestionIndex];
    const options = document.querySelectorAll('.quiz-option-btn');
    options.forEach(btn => btn.disabled = true);
    const feedbackEl = document.getElementById('quiz-feedback');
    const lang = localStorage.getItem('language') || 'en'; // Get current language

    if (selectedIndex === question.correctAnswer) {
        options[selectedIndex].classList.add('correct');
        feedbackEl.textContent = translations[lang].feedbackCorrect; // Translated "Correct!"
    } else {
        options[selectedIndex].classList.add('incorrect');
        options[question.correctAnswer].classList.add('correct');
        // Ensure the correct answer text is pulled from the displayed options if True/False, otherwise from the quiz data directly
        const correctAnswerText = (question.options[question.correctAnswer] === "True" || question.options[question.correctAnswer] === "False") ?
            (question.options[question.correctAnswer] === "True" ? translations[lang].trueOption : translations[lang].falseOption) :
            question.options[question.correctAnswer];
        feedbackEl.innerHTML = `${translations[lang].feedbackIncorrectPrefix}<strong>${correctAnswerText}</strong>. <br><em>${question.explanation || ''}</em>`; // Translated "Not quite..."
    }
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuiz.length) {
            displayQuestion();
        } else {
            showQuizResults();
        }
    }, 3000);
};

const showQuizResults = () => {
    document.getElementById('quiz-content').classList.add('hidden');
    document.getElementById('quiz-results').classList.remove('hidden');
    document.getElementById('quiz-score').textContent = `You scored ${score} out of ${currentQuiz.length}`;
};

// Video Player Logic
const saveTimestamp = async (videoId, time) => {
    if (!currentUser || time < 1) return;
    if (!userProgress.timestamps) userProgress.timestamps = {};
    userProgress.timestamps[videoId] = time;
    const userDocRef = doc(db, "users", currentUser.uid);
    await updateDoc(userDocRef, { [`timestamps.${videoId}`]: time });
};

const loadVideo = (videoId) => {
    if (player?.destroy) player.destroy();
    clearInterval(timestampInterval);
    const startTime = userProgress.timestamps?.[videoId] || 0;
    player = new YT.Player('youtube-player-container', {
        height: '100%', width: '100%', videoId: videoId,
        playerVars: { autoplay: 1, modestbranding: 1, rel: 0, start: Math.floor(startTime), origin: window.location.origin },
        events: {
            'onReady': () => {
                timestampInterval = setInterval(() => {
                    if (player?.getCurrentTime) saveTimestamp(videoId, player.getCurrentTime());
                }, 5000);
            }
        }
    });
    document.querySelectorAll('.video-item').forEach(item => item.classList.toggle('active', item.dataset.videoId === videoId));
};

// Rendering Functions
const renderUserDashboard = () => {
    const lang = localStorage.getItem('language') || 'en';
    elements.welcomeMessage.textContent = `${translations[lang].welcomeBackPrefix}${currentUser.displayName || 'User'}!`; // Translated "Welcome back, "
    const progressValues = Object.values(userProgress.progress || {});
    const videosCompleted = progressValues.reduce((sum, p) => sum + p, 0);
    const totalVideos = Object.values(courseData).reduce((sum, level) => sum + (level.totalVideos || 0), 0);
    const overallPercentage = totalVideos > 0 ? Math.round((videosCompleted / totalVideos) * 100) : 0;
    const circle = document.getElementById('progress-ring-circle');
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = circumference - (overallPercentage / 100) * circumference;
    }
    document.getElementById('progress-ring-text').textContent = `${overallPercentage}%`;
    document.getElementById('stat-videos-completed').textContent = videosCompleted;
};

const renderAllCourses = () => {
    const container = document.getElementById('courses-container');
    if (!container) return;
    container.innerHTML = '';
    const lang = localStorage.getItem('language') || 'en';
    Object.keys(PLAYLISTS).forEach((level, index) => {
        const total = courseData[level]?.totalVideos || 0;
        const section = document.createElement('section');
        section.className = 'course-level-section animated-card';
        section.style.animationDelay = `${index * 100}ms`;
        section.innerHTML = `<h3 class="section-title">${translations[lang].levelPrefix}${level}</h3><div class="courses-grid" id="grid-${level}"></div>`; // Translated "Level X"
        container.appendChild(section);
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `<div class="course-card-header"><h4 class="course-level">${translations[lang].fullCourse}</h4><p>${total}${translations[lang].lessonsCount}</p></div><p class="course-description">${translations[lang].courseDescription}</p><div class="course-actions"><button class="btn btn-primary start-course-btn" data-level="${level}">${translations[lang].startCourse}</button></div>`; // Translated "Full Course", "... Lessons", "Comprehensive lessons...", "Start Course"
        document.getElementById(`grid-${level}`).appendChild(card);
    });
};

const renderQuizzesView = () => {
    const container = document.getElementById('quizzes-container');
    if (!container) return;
    const lang = localStorage.getItem('language') || 'en';
    container.innerHTML = Object.keys(quizData.en).map((level, index) => `<div class="quiz-card animated-card" style="animation-delay: ${index * 100}ms"><h4 class="course-level">${translations[lang].levelPrefix}${level} Quiz</h4><p class="course-description">${translations[lang].quizzesDesc}</p><button class="btn btn-primary start-quiz-btn" data-level="${level}">${translations[lang].startQuiz}</button></div>`).join(''); // Translated "Level X Quiz", "Test your knowledge...", "Start Quiz"
};

const renderProfileView = () => {
    if (!elements.profileName) return;
    elements.profileName.textContent = currentUser.displayName;
    elements.profileEmail.textContent = currentUser.email;
    const pfpContainer = elements.pfpContainer;
    pfpContainer.innerHTML = '';
    if (userProgress.photoURL) {
        const img = document.createElement('img');
        img.src = userProgress.photoURL;
        img.alt = "Profile Picture";
        img.className = 'profile-avatar-img';
        pfpContainer.appendChild(img);
    } else {
        pfpContainer.appendChild(generateInitialsAvatar(currentUser.displayName));
    }
    const overlay = document.createElement('div');
    overlay.className = 'profile-avatar-overlay';
    overlay.innerHTML = '<span class="material-symbols-outlined">photo_camera</span>';
    pfpContainer.appendChild(overlay);
    const spinnerOverlay = document.createElement('div');
    spinnerOverlay.className = 'spinner-overlay hidden';
    spinnerOverlay.id = 'pfp-spinner-overlay';
    spinnerOverlay.innerHTML = '<div class="spinner"></div>';
    pfpContainer.appendChild(spinnerOverlay);
    elements.pfpSpinnerOverlay = spinnerOverlay;
};

const renderVideoList = () => {
    if (!elements.videoList) return;
    const completedVideos = userProgress.progress?.[currentLevel] || 0;
    elements.videoList.innerHTML = currentPlaylist.map((video, index) => {
        const isCompleted = index < completedVideos;
        return `<div class="video-item" data-video-id="${video.videoId}"><img src="${video.thumbnail}" alt="${video.title}" class="video-item-thumbnail"><div class="video-item-details"><h4>${video.title}</h4><button class="btn btn-secondary complete-btn" data-video-index="${index}" ${isCompleted ? 'disabled' : ''}>${isCompleted ? 'Completed' : 'Mark as Complete'}</button></div></div>`;
    }).join('');
};

const markVideoAsComplete = async (videoIndex) => {
    const newProgress = videoIndex + 1;
    if (newProgress <= (userProgress.progress?.[currentLevel] || 0)) return;
    showToast('Progress Saved!', 'success');
    if (!userProgress.progress) userProgress.progress = {};
    userProgress.progress[currentLevel] = newProgress;
    renderVideoList();
    renderUserDashboard();
    await updateDoc(doc(db, "users", currentUser.uid), { [`progress.${currentLevel}`]: newProgress });
};

const resetCourseProgress = async () => {
    if (!currentLevel) return;
    if (userProgress.progress) userProgress.progress[currentLevel] = 0;
    currentPlaylist.forEach(video => {
        if (userProgress.timestamps?.[video.videoId]) delete userProgress.timestamps[video.videoId];
    });
    renderVideoList();
    renderUserDashboard();
    await updateDoc(doc(db, "users", currentUser.uid), {
        [`progress.${currentLevel}`]: 0,
        timestamps: userProgress.timestamps
    });
    showToast(`Progress for Level ${currentLevel} has been reset.`, 'info');
};

const resetAllProgress = async () => {
    if (!currentUser) return;
    userProgress.progress = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
    userProgress.timestamps = {};
    await updateDoc(doc(db, "users", currentUser.uid), {
        progress: userProgress.progress,
        timestamps: userProgress.timestamps
    });
    renderUserDashboard();
    renderContinueWatching();
    showToast('All your progress has been reset.', 'info');
};

// New function to reset single video progress
const resetSingleVideoProgress = async (videoId) => {
    if (!currentUser) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    if (userProgress.timestamps?.[videoId] !== undefined) {
        delete userProgress.timestamps[videoId]; // Remove from local state
        await updateDoc(userDocRef, { [`timestamps.${videoId}`]: deleteField() }); // Use deleteField()
        showToast(translations[localStorage.getItem('language') || 'en'].videoProgressReset, 'info'); // New translation key
        renderContinueWatching(); // Re-render the activity list to remove the card
    }
};

const renderContinueWatching = () => {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    activityList.innerHTML = '';
    const timestamps = userProgress.timestamps || {};
    const progress = userProgress.progress || {};
    let inProgressVideos = [];
    for (const videoId in timestamps) {
        if (timestamps[videoId] < 5) continue;
        const videoInfo = allVideosData[videoId];
        if (!videoInfo) continue;
        const level = videoInfo.level;
        const completedInLevel = progress[level] || 0;
        if (videoInfo.index >= completedInLevel) {
            inProgressVideos.push({ ...videoInfo, timestamp: timestamps[videoId] });
        }
    }
    inProgressVideos.sort((a, b) => b.timestamp - a.timestamp);
    const recentVideos = inProgressVideos.slice(0, 5);
    if (recentVideos.length === 0) {
        // Directly use the translated string here
        const lang = localStorage.getItem('language') || 'en';
        activityList.innerHTML = `<p class="empty-state">${translations[lang].noRecentActivity}</p>`;
        return;
    }
    recentVideos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'continue-watching-card'; // Added 'position: relative;' in CSS for this class
        card.dataset.videoId = video.videoId;
        card.dataset.level = video.level;
        const totalDuration = 30 * 60; // Assuming max video duration for progress bar calc
        const progressPercent = Math.min(100, (video.timestamp / totalDuration) * 100);
        card.innerHTML = `
            <img src="${video.thumbnail}" alt="${video.title}" class="continue-watching-thumbnail">
            <div class="continue-watching-details">
                <h4>${video.title}</h4>
                <p class="level-info">${translations[localStorage.getItem('language') || 'en'].levelPrefix}${video.level}</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progressPercent}%;"></div>
                </div>
            </div>
            <button class="btn icon-btn reset-video-button" data-video-id="${video.videoId}" aria-label="Reset video progress">
                <span class="material-symbols-outlined">cancel</span>
            </button>`; // Added reset-video-button class
        activityList.appendChild(card);
    });
};

// UI State Management
const updateUIForUser = (user, progressData) => {
    currentUser = user;
    userProgress = progressData;
    elements.authContainer.classList.add('hidden');
    elements.passwordResetView.classList.add('hidden');
    elements.appContainer.classList.remove('hidden');
    renderAllCourses();
    renderQuizzesView();
    renderProfileView();
    renderUserDashboard();
    renderContinueWatching();
    handleNavigation(window.location.hash || '#home', false);
    setLanguage(localStorage.getItem('language') || 'en');
};

const updateUIForGuest = () => {
    currentUser = null;
    userProgress = {};
    elements.appContainer.classList.add('hidden');
    elements.passwordResetView.classList.add('hidden');
    elements.authContainer.classList.remove('hidden');
    showAuthForm(false); // Show login panel by default
    setLanguage(localStorage.getItem('language') || 'en');
};

const cacheDOMElements = () => {
    const ids = ['app-loader', 'auth-container', 'app-container', 'toast-container', 'login-form', 'signup-form', 'logout-btn', 'dark-mode-toggle', 'logout-modal-overlay', 'confirm-logout-btn', 'cancel-logout-btn', 'reset-progress-checkbox', 'reset-course-modal-overlay', 'reset-course-confirm-text', 'confirm-reset-btn', 'cancel-reset-btn', 'youtube-player-container', 'video-list', 'welcome-message', 'profile-name', 'profile-email', 'delete-account-btn', 'delete-account-modal-overlay', 'cancel-delete-btn', 'confirm-delete-btn', 'change-password-btn', 'password-reset-view', 'password-reset-form', 'change-password-modal-overlay', 'change-password-form', 'cancel-change-password-btn', 'change-password-error', 'sidebar', 'hamburger-btn', 'close-sidebar-btn', 'install-app-btn', 'reset-all-progress-btn', 'reset-all-modal-overlay', 'cancel-reset-all-btn', 'confirm-reset-all-btn', 'pfp-upload-input', 'pfp-container', 'faq-view', 'terms-view', 'privacy-view', 'accessibility-view', 'lang-toggle-btn', 'lang-dropdown'];
    ids.forEach(id => {
        const camelCaseId = id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
        elements[camelCaseId] = document.getElementById(id);
    });
    elements.sidebarNav = document.querySelector('.sidebar-nav');
    elements.mainContent = document.querySelector('.main-content');
};

const setupEventListeners = () => {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        elements.installAppBtn?.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        elements.installAppBtn?.classList.add('hidden');
    });

    elements.hamburgerBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        openMobileMenu();
    });

    elements.closeSidebarBtn?.addEventListener('click', closeMobileMenu);

    window.addEventListener('hashchange', () => handleNavigation(window.location.hash, false));

    elements.langToggleBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.langDropdown.classList.toggle('hidden');
    });

    elements.langDropdown?.addEventListener('click', (e) => {
        if (e.target.classList.contains('lang-option')) {
            setLanguage(e.target.dataset.lang);
            elements.langDropdown.classList.add('hidden');
        }
    });

    elements.loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginError = document.getElementById('login-error');
        loginError.textContent = '';
        const result = await handleLogin(elements.loginForm['login-email'].value, elements.loginForm['login-password'].value);
        if (!result.success) loginError.textContent = 'Invalid email or password.';
    });

    elements.signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const signupError = document.getElementById('signup-error');
        signupError.textContent = '';
        const result = await handleSignUp(elements.signupForm['signup-name'].value, elements.signupForm['signup-email'].value, elements.signupForm['signup-password'].value);
        if (!result.success) signupError.textContent = result.error.includes('auth/email-already-in-use') ? 'This email is already in use.' : 'An error occurred.';
    });

    // Event listener for the old forgot password form is no longer needed
    // as it's part of the main click handler now.

    elements.passwordResetForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('reset-new-password').value;
        const resetError = document.getElementById('reset-error');
        resetError.textContent = '';
        if (oobCode && newPassword) {
            const result = await handleConfirmPasswordReset(oobCode, newPassword);
            if (result.success) {
                showToast('Password has been reset successfully! Please log in.', 'success');
                window.location.href = '/';
            } else {
                resetError.textContent = 'Failed to reset password. The link may have expired.';
            }
        }
    });

    elements.changePasswordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('change-current-password').value;
        const newPassword = document.getElementById('change-new-password').value;
        elements.changePasswordError.textContent = '';
        const result = await handleChangePassword(currentPassword, newPassword);
        if (result.success) {
            showToast('Password changed successfully!', 'success');
            elements.changePasswordModalOverlay.classList.add('hidden');
        } else {
            elements.changePasswordError.textContent = result.error;
        }
    });

    elements.pfpContainer?.addEventListener('click', () => elements.pfpUploadInput.click());
    elements.pfpUploadInput?.addEventListener('change', handleProfilePictureUpload);

    document.body.addEventListener('click', async (e) => {
        const target = e.target;

        if (document.body.classList.contains('sidebar-open') && !target.closest('.sidebar')) {
            closeMobileMenu();
        }

        if (!target.closest('.lang-toggle-container')) {
            elements.langDropdown?.classList.add('hidden');
        }

        // --- IMPORTANT: Handle the reset button click first to prevent parent card navigation ---
        if (target.closest('.reset-video-button')) {
            e.stopPropagation(); // Prevent event from bubbling up to the continue-watching-card
            e.preventDefault();  // Prevent any default link/button action
            const videoId = target.closest('.reset-video-button').dataset.videoId;
            await resetSingleVideoProgress(videoId);
            return; // Exit to prevent further processing by other listeners
        }
        // --- End of important fix ---

        const socialButton = target.closest('.btn-social');
        const navLink = target.closest('.nav-link');
        const footerLink = target.closest('.footer-link');
        const continueCard = target.closest('.continue-watching-card');

        // New Auth Panel Buttons
        if (target.id === 'signUp') showAuthForm(true);
        if (target.id === 'signIn') showAuthForm(false);
        if (target.id === 'forgot-password-link') {
            // This is a temporary solution for the forgot password link
            // In a real app, you would show a separate modal or view
            const email = prompt("Please enter your email address to receive a password reset link:");
            if (email) {
                const result = await handlePasswordReset(email);
                if (result.success) {
                    showToast('Password reset email sent! Check your inbox.', 'success');
                } else {
                    showToast('Could not send email. Please check the address.', 'error');
                }
            }
        }

        if (socialButton) {
            const provider = socialButton.dataset.provider;
            if (provider === 'google') {
                const result = await handleSignInWithGoogle();
                if (!result.success) {
                    showToast('Could not sign in with Google.', 'error');
                }
            }
        } else if (target.closest('#install-app-btn')) {
            if (deferredInstallPrompt) {
                deferredInstallPrompt.prompt();
                deferredInstallPrompt = null;
                elements.installAppBtn?.classList.add('hidden');
            }
        } else if (navLink || (footerLink && footerLink.getAttribute('href').startsWith('#'))) {
            e.preventDefault();
            const link = navLink || footerLink;
            handleNavigation(link.getAttribute('href'));
            if (window.innerWidth <= 992) closeMobileMenu();
        }
        else if (continueCard) {
            currentLevel = continueCard.dataset.level;
            document.getElementById('video-view-title').textContent = `${translations[localStorage.getItem('language') || 'en'].levelPrefix}${currentLevel} Course`; // Translated "Level X Course"
            showView('video-player');
            elements.videoList.innerHTML = '<div class="spinner"></div>';
            currentPlaylist = getPlaylistFromCache(currentLevel);
            if (currentPlaylist.length) {
                renderVideoList();
                loadVideo(continueCard.dataset.videoId);
            } else {
                elements.videoList.innerHTML = '<p>Could not load videos.</p>';
            }
        }
        else if (target.matches('.start-course-btn')) {
            currentLevel = target.dataset.level;
            document.getElementById('video-view-title').textContent = `${translations[localStorage.getItem('language') || 'en'].levelPrefix}${currentLevel} Course`; // Translated "Level X Course"
            showView('video-player');
            elements.videoList.innerHTML = '<div class="spinner"></div>';
            currentPlaylist = getPlaylistFromCache(currentLevel);
            if (currentPlaylist.length) {
                renderVideoList();
                loadVideo(currentPlaylist[0].videoId);
            } else {
                elements.videoList.innerHTML = '<p>Could not load videos.</p>';
            }
        }
        else if (target.matches('#back-to-courses-btn')) { showView('courses'); }
        else if (target.closest('.video-item') && !target.matches('.complete-btn')) { loadVideo(target.closest('.video-item').dataset.videoId); }
        else if (target.matches('.complete-btn')) { markVideoAsComplete(parseInt(target.dataset.videoIndex, 10)); }
        else if (target.matches('.start-quiz-btn')) { startQuiz(target.dataset.level); }
        else if (target.matches('.quiz-option-btn')) { handleAnswer(parseInt(target.dataset.index, 10)); }
        else if (target.matches('#quiz-retry-btn')) { startQuiz(currentLevel); }
        else if (target.matches('#quiz-back-btn')) { showView('quizzes'); }
        else if (target.closest('#dark-mode-toggle')) {
            const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        }
        else if (target.matches('#logout-btn')) { elements.logoutModalOverlay.classList.remove('hidden'); }
        else if (target === elements.logoutModalOverlay || target.matches('#cancel-logout-btn')) { elements.logoutModalOverlay.classList.add('hidden'); }
        else if (target.matches('#confirm-logout-btn')) {
            (elements.resetProgressCheckbox.checked ? handleLogoutAndReset() : handleLogout()).finally(() => {
                elements.logoutModalOverlay.classList.add('hidden');
            });
        }
        else if (target.matches('#reset-course-btn')) {
            const lang = localStorage.getItem('language') || 'en';
            elements.resetCourseConfirmText.textContent = translations[lang].resetCourseConfirmMessage.replace('{level}', currentLevel); // Translated
            elements.resetCourseModalOverlay.classList.remove('hidden');
        }
        else if (target === elements.resetCourseModalOverlay || target.matches('#cancel-reset-btn')) { elements.resetCourseModalOverlay.classList.add('hidden'); }
        else if (target.matches('#confirm-reset-btn')) {
            resetCourseProgress();
            elements.resetCourseModalOverlay.classList.add('hidden');
        }
        else if (target.matches('#reset-all-progress-btn')) { elements.resetAllModalOverlay.classList.remove('hidden'); }
        else if (target === elements.resetAllModalOverlay || target.matches('#cancel-reset-all-btn')) { elements.resetAllModalOverlay.classList.add('hidden'); }
        else if (target.matches('#confirm-reset-all-btn')) {
            resetAllProgress();
            elements.resetAllModalOverlay.classList.add('hidden');
        }
        else if (target.matches('#delete-account-btn')) { elements.deleteAccountModalOverlay.classList.remove('hidden'); }
        else if (target === elements.deleteAccountModalOverlay || target.matches('#cancel-delete-btn')) { elements.deleteAccountModalOverlay.classList.add('hidden'); }
        else if (target.matches('#confirm-delete-btn')) {
            const result = await handleDeleteAccount();
            if (result.success) showToast('Account deleted successfully.', 'info');
            else showToast(`Error: ${result.error}`, 'error');
            elements.deleteAccountModalOverlay.classList.add('hidden');
        }
        else if (target.matches('#change-password-btn')) {
            elements.changePasswordError.textContent = '';
            elements.changePasswordForm.reset();
            elements.changePasswordModalOverlay.classList.remove('hidden');
        }
        else if (target === elements.changePasswordModalOverlay || target.matches('#cancel-change-password-btn')) { elements.changePasswordModalOverlay.classList.add('hidden'); }
    });

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        elements.installAppBtn?.classList.add('hidden');
    }
};

const handleActionCodes = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    oobCode = urlParams.get('oobCode');
    if (mode === 'resetPassword' && oobCode) {
        const result = await handleVerifyPasswordResetCode(oobCode);
        if (result.success) {
            elements.authContainer.classList.add('hidden');
            elements.appContainer.classList.add('hidden');
            document.getElementById('reset-email').value = result.email;
            elements.passwordResetView.classList.remove('hidden');
        } else {
            showToast('Invalid or expired password reset link.', 'error');
            oobCode = null;
        }
        history.replaceState({}, document.title, window.location.pathname);
    }
};

const initializeApp = async () => {
    try {
        courseData = await fetchPlaylistVideoCounts();
        // Pass the current language to fetchAndCacheAllVideos so it loads titles correctly
        allVideosData = await fetchAndCacheAllVideos(localStorage.getItem('language') || 'en');
        if (!courseData) throw new Error("Course data is null or empty.");
    } catch (error) {
        console.error("Initialization failed:", error);
        document.body.innerHTML = '<h2>Critical Error: Could not load course data. Please check your network connection and API key configuration.</h2>';
        return;
    }
    onAuthStateChanged(auth, async (user) => {
        if (oobCode) {
            elements.appLoader.classList.add('hidden');
            return;
        }
        elements.appLoader.classList.add('hidden');
        if (user) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                updateUIForUser(user, userDoc.data());
            } else {
                console.warn("User exists in Auth but not in Firestore. Logging out.");
                await handleLogout();
            }
        } else {
            updateUIForGuest();
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang); // This will now also trigger re-fetching of video data
    cacheDOMElements();
    setupEventListeners();
    handleActionCodes();
    if (!oobCode) {
        initializeApp();
    } else {
        elements.appLoader.classList.add('hidden');
    }
});