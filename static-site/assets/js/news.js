document.addEventListener("DOMContentLoaded", function() {
    const newsItems = document.querySelectorAll(".news-item");
    if (newsItems.length === 0) return;

    // Визначення зазору (у пікселях)
    const margin = 100;

    function isPartiallyInViewportWithMargin(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.bottom >= margin && // нижній край нижче верхнього краю вікна з урахуванням зазору
            rect.right >= margin && // правий край правіше лівого краю вікна з урахуванням зазору
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) - margin && // верхній край вище нижнього краю вікна з урахуванням зазору
            rect.left <= (window.innerWidth || document.documentElement.clientWidth) - margin // лівий край лівіше правого краю вікна з урахуванням зазору
        );
    }

    function revealOnScroll() {
        newsItems.forEach(item => {
            if (isPartiallyInViewportWithMargin(item)) {
                item.classList.add("visible");
            } else {
                item.classList.remove("visible");
            }
        });
    }

    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll(); // Ініціалізація при завантаженні
});