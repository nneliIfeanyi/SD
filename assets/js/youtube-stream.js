(function () {
    "use strict";

    function createEmbedUrl(videoId) {
        const params = new URLSearchParams({
            autoplay: "1",
            rel: "0",
            modestbranding: "1",
            playsinline: "1"
        });

        return "https://www.youtube.com/embed/" + encodeURIComponent(videoId) + "?" + params.toString();
    }

    function createThumbnailUrl(videoId) {
        return "https://img.youtube.com/vi/" + encodeURIComponent(videoId) + "/hqdefault.jpg";
    }

    function resetCard(card) {
        const videoId = card.dataset.youtubeVideoId;
        const videoTitle = card.dataset.youtubeVideoTitle || "YouTube video";
        const videoFrame = card.querySelector(".video-frame");

        if (!videoId || !videoFrame || videoFrame.dataset.playing !== "true") {
            return;
        }

        const thumbnail = document.createElement("img");
        thumbnail.className = "video-thumb";
        thumbnail.loading = "lazy";
        thumbnail.src = createThumbnailUrl(videoId);
        thumbnail.alt = videoTitle + " video thumbnail";

        const overlay = document.createElement("div");
        overlay.className = "video-overlay";

        const playBtn = document.createElement("span");
        playBtn.className = "play-btn";
        playBtn.setAttribute("aria-hidden", "true");

        const playIcon = document.createElement("i");
        playIcon.className = "bi bi-play-fill";
        playBtn.appendChild(playIcon);
        overlay.appendChild(playBtn);

        videoFrame.innerHTML = "";
        videoFrame.appendChild(thumbnail);
        videoFrame.appendChild(overlay);
        videoFrame.dataset.playing = "false";
        videoFrame.setAttribute("role", "button");
        videoFrame.setAttribute("tabindex", "0");
        videoFrame.setAttribute("aria-label", "Play " + videoTitle);
    }

    function stopOtherPlayers(activeCard) {
        const activeFrames = document.querySelectorAll(".youtube-video-card .video-frame[data-playing='true']");

        activeFrames.forEach(function (frame) {
            const card = frame.closest(".youtube-video-card");
            if (card && card !== activeCard) {
                resetCard(card);
            }
        });
    }

    function mountPlayer(card) {
        const videoId = card.dataset.youtubeVideoId;
        const videoTitle = card.dataset.youtubeVideoTitle || "YouTube video";
        const videoFrame = card.querySelector(".video-frame");

        if (!videoId || !videoFrame || videoFrame.dataset.playing === "true") {
            return;
        }

        stopOtherPlayers(card);

        const iframe = document.createElement("iframe");
        iframe.src = createEmbedUrl(videoId);
        iframe.title = videoTitle;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.loading = "lazy";

        videoFrame.innerHTML = "";
        videoFrame.appendChild(iframe);
        videoFrame.dataset.playing = "true";
        videoFrame.removeAttribute("role");
        videoFrame.removeAttribute("tabindex");
        videoFrame.removeAttribute("aria-label");
    }

    function handleKeydown(event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            const card = event.currentTarget.closest(".youtube-video-card");
            if (card) {
                mountPlayer(card);
            }
        }
    }

    function initYouTubeCards() {
        const cards = document.querySelectorAll(".youtube-video-card");

        cards.forEach(function (card) {
            const frame = card.querySelector(".video-frame");
            if (!frame) {
                return;
            }

            frame.addEventListener("click", function () {
                mountPlayer(card);
            });

            frame.addEventListener("keydown", handleKeydown);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initYouTubeCards);
    } else {
        initYouTubeCards();
    }
})();
