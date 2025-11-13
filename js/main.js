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

    // Initialize snow animation
    initSnowfall();
});

// ============================================
// Snow Animation
// ============================================
function initSnowfall() {
    // Create snow container
    const snowContainer = document.createElement('div');
    snowContainer.className = 'snow-container';
    document.body.appendChild(snowContainer);

    // Number of snowflakes (adjust based on performance)
    const snowflakeCount = 50;
    
    // Snowflake characters
    const snowflakeChars = ['❄', '❅', '❆', '✻', '✼', '✽', '✾', '✿', '❀', '❁'];

    // Create snowflakes
    for (let i = 0; i < snowflakeCount; i++) {
        createSnowflake(snowContainer, snowflakeChars);
    }
}

function createSnowflake(container, chars) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    
    // Random snowflake character
    const randomChar = chars[Math.floor(Math.random() * chars.length)];
    snowflake.textContent = randomChar;
    
    // Random size
    const sizes = ['small', 'medium', 'large'];
    const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
    snowflake.classList.add(randomSize);
    
    // Random starting position
    snowflake.style.left = Math.random() * 100 + '%';
    
    // Random animation delay
    snowflake.style.animationDelay = Math.random() * 5 + 's';
    
    // Random animation duration variation
    const baseDuration = 10 + Math.random() * 5; // 10-15 seconds
    snowflake.style.animationDuration = baseDuration + 's';
    
    // Add drift variation
    const drift = (Math.random() - 0.5) * 100; // -50px to 50px
    snowflake.style.setProperty('--drift', drift + 'px');
    
    container.appendChild(snowflake);
    
    // Remove snowflake after animation and create a new one
    setTimeout(() => {
        if (snowflake.parentNode) {
            snowflake.remove();
            createSnowflake(container, chars);
        }
    }, (baseDuration + 1) * 1000);
}

