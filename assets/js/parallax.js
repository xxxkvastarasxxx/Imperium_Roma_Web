window.addEventListener('scroll', function() {
    const helmet = document.querySelector('.parallax-img.helmet');
    const coins = document.querySelectorAll('.coin');
    if (!helmet || coins.length === 0) return;

    const scrollPosition = window.scrollY;
    const tiltAngle = Math.sin(scrollPosition * 0.01) * 10;

    helmet.style.transform = `translate(-50%, -50%) rotate(${tiltAngle}deg)`;

    coins.forEach((coin, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        coin.style.transform = `rotate(${tiltAngle * direction}deg)`;
    });
});
