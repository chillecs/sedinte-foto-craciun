// ============================================
// Main JavaScript - Shared Functionality
// ============================================

// Mobile menu toggle (if needed in the future)
document.addEventListener('DOMContentLoaded', function() {
    // Add any shared functionality here
    // For example: mobile menu toggle, smooth scrolling, etc.
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

