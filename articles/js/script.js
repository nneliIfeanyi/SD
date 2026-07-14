/**
 * 
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  const PAGE_SIZE = 7;
  const BOOKMARKS_STORAGE_KEY = "suleja-bookmarks";

  const state = {
    posts: [],
    visibleCount: 0,
    activePostId: null,
    favorites: new Set(),
    bookmarks: new Set(),
    isLoading: true,
    loadError: null,
    isLoadingMore: false,
    hasMore: true,
    idToToken: new Map(),
    tokenToId: new Map(),
  };

  // ---------------------------------------------------------------------
  // DOM references
  // ---------------------------------------------------------------------
  const els = {
    listDesktop: document.getElementById("blogListDesktop"),
    listMobile: document.getElementById("blogListMobile"),
    detailContent: document.getElementById("detailContent"),
    offcanvasEl: document.getElementById("blogOffcanvas"),
    readingProgress: document.getElementById("readingProgress"),
    favToastMsg: document.getElementById("favToastMsg"),
    favToastIcon: document.getElementById("favToastIcon"),
    bookmarkBtn: document.getElementById("bookmarkBtn"),
    bookmarksModalEl: document.getElementById("bookmarksModal"),
    bookmarksList: document.getElementById("bookmarksList"),
    bookmarkCount: document.getElementById("bookmarkCount"),
    deleteModalEl: document.getElementById("deleteModal"),
    deletePostTitle: document.getElementById("deletePostTitle"),
    confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
    confirmDeleteLabel: document.getElementById("confirmDeleteLabel"),
    confirmDeleteSpinner: document.getElementById("confirmDeleteSpinner"),
  };

  const offcanvas = els.offcanvasEl ? bootstrap.Offcanvas.getOrCreateInstance(els.offcanvasEl) : null;
  const favToast = document.getElementById("favToast")
    ? bootstrap.Toast.getOrCreateInstance(document.getElementById("favToast"), { delay: 1800 })
    : null;
  const bookmarksModal = els.bookmarksModalEl ? bootstrap.Modal.getOrCreateInstance(els.bookmarksModalEl) : null;
  const deleteModal = els.deleteModalEl ? bootstrap.Modal.getOrCreateInstance(els.deleteModalEl) : null;
  let pendingDeleteId = null;

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------
  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function getVisiblePosts() {
    return state.posts.slice(0, state.visibleCount);
  }

  function resetInfiniteScroll() {
    state.visibleCount = Math.min(PAGE_SIZE, state.posts.length);
    state.hasMore = state.visibleCount < state.posts.length;
  }

  function loadMorePosts() {
    if (state.isLoading || state.isLoadingMore || !state.hasMore) return;

    state.isLoadingMore = true;
    renderList();

    window.setTimeout(() => {
      state.visibleCount = Math.min(state.visibleCount + PAGE_SIZE, state.posts.length);
      state.hasMore = state.visibleCount < state.posts.length;
      state.isLoadingMore = false;
      renderList();
    }, 180);
  }

  function handleListScroll(event) {
    const container = event.currentTarget;
    if (state.isLoading || state.isLoadingMore || !state.hasMore) return;

    const threshold = 120;
    const reachedBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;

    if (reachedBottom) {
      loadMorePosts();
    }
  }

  function findPost(id) {
    return state.posts.find((p) => p.id === id) || null;
  }

  function initTooltips(root = document) {
    root.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
      bootstrap.Tooltip.getOrCreateInstance(el);
    });
  }

  function setInnerHtml(el, html) {
    if (el) {
      el.innerHTML = html;
    }
  }

  function buildPostTokenMaps(posts) {
    const idToToken = new Map();
    const tokenToId = new Map();
    const usedTokens = new Set();

    [...posts].sort((a, b) => a.id - b.id).forEach((post) => {
      let token = 1000 + (((post.id * 73 + 17) % 9000));
      while (usedTokens.has(token)) {
        token = token >= 9999 ? 1000 : token + 1;
      }
      usedTokens.add(token);
      idToToken.set(post.id, token);
      tokenToId.set(token, post.id);
    });

    return { idToToken, tokenToId };
  }

  function updatePostUrl(id) {
    const url = new URL(window.location.href);
    if (id == null) {
      url.searchParams.delete("id");
    } else {
      const token = state.idToToken.get(id) ?? id;
      url.searchParams.set("id", String(token));
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function getPostIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const rawValue = params.get("id");
    if (rawValue == null) return null;

    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed <= 0) return null;

    return state.tokenToId.get(parsed) ?? parsed;
  }

  function loadBookmarksFromStorage() {
    try {
      const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("Failed to read bookmarks from storage:", err);
      return [];
    }
  }

  function saveBookmarksToStorage() {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify([...state.bookmarks]));
  }

  function getBookmarkedPosts() {
    return state.posts.filter((post) => state.bookmarks.has(post.id));
  }

  function updateBookmarkBadge() {
    if (els.bookmarkCount) {
      els.bookmarkCount.textContent = state.bookmarks.size;
      els.bookmarkCount.classList.toggle("d-none", state.bookmarks.size === 0);
    }
  }

  function renderBookmarksList() {
    if (!els.bookmarksList) return;

    const bookmarkedPosts = getBookmarkedPosts();

    if (!bookmarkedPosts.length) {
      els.bookmarksList.innerHTML = `
        <div class="text-center text-muted py-3">
          <i class="bi bi-bookmark fs-4 d-block mb-2"></i>
          <p class="small mb-0">No bookmarks yet. Tap the heart on any post to save it here.</p>
        </div>
      `;
      return;
    }

    els.bookmarksList.innerHTML = bookmarkedPosts
      .map((post) => `
        <div class="border rounded p-2 mb-2">
          <button type="button" class="btn btn-link p-0 text-start text-decoration-none w-100" data-open-bookmark="${post.id}">
            <div class="fw-semibold text-dark">${post.title}</div>
            <div class="small text-muted">${post.author}</div>
          </button>
        </div>
      `)
      .join("");

    els.bookmarksList.querySelectorAll("[data-open-bookmark]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-open-bookmark"));
        selectPost(id);
        bookmarksModal.hide();
      });
    });
  }

  // ---------------------------------------------------------------------
  // Render: Blog list cards (shared markup for desktop + mobile)
  // ---------------------------------------------------------------------
  function renderCard(post) {
    const isActive = post.id === state.activePostId;
    return `
      <div class="blog-card${isActive ? " active" : ""}"
           role="button"
           tabindex="0"
           data-id="${post.id}"
           aria-current="${isActive ? "true" : "false"}">
        <div class="blog-card-title">${post.title}</div>
        <div class="blog-card-meta">
          <i class="bi bi-person-circle"></i>
          <span>${post.author}</span>
          <span aria-hidden="true">·</span>
          <span>${formatDate(post.date)}</span>
        </div>
        <div class="blog-card-excerpt">${post.excerpt}</div>
      </div>
    `;
  }

  function renderList() {
    if (state.isLoading) {
      renderListLoading();
      return;
    }
    if (state.loadError) {
      renderListError();
      return;
    }

    const visiblePosts = getVisiblePosts();
    const html = visiblePosts.length
      ? visiblePosts.map(renderCard).join("")
      : `<p class="text-muted text-center small mt-3">No posts found.</p>`;

    const indicatorHtml = visiblePosts.length
      ? `<div class="text-center text-muted small py-3" id="infiniteStateIndicator">${state.isLoadingMore ? "Loading more posts..." : state.hasMore ? "Scroll for more" : "End of content"}</div>`
      : "";

    const markup = `${html}${indicatorHtml}`;
    setInnerHtml(els.listDesktop, markup);
    setInnerHtml(els.listMobile, markup);

    [els.listDesktop, els.listMobile].forEach((container) => {
      container.querySelectorAll(".blog-card").forEach((card) => {
        card.addEventListener("click", onCardActivate);
      });
      container.onscroll = handleListScroll;
    });
  }

  function renderListLoading() {
    const skeletonCard = `
      <div class="blog-card" aria-hidden="true" style="cursor:default;">
        <span class="placeholder-glow d-block mb-2">
          <span class="placeholder skeleton-line col-9" style="height:0.95rem;"></span>
        </span>
        <span class="placeholder-glow d-block mb-2">
          <span class="placeholder skeleton-line col-6" style="height:0.7rem;"></span>
        </span>
        <span class="placeholder-glow d-block">
          <span class="placeholder skeleton-line col-12" style="height:0.7rem;"></span>
        </span>
      </div>
    `;
    const html = skeletonCard.repeat(PAGE_SIZE);
    setInnerHtml(els.listDesktop, html);
    setInnerHtml(els.listMobile, html);
  }

  function renderListError() {
    const html = `
      <div class="text-center text-muted p-4">
        <i class="bi bi-wifi-off fs-3 d-block mb-2"></i>
        <p class="small mb-2">${state.loadError}</p>
        <button type="button" class="btn btn-sm btn-outline-primary" id="retryLoadBtn">
          <i class="bi bi-arrow-clockwise me-1"></i>Retry
        </button>
      </div>
    `;
    setInnerHtml(els.listDesktop, html);
    setInnerHtml(els.listMobile, html);
    [els.listDesktop, els.listMobile].forEach((container) => {
      container.querySelector("#retryLoadBtn")?.addEventListener("click", loadPosts);
    });
  }

  function onCardActivate(e) {
    const card = e.currentTarget;
    const id = Number(card.dataset.id);
    selectPost(id);

    // Auto-close the offcanvas if the click happened inside it (mobile)
    if (els.offcanvasEl && els.offcanvasEl.contains(card) && offcanvas) {
      offcanvas.hide();
    }
  }

  // ---------------------------------------------------------------------
  // Render: Empty state
  // ---------------------------------------------------------------------
  function renderEmptyState() {
    const emptyStateMarkup = `
      <div class="empty-state fade-swap">
        <div class="empty-icon">
          <i class="bi bi-journal-richtext"></i>
        </div>
        <h5>Select an article to start reading</h5>
        <p class="mb-0" style="max-width: 320px;">
          Pick an article from the list to see the full story here.
        </p>
      </div>
    `;
    setInnerHtml(els.detailContent, emptyStateMarkup);
    if (els.readingProgress) {
      els.readingProgress.style.width = "0%";
    }
  }

  // ---------------------------------------------------------------------
  // Render: Skeleton loader (shown briefly while an article "loads")
  // ---------------------------------------------------------------------
  function renderSkeleton() {
    const skeletonMarkup = `
      <div class="article-card fade-swap">
        <div class="placeholder-glow skeleton-thumb placeholder"></div>
        <div class="article-body">
          <span class="placeholder-glow d-block mb-3">
            <span class="placeholder skeleton-line col-3"></span>
          </span>
          <span class="placeholder-glow d-block mb-2">
            <span class="placeholder skeleton-line col-8" style="height:1.6rem;"></span>
          </span>
          <span class="placeholder-glow d-block mb-4">
            <span class="placeholder skeleton-line col-5"></span>
          </span>
          <span class="placeholder-glow d-block mb-2">
            <span class="placeholder skeleton-line col-12"></span>
          </span>
          <span class="placeholder-glow d-block mb-2">
            <span class="placeholder skeleton-line col-11"></span>
          </span>
          <span class="placeholder-glow d-block mb-2">
            <span class="placeholder skeleton-line col-12"></span>
          </span>
          <span class="placeholder-glow d-block">
            <span class="placeholder skeleton-line col-9"></span>
          </span>
        </div>
      </div>
    `;
    setInnerHtml(els.detailContent, skeletonMarkup);
  }

  // ---------------------------------------------------------------------
  // Render: Full blog detail (Display article thumbnail, only if available)
  // ---------------------------------------------------------------------
  function renderDetail(post) {
    const isFav = state.bookmarks.has(post.id);
    const thumbnailMarkup = post.thumbnail
      ? `<img src="${post.thumbnail}" alt="${post.title}" class="article-thumb" loading="lazy" />`
      : "";
    const detailMarkup = `
      <article class="article-card fade-swap">
        ${thumbnailMarkup}
        <div class="article-body">
          <span class="badge rounded-pill text-bg-primary mb-3">${post.category}</span>
          <h1 class="article-title">${post.title}</h1>

          <div class="article-meta-row">
            <span class="article-author">
             <i class="bi bi-person-circle"></i>
              ${post.author}
            </span>
            <span class="dot"></span>
            <span><i class="bi bi-calendar3 me-1"></i>Posted ${formatDate(post.date)}</span>
            <span><i class="bi bi-pencil-square me-1"></i>Edited ${formatDate(post.lastEdited)}</span>
            <span><i class="bi bi-clock me-1"></i>${post.readingTime} min read</span>
          </div>

          <div class="article-actions">
            <button type="button"
                    class="btn btn-outline-secondary btn-favorite${isFav ? " is-active" : ""}"
                    id="favBtn"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="${isFav ? "Remove from favorites" : "Add to favorites"}">
              <i class="bi ${isFav ? "bi-heart-fill" : "bi-heart"} me-1"></i>
            </button>
            <button type="button"
                    class="btn btn-outline-secondary btn-favorite"
                    id="shareBtn"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Share this post">
              <i class="bi bi-share me-1"></i>
            </button>
          </div>

          <div class="article-prose">
            ${post.content}
          </div>
        </div>
      </article>
    `;
    setInnerHtml(els.detailContent, detailMarkup);

    const favBtn = document.getElementById("favBtn");
    if (favBtn) {
      favBtn.addEventListener("click", () => toggleFavorite(post.id));
    }

    const shareBtn = document.getElementById("shareBtn");
    if (shareBtn) {
      shareBtn.addEventListener("click", async () => {
        const token = state.idToToken.get(post.id) ?? post.id;
        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${token}`;
        try {
          if (navigator.share) {
            await navigator.share({ title: post.title, url: shareUrl });
          } else if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(shareUrl);
            showToast("Post link copied to clipboard", "bi-clipboard-check text-success");
          } else {
            window.prompt("Copy this link:", shareUrl);
          }
        } catch (err) {
          console.warn("Share failed:", err);
        }
      });
    }

    const deleteBtn = document.getElementById("deleteBtn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => openDeleteModal(post));
    }
    initTooltips(els.detailContent);
  }

  // ---------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------
  function selectPost(id) {
    if (state.activePostId === id) {
      updatePostUrl(id);
      return;
    }
    state.activePostId = id;
    updatePostUrl(id);
    renderList();

    const post = findPost(id);
    if (!post) return;

    // Brief skeleton loading state to simulate a fetch, then swap in content.
    renderSkeleton();
    window.setTimeout(() => {
      renderDetail(post);
      simulateReadingProgress();
    }, 450);
  }

  function showToast(message, iconClass = "bi-heart-fill text-danger") {
    if (els.favToastMsg) {
      els.favToastMsg.textContent = message;
    }
    if (els.favToastIcon) {
      els.favToastIcon.className = `bi ${iconClass}`;
    }
    if (favToast) {
      favToast.show();
    }
  }

  function toggleFavorite(id) {
    const isFav = state.bookmarks.has(id);
    if (isFav) {
      state.bookmarks.delete(id);
    } else {
      state.bookmarks.add(id);
    }
    saveBookmarksToStorage();
    updateBookmarkBadge();

    const post = findPost(id);
    if (post) {
      renderDetail(post);
    }
    renderBookmarksList();

    showToast(
      isFav ? `Removed "${post?.title ?? "post"}" from bookmarks` : `Added "${post?.title ?? "post"}" to bookmarks`,
      isFav ? "bi-heart text-muted" : "bi-heart-fill text-danger"
    );
  }

  function openDeleteModal(post) {
    pendingDeleteId = post.id;
    els.deletePostTitle.textContent = post.title;
    deleteModal.show();
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    const post = findPost(id);

    els.confirmDeleteBtn.disabled = true;
    els.confirmDeleteLabel.classList.add("d-none");
    els.confirmDeleteSpinner.classList.remove("d-none");

    try {
      const res = await fetch(`${API_BASE_URL}/posts.php?id=${id}`, { method: "DELETE" });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to delete post.");
      }

      state.posts = state.posts.filter((p) => p.id !== id);
      state.favorites.delete(id);
      state.visibleCount = Math.min(state.visibleCount, state.posts.length);
      state.hasMore = state.visibleCount < state.posts.length;

      if (state.activePostId === id) {
        state.activePostId = null;
        renderEmptyState();
      }

      renderList();

      showToast(`Deleted "${post?.title ?? "post"}"`, "bi-trash text-secondary");
    } catch (err) {
      showToast(`Couldn't delete this post: ${err.message}`, "bi-exclamation-triangle-fill text-warning");
      console.error("Delete failed:", err);
    } finally {
      els.confirmDeleteBtn.disabled = false;
      els.confirmDeleteLabel.classList.remove("d-none");
      els.confirmDeleteSpinner.classList.add("d-none");
      pendingDeleteId = null;
      deleteModal.hide();
    }
  }

  els.confirmDeleteBtn.addEventListener("click", confirmDelete);

  if (els.bookmarkBtn) {
    els.bookmarkBtn.addEventListener("click", () => {
      renderBookmarksList();
    });
  }

  // Reading progress bar reacts to scroll position of the detail panel
  function simulateReadingProgress() {
    const panel = document.querySelector(".blog-detail-panel");
    function onScroll() {
      const scrollable = panel.scrollHeight - panel.clientHeight;
      const progress = scrollable > 0 ? (panel.scrollTop / scrollable) * 100 : 0;
      els.readingProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
    panel.removeEventListener("scroll", panel._progressHandler || (() => { }));
    panel._progressHandler = onScroll;
    panel.addEventListener("scroll", onScroll);
    onScroll();
  }

  // ---------------------------------------------------------------------
  // Data loading (PHP API)
  // ---------------------------------------------------------------------
  async function loadPosts() {
    state.isLoading = true;
    state.loadError = null;
    renderList();

    try {
      const res = await fetch(`${API_BASE_URL}/posts.php`);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Unknown API error.");

      state.posts = result.data;
      const tokenMaps = buildPostTokenMaps(state.posts);
      state.idToToken = tokenMaps.idToToken;
      state.tokenToId = tokenMaps.tokenToId;
      resetInfiniteScroll();
      state.isLoading = false;
      renderBookmarksList();

      const requestedPostId = getPostIdFromUrl();
      if (requestedPostId) {
        const requestedPost = findPost(requestedPostId);
        if (requestedPost) {
          selectPost(requestedPostId);
        }
      } else {
        renderList();
      }
    } catch (err) {
      state.isLoading = false;
      state.loadError = "Couldn't load posts. Check that the API is running.";
      console.error("Failed to load posts:", err);
    }

    renderList();
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  function init() {
    state.bookmarks = new Set(loadBookmarksFromStorage());
    updateBookmarkBadge();
    renderEmptyState();
    initTooltips(document);
    loadPosts();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
