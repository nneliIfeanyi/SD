(function () {
    "use strict";

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getSortTimestamp(video, index) {
        if (video.sortDate) {
            var timestamp = Date.parse(video.sortDate);
            if (!Number.isNaN(timestamp)) {
                return timestamp;
            }
        }

        if (Number.isInteger(video.year)) {
            return Date.parse(String(video.year) + "-01-01") + index;
        }

        return index;
    }

    function getLatestVideos(videos, count) {
        return videos
            .map(function (video, index) {
                return {
                    data: video,
                    sortScore: getSortTimestamp(video, index),
                    index: index
                };
            })
            .sort(function (a, b) {
                if (b.sortScore === a.sortScore) {
                    return b.index - a.index;
                }

                return b.sortScore - a.sortScore;
            })
            .slice(0, count)
            .map(function (item) {
                return item.data;
            });
    }

    function renderHomeVideos() {
        var videosGrid = document.getElementById("homeVideosGrid");

        if (!videosGrid || !Array.isArray(window.SDVideosData)) {
            return;
        }

        var latestVideos = getLatestVideos(window.SDVideosData, 3);

        var cardsHtml = latestVideos.map(function (video, index) {
            var delay = 100 + (index * 50);

            return '' +
                '<div class="col-lg-4" data-aos="fade-up" data-aos-delay="' + delay + '">' +
                '<div class="testimonial-item youtube-video-card" data-youtube-video-id="' + escapeHtml(video.id) + '" data-youtube-video-title="' + escapeHtml(video.title) + '">' +
                '<div class="video-frame" role="button" tabindex="0" aria-label="Play ' + escapeHtml(video.title) + '">' +
                '<img src="https://img.youtube.com/vi/' + encodeURIComponent(video.id) + '/hqdefault.jpg" alt="' + escapeHtml(video.title) + ' video thumbnail" class="video-thumb" loading="lazy">' +
                '<div class="video-overlay">' +
                '<span class="play-btn" aria-hidden="true"><i class="bi bi-play-fill"></i></span>' +
                '</div>' +
                '</div>' +
                '<div class="stars">' +
                '<i class="bi bi-star-fill">' + escapeHtml(video.duration || "") + '</i>' +
                '</div>' +
                '<p>' + escapeHtml(video.event || "") + '</p>' +
                '<div class="testimonial-footer">' +
                '<div class="testimonial-author">' +
                '<div>' +
                '<h5>' + escapeHtml(video.dateLabel || "") + '</h5>' +
                '<span><strong>Theme:</strong> ' + escapeHtml(video.theme || "") + '</span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
        }).join("");

        videosGrid.innerHTML = cardsHtml;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", renderHomeVideos);
    } else {
        renderHomeVideos();
    }
})();
