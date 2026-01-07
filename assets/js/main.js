// Main JavaScript file for Jordan Call's personal website

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all functionality
    initializeContextWindow();
    setCurrentYear();
    handleReducedMotion();
    
    debugLog('site_initialized', { path: location.pathname });
});

/**
 * Handle the floating context window functionality
 */
function initializeContextWindow() {
    const contextWindow = document.getElementById('context-window');
    const closeButton = document.getElementById('close-context');
    
    if (!contextWindow || !closeButton) {
        return;
    }
    
    // Check if user has previously dismissed the context window
    const isDismissed = localStorage.getItem('contextWindowDismissed');
    
    if (isDismissed === 'true') {
        contextWindow.classList.add('hidden');
        return;
    }
    
    // Show context window with a slight delay for better UX
    setTimeout(() => {
        contextWindow.style.opacity = '1';
        contextWindow.style.transform = 'translateY(0)';
    }, 1000);
    
    // Handle close button click
    closeButton.addEventListener('click', function() {
        debugLog('context_closed', { reason: 'button' });
        closeContextWindow(contextWindow);
    });
    
    // Handle escape key to close context window
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !contextWindow.classList.contains('hidden')) {
            debugLog('context_closed', { reason: 'escape' });
            closeContextWindow(contextWindow);
        }
    });
    
    // Ensure context window doesn't interfere with footer on small screens
    handleContextWindowPosition();
    window.addEventListener('resize', handleContextWindowPosition);
}

/**
 * Close the context window with animation
 */
function closeContextWindow(contextWindow) {
    if (!contextWindow) return;
    
    contextWindow.classList.add('hidden');
    
    // Remember that user dismissed the window
    localStorage.setItem('contextWindowDismissed', 'true');
    
    // Set expiry for dismissal (reset after 7 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    localStorage.setItem('contextWindowDismissedExpiry', expiryDate.toISOString());
}

/**
 * Handle context window positioning to avoid covering footer CTAs
 */
function handleContextWindowPosition() {
    const contextWindow = document.getElementById('context-window');
    const footer = document.querySelector('footer');
    
    if (!contextWindow || !footer) return;
    
    const windowHeight = window.innerHeight;
    const footerRect = footer.getBoundingClientRect();
    const contextRect = contextWindow.getBoundingClientRect();
    
    // If on mobile and footer is visible, adjust context window position
    if (window.innerWidth <= 767 && footerRect.top < windowHeight) {
        const overlap = windowHeight - footerRect.top + 20; // 20px buffer
        contextWindow.style.bottom = `${overlap}px`;
    } else {
        // Reset to default position
        if (window.innerWidth <= 767) {
            contextWindow.style.bottom = '1rem';
        } else {
            contextWindow.style.bottom = '2rem';
        }
    }
}

/**
 * Set the current year in the footer
 */
function setCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

/**
 * Handle reduced motion preferences
 */
function handleReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
        // Disable animations for users who prefer reduced motion
        const contextWindow = document.getElementById('context-window');
        if (contextWindow) {
            contextWindow.style.transition = 'none';
        }
    }
}

/**
 * Check if context window dismissal has expired
 */
function checkContextWindowExpiry() {
    const expiry = localStorage.getItem('contextWindowDismissedExpiry');
    if (expiry) {
        const expiryDate = new Date(expiry);
        const now = new Date();
        
        if (now > expiryDate) {
            // Expiry has passed, reset dismissal
            localStorage.removeItem('contextWindowDismissed');
            localStorage.removeItem('contextWindowDismissedExpiry');
        }
    }
}

/**
 * Smooth scroll functionality for internal links
 */
function initializeSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Handle focus management for accessibility
 */
function initializeFocusManagement() {
    // Trap focus within context window when it's open
    const contextWindow = document.getElementById('context-window');
    const closeButton = document.getElementById('close-context');
    
    if (!contextWindow || !closeButton) return;
    
    contextWindow.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            const focusableElements = contextWindow.querySelectorAll(
                'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
            );
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    });
}

/**
 * Initialize photo grid functionality (for photos page)
 */
function initializePhotoGrid() {
    const photoGrid = document.querySelector('.photo-grid');
    if (!photoGrid) return;
    
    // Add keyboard navigation for photo grid
    const photos = photoGrid.querySelectorAll('img');
    
    photos.forEach((photo, index) => {
        photo.setAttribute('tabindex', '0');
        photo.setAttribute('role', 'button');
        photo.setAttribute('aria-label', `View photo ${index + 1}`);
        
        photo.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Future: open photo in lightbox or full view
                console.log(`Photo ${index + 1} selected`);
            }
        });
    });
}

/**
 * Performance monitoring and error handling
 */
function initializeMonitoring() {
    // Log page load performance
    window.addEventListener('load', function() {
        if ('performance' in window) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log(`Page loaded in ${loadTime}ms`);
        }
    });
    
    // Handle JavaScript errors gracefully
    window.addEventListener('error', function(e) {
        console.error('JavaScript error occurred:', e.error);
        // In production, you might want to send this to an error tracking service
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        // In production, you might want to send this to an error tracking service
    });
}

// Initialize additional functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    checkContextWindowExpiry();
    initializeSmoothScroll();
    initializeFocusManagement();
    initializePhotoGrid();
    initializeMonitoring();
});

// Export functions for potential testing or external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeContextWindow,
        closeContextWindow,
        setCurrentYear,
        handleReducedMotion
    };
}
