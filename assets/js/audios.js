// Sample Audio Data (replace with your own Google Drive or public links)
let audios = [
	{
		id: 1,
		title: "ADVICE TO THE FAMILY",
		category: "Greater Bethesda 2024",
		duration: "58:16",
		url: "music/ADVICE TO THE FAMILY.mp3"
	},
	{
		id: 2,
		title: "Behold His Glory",
		category: "Greater Bethesda 2024",
		duration: "16:47",
		url: "music/Behold His Glory.mp3"
	},
	{
		id: 3,
		title: "DAY 2 - TALK 1_WHEN HE COMES",
		category: "Greater Bethesda 2025",
		duration: "1:17:27",
		url: "music/DAY 2 - TALK 1_WHEN HE COMES.mp3"
	},
	{
		id: 4,
		title: "DAY 2 - TALK 2_IN HIS STEPS",
		category: "Greater Bethesda 2025",
		duration: "1:07:05",
		url: "music/DAY 2 - TALK 2_IN HIS STEPS.mp3"
	}

];

let currentTrackIndex = 0;
let isPlaying = false;
let audioElement = null;

function renderAudios(filteredAudios) {
	const grid = document.getElementById('audioGrid');
	grid.innerHTML = '';

	filteredAudios.forEach((audio, index) => {
		const cardHTML = `
                    <div class="col">
                        <div class="card audio-card h-100">
                            <div class="card-body">
							<i class="card-img-top bi bi-mic fs-1 " style="height: 50px; object-fit: cover;"></i>
                                <h5 class="card-title">${audio.title}</h5>
                                <p class="card-text text-muted">${audio.category}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">${audio.duration}</small>
                                    <button onclick="playTrack(${index})" class="btn btn-success btn-sm rounded-pill px-4">
                                        <i class="bi bi-play-fill me-1"></i> Play
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
		grid.innerHTML += cardHTML;
	});
}

function playTrack(index) {
	currentTrackIndex = index;
	const track = audios[index];

	if (!audioElement) {
		audioElement = document.getElementById('mainAudio');
		audioElement.addEventListener('timeupdate', updateProgress);
		audioElement.addEventListener('ended', nextTrack);
	}

	audioElement.src = track.url;
	audioElement.play().then(() => {
		isPlaying = true;
		document.getElementById('playerContainer').style.display = 'block';
		updateNowPlaying();
		document.getElementById('playPauseBtn').innerHTML = '<i class="bi bi-pause-fill"></i>';
	});
}

function togglePlay() {
	if (!audioElement) return;

	if (isPlaying) {
		audioElement.pause();
		document.getElementById('playPauseBtn').innerHTML = '<i class="bi bi-play-fill"></i>';
	} else {
		audioElement.play();
		document.getElementById('playPauseBtn').innerHTML = '<i class="bi bi-pause-fill"></i>';
	}
	isPlaying = !isPlaying;
}

function updateNowPlaying() {
	const track = audios[currentTrackIndex];
	document.getElementById('nowPlayingTitle').textContent = track.title;
	document.getElementById('nowPlayingCategory').textContent = track.category;
	document.getElementById('nowPlayingCover').src = track.cover;
}

function updateProgress() {
	if (!audioElement.duration) return;

	const progress = (audioElement.currentTime / audioElement.duration) * 100;
	document.getElementById('progressBar').style.width = `${progress}%`;

	document.getElementById('currentTime').textContent = formatTime(audioElement.currentTime);
	document.getElementById('duration').textContent = formatTime(audioElement.duration);
}

function formatTime(seconds) {
	if (!seconds || isNaN(seconds)) return "0:00";
	const min = Math.floor(seconds / 60);
	const sec = Math.floor(seconds % 60);
	return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function seek(e) {
	if (!audioElement) return;
	const progressContainer = e.currentTarget;
	const rect = progressContainer.getBoundingClientRect();
	const offsetX = e.clientX - rect.left;
	const percentage = offsetX / rect.width;
	audioElement.currentTime = percentage * audioElement.duration;
}

function nextTrack() {
	currentTrackIndex = (currentTrackIndex + 1) % audios.length;
	playTrack(currentTrackIndex);
}

function prevTrack() {
	currentTrackIndex = (currentTrackIndex - 1 + audios.length) % audios.length;
	playTrack(currentTrackIndex);
}

function toggleMute() {
	if (!audioElement) return;
	audioElement.muted = !audioElement.muted;
	const icon = document.getElementById('volumeIcon');
	icon.classList.toggle('bi-volume-up', !audioElement.muted);
	icon.classList.toggle('bi-volume-mute', audioElement.muted);
}

function filterAudios() {
	const term = document.getElementById('searchInput').value.toLowerCase();
	const filtered = audios.filter(audio =>
		audio.title.toLowerCase().includes(term) ||
		audio.category.toLowerCase().includes(term)
	);
	renderAudios(filtered);
}

function showSearch() {
	document.getElementById('library').scrollIntoView({ behavior: 'smooth' });
	setTimeout(() => {
		document.getElementById('searchInput').focus();
	}, 800);
}

// Initialize
window.onload = function () {
	renderAudios(audios);

	// Demo: Auto play first track after 3 seconds (remove in production)
	//setTimeout(() => playTrack(0), 3000);
};