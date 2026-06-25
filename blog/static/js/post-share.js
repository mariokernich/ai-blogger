document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-share-url]").forEach(function (button) {
        button.addEventListener("click", async function () {
            var url = button.getAttribute("data-share-url");
            var label = button.querySelector(".share-chip__copy-label");
            if (!url || !label) {
                return;
            }

            var originalText = label.textContent;
            var originalLabel = button.getAttribute("aria-label");

            try {
                await navigator.clipboard.writeText(url);
                label.textContent = "Copied!";
                button.setAttribute("aria-label", "Link copied to clipboard");
                button.classList.add("share-chip--copied");
            } catch (error) {
                label.textContent = "Copy failed";
                button.setAttribute("aria-label", "Copy link failed");
            }

            window.setTimeout(function () {
                label.textContent = originalText;
                button.setAttribute("aria-label", originalLabel);
                button.classList.remove("share-chip--copied");
            }, 2000);
        });
    });
});
