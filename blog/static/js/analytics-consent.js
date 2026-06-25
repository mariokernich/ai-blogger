(function () {
    const STORAGE_KEY = "kernich-analytics-consent";
    const script = document.currentScript;
    const gaId = script?.dataset.gaId;

    if (!gaId) {
        return;
    }

    function loadAnalytics() {
        if (window.__kernichGaLoaded) {
            return;
        }
        window.__kernichGaLoaded = true;

        const loader = document.createElement("script");
        loader.async = true;
        loader.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gaId);
        document.head.appendChild(loader);

        window.dataLayer = window.dataLayer || [];
        function gtag() {
            window.dataLayer.push(arguments);
        }
        window.gtag = gtag;
        gtag("js", new Date());
        gtag("config", gaId, {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
        });
    }

    function hideBanner() {
        const banner = document.getElementById("consent-banner");
        if (banner) {
            banner.hidden = true;
        }
    }

    function showBanner() {
        const banner = document.getElementById("consent-banner");
        if (banner) {
            banner.hidden = false;
        }
    }

    function accept() {
        try {
            localStorage.setItem(STORAGE_KEY, "granted");
        } catch (e) {}
        hideBanner();
        loadAnalytics();
    }

    function decline() {
        try {
            localStorage.setItem(STORAGE_KEY, "denied");
        } catch (e) {}
        hideBanner();
    }

    function getConsent() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        document.getElementById("consent-accept")?.addEventListener("click", accept);
        document.getElementById("consent-decline")?.addEventListener("click", decline);
        document.querySelectorAll("[data-consent-settings]").forEach(function (link) {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                showBanner();
            });
        });

        const consent = getConsent();
        if (consent === "granted") {
            loadAnalytics();
            hideBanner();
        } else if (consent === "denied") {
            hideBanner();
        } else {
            showBanner();
        }
    });
})();
