const API_BASE = "https://gamingportfolio.onrender.com";

/* ---------------- SMALL HELPER ---------------- */

// Escapes user-submitted text before it's inserted with innerHTML,
// so a comment can't inject a script or break the page layout.
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

/* ---------------- LIKE BUTTON ---------------- */

const likeBtn = document.getElementById("like-btn");
const likeCountEl = document.getElementById("like-count");
const LIKE_STORAGE_KEY = "unity-profile-liked";

async function loadLikes() {
    try {
        const res = await fetch(`${API_BASE}/api/likes`);
        const data = await res.json();
        likeCountEl.textContent = data.count;
    } catch (err) {
        console.error("Couldn't load like count:", err);
        likeCountEl.textContent = "–";
    }
}

function setLikedState(liked) {
    likeBtn.classList.toggle("is-liked", liked);
    likeBtn.setAttribute("aria-pressed", liked ? "true" : "false");
    if (liked) {
        localStorage.setItem(LIKE_STORAGE_KEY, "1");
    } else {
        localStorage.removeItem(LIKE_STORAGE_KEY);
    }
}

likeBtn.addEventListener("click", async () => {

    const alreadyLiked = localStorage.getItem(LIKE_STORAGE_KEY) === "1";
    const action = alreadyLiked ? "unlike" : "like";

    likeBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/likes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action })
        });
        const data = await res.json();
        likeCountEl.textContent = data.count;
        setLikedState(!alreadyLiked);
    } catch (err) {
        console.error("Couldn't update like:", err);
    } finally {
        likeBtn.disabled = false;
    }
});

setLikedState(localStorage.getItem(LIKE_STORAGE_KEY) === "1");
loadLikes();

/* ---------------- COMMENTS ---------------- */

const commentForm = document.getElementById("comment-form");
const commentNameInput = document.getElementById("comment-name");
const commentMessageInput = document.getElementById("comment-message");
const commentList = document.getElementById("comment-list");
const commentStatus = document.getElementById("comment-status");

function showCommentStatus(message, isError = false) {
    commentStatus.textContent = message;
    commentStatus.hidden = false;
    commentStatus.classList.toggle("is-error", isError);
    setTimeout(() => { commentStatus.hidden = true; }, 3000);
}

function renderComments(comments) {

    commentList.innerHTML = "";

    if (comments.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "No comments yet — be the first.";
        commentList.appendChild(empty);
        return;
    }

    comments
        .slice()
        .reverse()
        .forEach((comment, i) => {
            const item = document.createElement("div");
            item.className = "comment-card";
            item.style.setProperty("--card-delay", `${Math.min(i, 8) * 0.04}s`);

            const date = comment.createdAt
                ? new Date(comment.createdAt).toLocaleDateString()
                : "";

            item.innerHTML = `
                <div class="comment-head">
                    <span class="comment-name">${escapeHtml(comment.name)}</span>
                    <span class="comment-date">${date}</span>
                </div>
                <p class="comment-message">${escapeHtml(comment.message)}</p>
            `;

            commentList.appendChild(item);
        });
}

async function loadComments() {
    try {
        const res = await fetch(`${API_BASE}/api/comments`);
        const data = await res.json();
        renderComments(data.comments || []);
    } catch (err) {
        console.error("Couldn't load comments:", err);
        commentList.innerHTML = `<div class="empty-state">Comments are unavailable right now.</div>`;
    }
}

commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = commentNameInput.value.trim();
    const message = commentMessageInput.value.trim();

    if (!name || !message) return;

    const submitBtn = commentForm.querySelector("button");
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, message })
        });

        if (!res.ok) throw new Error("Request failed");

        commentForm.reset();
        showCommentStatus("Comment posted.");
        loadComments();

    } catch (err) {
        console.error("Couldn't post comment:", err);
        showCommentStatus("Couldn't post that comment — try again.", true);
    } finally {
        submitBtn.disabled = false;
    }
});

loadComments();
