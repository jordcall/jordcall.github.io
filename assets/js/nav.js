// Navigation functionality with full accessibility support
let currentOpenSubmenu = null;
let hoverTimeout = null;
let isMobile = false;

function initNav() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const primaryNav = document.getElementById('primary-nav');
    const navButtons = document.querySelectorAll('.nav-button');
    const submenus = document.querySelectorAll('.submenu');
    
    if (!mobileToggle || !primaryNav) {
        console.warn('Navigation elements not found');
        return;
    }

    // Check if mobile
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Mobile menu toggle
    mobileToggle.addEventListener('click', toggleMobileMenu);

    // Initialize nav buttons (for About and Other sections)
    navButtons.forEach(button => {
        button.addEventListener('click', handleNavButtonClick);
        button.addEventListener('keydown', handleNavButtonKeydown);
        
        // Desktop hover behavior
        const hoverMedia = window.matchMedia('(hover: hover)');
        if (hoverMedia && hoverMedia.matches) {
            const navGroup = button.closest('.nav-group');
            if (navGroup) {
                navGroup.addEventListener('mouseenter', handleNavGroupHover);
                navGroup.addEventListener('mouseleave', handleNavGroupLeave);
            }
        }
    });

    // All navigation is now handled by nav-button elements

    // Submenu keyboard navigation
    submenus.forEach(submenu => {
        const links = submenu.querySelectorAll('a');
        links.forEach((link, index) => {
            link.addEventListener('keydown', (e) => handleSubmenuKeydown(e, submenu, index));
        });
    });

    // Click outside to close
    document.addEventListener('click', handleOutsideClick);
    
    // Escape key to close submenus
    document.addEventListener('keydown', handleGlobalKeydown);
}

function checkMobile() {
    isMobile = window.innerWidth <= 768;
    const primaryNav = document.getElementById('primary-nav');
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    if (primaryNav && !isMobile) {
        primaryNav.classList.remove('mobile-open');
        if (mobileToggle) {
            mobileToggle.setAttribute('aria-expanded', 'false');
        }
    }
}

function toggleMobileMenu() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const primaryNav = document.getElementById('primary-nav');
    const isOpen = mobileToggle.getAttribute('aria-expanded') === 'true';
    
    mobileToggle.setAttribute('aria-expanded', !isOpen);
    primaryNav.classList.toggle('mobile-open');
    
    if (!isOpen) {
        // Opening: focus first nav button
        const firstNavButton = document.querySelector('.nav-button');
        if (firstNavButton) {
            firstNavButton.focus();
        }
    } else {
        // Closing: close all submenus and return focus to toggle
        closeAllSubmenus();
        mobileToggle.focus();
    }
}

function handleNavButtonClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const button = e.currentTarget;
    const submenuId = button.getAttribute('aria-controls');
    const submenu = document.getElementById(submenuId);
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    
    if (isOpen) {
        closeSubmenu(button, submenu);
    } else {
        openSubmenu(button, submenu);
    }
}

function handleNavButtonKeydown(e) {
    const button = e.currentTarget;
    const submenuId = button.getAttribute('aria-controls');
    const submenu = document.getElementById(submenuId);
    
    switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault();
            handleNavButtonClick(e);
            break;
            
        case 'ArrowDown':
            e.preventDefault();
            if (button.getAttribute('aria-expanded') === 'false') {
                openSubmenu(button, submenu);
            }
            // Focus first submenu item
            const firstLink = submenu.querySelector('a');
            if (firstLink) {
                firstLink.focus();
            }
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            if (button.getAttribute('aria-expanded') === 'true') {
                // Focus last submenu item
                const links = submenu.querySelectorAll('a');
                const lastLink = links[links.length - 1];
                if (lastLink) {
                    lastLink.focus();
                }
            }
            break;
    }
}

function handleSubmenuKeydown(e, submenu, currentIndex) {
    const links = submenu.querySelectorAll('a');
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % links.length;
            links[nextIndex].focus();
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + links.length) % links.length;
            links[prevIndex].focus();
            break;
            
        case 'Escape':
            e.preventDefault();
            const button = submenu.closest('.nav-group').querySelector('.nav-button');
            closeSubmenu(button, submenu);
            button.focus();
            break;
            
        case 'Tab':
            // Allow natural tab behavior, but close submenu if tabbing away
            setTimeout(() => {
                if (!submenu.contains(document.activeElement) && 
                    !submenu.closest('.nav-group')?.querySelector('.nav-button')?.matches(':focus')) {
                    const button = submenu.closest('.nav-group').querySelector('.nav-button');
                    closeSubmenu(button, submenu);
                }
            }, 0);
            break;
    }
}

