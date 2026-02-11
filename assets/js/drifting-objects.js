document.addEventListener("DOMContentLoaded", function () {
    const container = document.querySelector('.object-container');
    if (!container) return;

    const objectImages = [
        '/assets/images/anicoins/anicoin1.png',
        '/assets/images/anicoins/anicoin2.png',
        '/assets/images/anicoins/anicoin3.png',
        '/assets/images/anicoins/anicoin4.png',
        '/assets/images/anicoins/anicoin5.png'
    ];

    // Responsive config via media queries (mobile shows fewer coins)
    const mqSmall = window.matchMedia('(max-width: 480px)');
    const mqMobile = window.matchMedia('(max-width: 767px)');

    const getConfig = () => {
        if (mqSmall.matches) {
            return { maxObjects: 8, interval: 2800 }; // very small phones: fewer coins
        } else if (mqMobile.matches) {
            return { maxObjects: 12, interval: 2400 }; // general mobile
        }
        return { maxObjects: 28, interval: 1800 }; // tablets/desktop - reduced from 50
    };

    let intervalId = null;
    let currentMax = 50;

    const spawn = () => {
        const object = document.createElement('img');
        object.src = objectImages[Math.floor(Math.random() * objectImages.length)];
        object.classList.add('object');
        
        // Spawn coins only on the edges - avoid center 35-65% where text is
        let leftPosition;
        if (Math.random() < 0.5) {
            // Left edge: 0-35%
            leftPosition = Math.random() * 35;
        } else {
            // Right edge: 65-100%
            leftPosition = 65 + Math.random() * 35;
        }
        
        object.style.left = leftPosition + 'vw';
        object.style.animationDuration = (Math.random() * 5 + 3) + 's';

        container.appendChild(object);

        // Trim oldest if exceeding the max for the current breakpoint
        while (container.children.length > currentMax) {
            container.removeChild(container.firstChild);
        }

        object.addEventListener('animationend', () => {
            if (object.parentNode === container) container.removeChild(object);
        });
    };

    const startSpawner = () => {
        const cfg = getConfig();
        currentMax = cfg.maxObjects;
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(spawn, cfg.interval);
    };

    // Start with the right config
    startSpawner();

    // Update config on breakpoint changes
    const onChange = () => startSpawner();
    if (mqSmall.addEventListener) {
        mqSmall.addEventListener('change', onChange);
        mqMobile.addEventListener('change', onChange);
    } else if (mqSmall.addListener) { // older browsers fallback
        mqSmall.addListener(onChange);
        mqMobile.addListener(onChange);
    }
});
