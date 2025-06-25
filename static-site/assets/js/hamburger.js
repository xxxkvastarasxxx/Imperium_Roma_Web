document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.getElementById('menu'); // Correctly select the menu using its ID

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active'); // Ensure this matches the CSS class
    });
});
