document.addEventListener("DOMContentLoaded", function() {
    const container = document.querySelector('.object-container');
    if (!container) return; // Перевірка наявності контейнера

    const objectImages = [
        '/assets/images/anicoins/anicoin1.png', 
        '/assets/images/anicoins/anicoin2.png', 
        '/assets/images/anicoins/anicoin3.png', 
        '/assets/images/anicoins/anicoin4.png', 
        '/assets/images/anicoins/anicoin5.png'
    ];
    const maxObjects = 50;

    setInterval(() => {
        const object = document.createElement('img');
        object.src = objectImages[Math.floor(Math.random() * objectImages.length)];
        object.classList.add('object');
        object.style.left = Math.random() * 100 + 'vw';
        object.style.animationDuration = Math.random() * 5 + 3 + 's';
        
        container.appendChild(object);

        if (container.children.length > maxObjects) {
            container.removeChild(container.firstChild);
        }

        object.addEventListener('animationend', () => {
            container.removeChild(object);
        });
    }, 1500);
});
