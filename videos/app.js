(function () {
    "use strict";

    var PAGE_SIZE = 15;

    var videos = Array.isArray(window.SDVideosData) ? window.SDVideosData.slice() : [];

    var state = {
        year: "all",
        page: 1
    };

    var yearFilter = document.getElementById("yearFilter");
    var videosGrid = document.getElementById("videosGrid");
    var pagination = document.getElementById("pagination");
    var summary = document.getElementById("resultSummary");
    var emptyState = document.getElementById("emptyState");

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function createEmbedUrl(videoId) {
        var params = new URLSearchParams({
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

    function getSortedVideos(items) {
        return items
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
            .map(function (item) {
                return item.data;
            });
    }

    function getFilteredVideos() {
        var sortedVideos = getSortedVideos(videos);

        if (state.year === "all") {
            return sortedVideos;
        }

        var selectedYear = Number(state.year);
        return sortedVideos.filter(function (video) {
            return video.year === selectedYear;
        });
    }

    function syncQueryParams() {
        var params = new URLSearchParams();

        if (state.year !== "all") {
            params.set("year", state.year);
        }

        if (state.page > 1) {
            params.set("page", String(state.page));
        }

        var nextUrl = window.location.pathname;
        var paramString = params.toString();

        if (paramString) {
            nextUrl += "?" + paramString;
        }

        window.history.replaceState(null, "", nextUrl);
    }

    function parseInitialState() {
        var params = new URLSearchParams(window.location.search);
        var year = params.get("year");
        var page = Number(params.get("page"));

        if (year && /^\d{4}$/.test(year)) {
            state.year = year;
        }

        if (Number.isInteger(page) && page > 0) {
            state.page = page;
        }
    }

    function renderYearOptions() {
        var years = Array.from(new Set(videos.map(function (video) {
            return video.year;
        }))).sort(function (a, b) {
            return b - a;
        });

        var options = ['<option value="all">All years</option>'];

        years.forEach(function (year) {
            options.push('<option value="' + year + '">' + year + '</option>');
        });

        yearFilter.innerHTML = options.join("");

        var yearExists = years.some(function (year) {
            return String(year) === state.year;
        });

        if (state.year !== "all" && !yearExists) {
            state.year = "all";
        }

        yearFilter.value = state.year;
    }

    function renderCards(currentPageItems) {
        if (!currentPageItems.length) {
            videosGrid.innerHTML = "";
            return;
        }

        var cardsHtml = currentPageItems.map(function (video) {
            return '' +
                '<div class="col-lg-4" data-year="' + video.year + '">' +
                '<div class="testimonial-item youtube-video-card" data-youtube-video-id="' + escapeHtml(video.id) + '" data-youtube-video-title="' + escapeHtml(video.title) + '">' +
                '<div class="video-frame" role="button" tabindex="0" aria-label="Play ' + escapeHtml(video.title) + '">' +
                '<img src="https://img.youtube.com/vi/' + encodeURIComponent(video.id) + '/hqdefault.jpg" alt="' + escapeHtml(video.title) + ' video thumbnail" class="video-thumb" loading="lazy">' +
                '<div class="video-overlay">' +
                '<span class="play-btn" aria-hidden="true"><i class="bi bi-play-fill"></i></span>' +
                '</div>' +
                '</div>' +
                '<div class="stars">' +
                '<i class="bi bi-star-fill">' + escapeHtml(video.duration) + '</i>' +
                '</div>' +
                '<p>' + escapeHtml(video.event) + '</p>' +
                '<div class="testimonial-footer">' +
                '<div class="testimonial-author">' +
                '<div>' +
                '<h5>' + escapeHtml(video.dateLabel) + '</h5>' +
                '<span><strong>Theme:</strong> ' + escapeHtml(video.theme) + '</span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
        }).join("");

        videosGrid.innerHTML = cardsHtml;
    }

    function renderPagination(totalItems, totalPages) {
        if (totalItems === 0 || totalPages <= 1) {
            pagination.innerHTML = "";
            return;
        }

        var html = [];

        html.push(
            '<li class="page-item' + (state.page === 1 ? " disabled" : "") + '">' +
            '<button class="page-link" type="button" data-page="' + (state.page - 1) + '" aria-label="Previous page">Previous</button>' +
            '</li>'
        );

        for (var i = 1; i <= totalPages; i += 1) {
            html.push(
                '<li class="page-item' + (i === state.page ? " active" : "") + '">' +
                '<button class="page-link" type="button" data-page="' + i + '">' + i + '</button>' +
                '</li>'
            );
        }

        html.push(
            '<li class="page-item' + (state.page === totalPages ? " disabled" : "") + '">' +
            '<button class="page-link" type="button" data-page="' + (state.page + 1) + '" aria-label="Next page">Next</button>' +
            '</li>'
        );

        pagination.innerHTML = html.join("");
    }

    function resetCard(card) {
        var videoId = card.dataset.youtubeVideoId;
        var videoTitle = card.dataset.youtubeVideoTitle || "YouTube video";
        var videoFrame = card.querySelector(".video-frame");

        if (!videoId || !videoFrame || videoFrame.dataset.playing !== "true") {
            return;
        }

        var thumbnail = document.createElement("img");
        thumbnail.className = "video-thumb";
        thumbnail.loading = "lazy";
        thumbnail.src = createThumbnailUrl(videoId);
        thumbnail.alt = videoTitle + " video thumbnail";

        var overlay = document.createElement("div");
        overlay.className = "video-overlay";

        var playBtn = document.createElement("span");
        playBtn.className = "play-btn";
        playBtn.setAttribute("aria-hidden", "true");

        var playIcon = document.createElement("i");
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
        var activeFrames = document.querySelectorAll(".youtube-video-card .video-frame[data-playing='true']");

        activeFrames.forEach(function (frame) {
            var card = frame.closest(".youtube-video-card");
            if (card && card !== activeCard) {
                resetCard(card);
            }
        });
    }

    function mountPlayer(card) {
        var videoId = card.dataset.youtubeVideoId;
        var videoTitle = card.dataset.youtubeVideoTitle || "YouTube video";
        var videoFrame = card.querySelector(".video-frame");

        if (!videoId || !videoFrame || videoFrame.dataset.playing === "true") {
            return;
        }

        stopOtherPlayers(card);

        var iframe = document.createElement("iframe");
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

    function render() {
        var filteredVideos = getFilteredVideos();
        var totalItems = filteredVideos.length;
        var totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

        if (state.page > totalPages) {
            state.page = totalPages;
        }

        var startIndex = (state.page - 1) * PAGE_SIZE;
        var currentPageItems = filteredVideos.slice(startIndex, startIndex + PAGE_SIZE);

        renderCards(currentPageItems);
        renderPagination(totalItems, totalPages);

        summary.textContent = totalItems + " video" + (totalItems === 1 ? "" : "s") +
            " found" + (state.year === "all" ? "" : " in " + state.year) +
            " - showing page " + state.page + " of " + totalPages + ".";

        emptyState.classList.toggle("d-none", totalItems > 0);

        syncQueryParams();
    }

    yearFilter.addEventListener("change", function (event) {
        state.year = event.target.value;
        state.page = 1;
        render();
    });

    pagination.addEventListener("click", function (event) {
        var target = event.target;

        if (!(target instanceof HTMLButtonElement)) {
            return;
        }

        var nextPage = Number(target.dataset.page);

        if (!Number.isInteger(nextPage) || nextPage < 1 || nextPage === state.page) {
            return;
        }

        state.page = nextPage;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    videosGrid.addEventListener("click", function (event) {
        var frame = event.target.closest(".video-frame");
        if (!frame) {
            return;
        }

        var card = frame.closest(".youtube-video-card");
        if (card) {
            mountPlayer(card);
        }
    });

    videosGrid.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }

        var frame = event.target.closest(".video-frame");
        if (!frame) {
            return;
        }

        event.preventDefault();
        var card = frame.closest(".youtube-video-card");
        if (card) {
            mountPlayer(card);
        }
    });

    parseInitialState();
    renderYearOptions();
    render();
})();
