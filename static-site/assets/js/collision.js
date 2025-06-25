document.addEventListener("DOMContentLoaded", function () {
    const animationArea = document.querySelector('.animation-container');
    if (!animationArea) {
        console.error('Контейнер для анімації не знайдено!');
        return;
    }

    const soldierImages = [
        "/assets/images/general/roman-warrior1.png",
        "/assets/images/general/roman-warrior3.png",
        "/assets/images/general/roman-warrior4.png"
    ];
    const reverseSoldierImage = "/assets/images/general/roman-warrior2.png";

    const maxSoldiers = 6; // Максимальна кількість солдатів на екрані

    function createSoldier(imageSrc, animationClass) {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = "Running Roman";
        img.classList.add(animationClass);
        img.style.position = 'absolute'; // Гарантуємо правильне позиціонування
        img.style.bottom = '0'; // Вирівнюємо по низу
        animationArea.appendChild(img);

        // Видалення після завершення анімації
        img.addEventListener('animationend', () => {
            img.remove();
        });
    }

    function generateSoldiers() {
        if (animationArea.children.length < maxSoldiers) {
            // Випадковий напрямок і випадкове зображення
            const direction = Math.random() > 0.5 ? 'left-to-right' : 'right-to-left';
            const imageSrc =
                direction === 'left-to-right'
                    ? soldierImages[Math.floor(Math.random() * soldierImages.length)]
                    : reverseSoldierImage;

            const animationClass =
                direction === 'left-to-right' ? 'running-roman' : 'running-roman-reverse';

            createSoldier(imageSrc, animationClass);
        }

        // Випадковий інтервал між створенням солдатів (від 1 до 3 секунд)
        const nextInterval = Math.random() * 2000 + 1000;
        setTimeout(generateSoldiers, nextInterval);
    }

    // Запуск генерації солдатів
    generateSoldiers();
});
