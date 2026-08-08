(function () {
    "use strict";

    function isValidYouTubeId(value) {
        return /^[a-zA-Z0-9_-]{11}$/.test(value);
    }

    function extractYouTubeId(input) {
        var value = String(input || "").trim();

        if (!value) {
            return "";
        }

        if (isValidYouTubeId(value)) {
            return value;
        }

        var sanitized = value.split(/[?&]/)[0].trim();
        if (isValidYouTubeId(sanitized)) {
            return sanitized;
        }

        try {
            var url = new URL(value);
            var host = url.hostname.replace(/^www\./, "").toLowerCase();

            if (host === "youtu.be") {
                var shortId = url.pathname.replace(/^\/+/, "").split("/")[0];
                if (isValidYouTubeId(shortId)) {
                    return shortId;
                }
            }

            if (host.endsWith("youtube.com")) {
                var vParam = url.searchParams.get("v");
                if (vParam && isValidYouTubeId(vParam)) {
                    return vParam;
                }

                var segments = url.pathname.split("/").filter(Boolean);
                var knownPrefixes = ["embed", "shorts", "live", "v"];

                if (segments.length >= 2 && knownPrefixes.indexOf(segments[0]) !== -1 && isValidYouTubeId(segments[1])) {
                    return segments[1];
                }
            }
        } catch (error) {
            // Non-URL values are handled by fallback parsing below.
        }

        var fallbackMatch = value.match(/([a-zA-Z0-9_-]{11})/);
        return fallbackMatch ? fallbackMatch[1] : "";
    }

    // Add or update videos here. Both home and videos archive pages use this list.
    window.SDVideosData = [
        {
            id: "VBoXiJ8uJL4&t=943s",
            title: "Christian Youth Summit",
            duration: "3 - 4 hour Seminar Retreat",
            event: "CHRISTIAN YOUTH SUMMIT",
            dateLabel: "24th May, 2026",
            year: 2026,
            theme: "GOD HAS A WORD FOR EVERY YOUTHS IN THIS CITY",
            sortDate: "2026-05-24"
        }
    ].map(function (video) {
        var normalizedId = extractYouTubeId(video.id);

        if (!normalizedId) {
            console.warn("Skipping video with invalid YouTube id:", video.id);
            return null;
        }

        return Object.assign({}, video, { id: normalizedId });
    }).filter(Boolean);
})();
