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
            return { maxObjects: 12, interval: 2300 }; // very small phones: fewest coins
        } else if (mqMobile.matches) {
            return { maxObjects: 18, interval: 2000 }; // general mobile
        }
        return { maxObjects: 50, interval: 1500 }; // tablets/desktop
    };

    let intervalId = null;
    let currentMax = 50;

    const spawn = () => {
        const object = document.createElement('img');
        object.src = objectImages[Math.floor(Math.random() * objectImages.length)];
        object.classList.add('object');
        object.style.left = Math.random() * 100 + 'vw';
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
