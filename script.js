document.addEventListener('DOMContentLoaded', () => {
    // 1. Header Scroll State
    const header = document.querySelector('.main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Mobile Nav Toggle
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileToggle.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.className = 'fa-solid fa-xmark';
        } else {
            icon.className = 'fa-solid fa-bars';
        }
    });

    // Close menu when clicking links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileToggle.querySelector('i').className = 'fa-solid fa-bars';
        });
    });

    // 3. Scroll Intersection Observer for Timeline & Fade-ins
    const timelineItems = document.querySelectorAll('.timeline-item');
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const timelineObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    timelineItems.forEach(item => {
        timelineObserver.observe(item);
    });

    // 4. Earlier Roles Toggle
    const toggleEarlierBtn = document.getElementById('toggle-earlier-roles');
    const earlierContainer = document.getElementById('earlier-roles-container');

    toggleEarlierBtn.addEventListener('click', () => {
        if (earlierContainer.classList.contains('hidden')) {
            earlierContainer.classList.remove('hidden');
            // Force reflow for transitions
            void earlierContainer.offsetWidth;
            earlierContainer.classList.add('show');
            toggleEarlierBtn.innerHTML = 'Hide Earlier Roles <i class="fa-solid fa-chevron-up"></i>';
        } else {
            earlierContainer.classList.remove('show');
            toggleEarlierBtn.innerHTML = 'View Earlier Roles <i class="fa-solid fa-chevron-down"></i>';
            
            // Wait for transition to finish
            earlierContainer.addEventListener('transitionend', function handler() {
                earlierContainer.classList.add('hidden');
                earlierContainer.removeEventListener('transitionend', handler);
            });
        }
    });

    // AI Sandbox Console elements removed (Replaced by Laufgas Slot Arcade cabinet in arcade.js)
});