function handleNavGroupHover(e) {
    const hoverMedia = window.matchMedia('(hover: hover)');
    if ((!hoverMedia?.matches) || isMobile) return;
    
    clearTimeout(hoverTimeout);
    const button = e.currentTarget.querySelector('.nav-button');
    const submenuId = button.getAttribute('aria-controls');
    const submenu = document.getElementById(submenuId);
    
    openSubmenu(button, submenu);
}

function handleNavGroupLeave(e) {
    const hoverMedia = window.matchMedia('(hover: hover)');
    if ((!hoverMedia?.matches) || isMobile) return;
    
    const button = e.currentTarget.querySelector('.nav-button');
    const submenuId = button.getAttribute('aria-controls');
    const submenu = document.getElementById(submenuId);
    
    // Delay closing to allow moving to submenu
    hoverTimeout = setTimeout(() => {
        // Only close if focus and pointer are both outside the group
        if (!e.currentTarget?.matches(':hover') && 
            !e.currentTarget?.contains(document.activeElement)) {
            closeSubmenu(button, submenu);
        }
    }, 180);
}

function handleOutsideClick(e) {
    const primaryNav = document.getElementById('primary-nav');
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    
    if (primaryNav && !primaryNav.contains(e.target) && 
        mobileToggle && !mobileToggle.contains(e.target)) {
        closeAllSubmenus();
        
        // Close mobile menu if open
        if (isMobile && primaryNav.classList.contains('mobile-open')) {
            toggleMobileMenu();
        }
    }
}

function handleGlobalKeydown(e) {
    if (e.key === 'Escape') {
        closeAllSubmenus();
        
        // Close mobile menu if open
        if (isMobile) {
            const primaryNav = document.getElementById('primary-nav');
            if (primaryNav.classList.contains('mobile-open')) {
                toggleMobileMenu();
            }
        }
    }
}

function openSubmenu(button, submenu) {
    // Close other submenus first (mutual exclusion)
    closeAllSubmenus();
    
    button.setAttribute('aria-expanded', 'true');
    submenu.hidden = false;
    submenu.classList.add('submenu-open');
    
    currentOpenSubmenu = { button, submenu };
}

function closeSubmenu(button, submenu) {
    button.setAttribute('aria-expanded', 'false');
    submenu.hidden = true;
    submenu.classList.remove('submenu-open');
    
    if (currentOpenSubmenu && currentOpenSubmenu.submenu === submenu) {
        currentOpenSubmenu = null;
    }
}

function closeAllSubmenus() {
    const navButtons = document.querySelectorAll('.nav-button');
    const submenus = document.querySelectorAll('.submenu');
    
    navButtons.forEach(button => {
        button.setAttribute('aria-expanded', 'false');
    });
    
    submenus.forEach(submenu => {
        submenu.hidden = true;
        submenu.classList.remove('submenu-open');
    });
    
    currentOpenSubmenu = null;
    clearTimeout(hoverTimeout);
}

function handleToggleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const toggle = e.currentTarget;
    const submenuId = toggle.getAttribute('aria-controls');
    const submenu = document.getElementById(submenuId);
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    
    if (isOpen) {
        closeSubmenu(toggle, submenu);
    } else {
        openSubmenu(toggle, submenu);
    }
}

function handleToggleKeydown(e) {
    const toggle = e.currentTarget;
    const submenuId = toggle.getAttribute('aria-controls');
    const submenu = document.getElementById(submenuId);
    
    switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault();
            handleToggleClick(e);
            break;
            
        case 'ArrowDown':
            e.preventDefault();
            if (toggle.getAttribute('aria-expanded') === 'false') {
                openSubmenu(toggle, submenu);
            }
            // Focus first submenu item
            const firstLink = submenu.querySelector('a');
            if (firstLink) {
                firstLink.focus();
            }
            break;
            
        case 'Escape':
            e.preventDefault();
            if (toggle.getAttribute('aria-expanded') === 'true') {
                closeSubmenu(toggle, submenu);
                toggle.focus();
            }
            break;
    }
}

// Export for testing or external use
if (typeof window !== 'undefined') {
    window.initNav = initNav;
}