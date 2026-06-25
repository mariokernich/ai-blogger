document.addEventListener("DOMContentLoaded", function () {
    const toc = document.querySelector("details.toc");
    const pinBtn = document.getElementById("toc-pin-btn");

    if (!toc || !pinBtn) return;

    const btnText = pinBtn.querySelector(".btn-text");

    // Load initial pinned state from localStorage
    const isPinned = localStorage.getItem("toc-pinned") === "true";

    function applyPinState(pinned) {
        if (pinned) {
            toc.classList.add("toc-pinned");
            document.body.classList.add("has-pinned-toc");
            toc.open = true; // Automatically open TOC when pinned to screen side
            if (btnText) btnText.textContent = "Unpin";
            pinBtn.title = "Unpin Table of Contents";
        } else {
            toc.classList.remove("toc-pinned");
            document.body.classList.remove("has-pinned-toc");
            if (btnText) btnText.textContent = "Pin";
            pinBtn.title = "Pin Table of Contents to the left";
        }
    }

    // Apply the initial state (remembered)
    if (isPinned) {
        // Run with a slight delay to allow smooth template rendering
        setTimeout(() => {
            applyPinState(true);
        }, 50);
    }

    pinBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const currentlyPinned = toc.classList.contains("toc-pinned");
        const nextState = !currentlyPinned;

        applyPinState(nextState);
        localStorage.setItem("toc-pinned", nextState);
    });
});
