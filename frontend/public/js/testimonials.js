/**
 * ScholarMart — Testimonials Controller
 * Handles: loading, submitting, and modal controls for the student feedback/testimonials feature.
 */

let currentTestimonialRating = 0;

// ─── LOAD & RENDER TESTIMONIALS ───────────────────────────────────────────────

async function loadTestimonials() {
    const feed = document.getElementById('testimonials-feed');
    if (!feed) return;

    try {
        const res = await fetch('/api/testimonials');
        const data = await res.json();

        if (data.status === 'success') {
            const items = data.testimonials;

            if (items.length === 0) {
                feed.innerHTML = `
                    <div class="testimonials-empty">
                        <div style="font-size: 30px; margin-bottom: 8px;">💬</div>
                        <div style="font-weight: 700; margin-bottom: 4px;">No stories yet</div>
                        <div>Be the first to share your ScholarMart experience!</div>
                    </div>
                `;
                return;
            }

            feed.innerHTML = items.map(t => {
                const initials = t.user_name
                    ? t.user_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : '??';

                const stars = '⭐'.repeat(t.rating || 5);
                const location = [t.campus, t.university].filter(Boolean).join(' · ');
                const msg = t.message.length > 180 ? t.message.slice(0, 180) + '…' : t.message;

                // Generate a consistent avatar gradient based on user name initial
                const hue = (initials.charCodeAt(0) * 37) % 360;
                const avatarStyle = `background: linear-gradient(135deg, hsl(${hue}, 60%, 40%), hsl(${hue}, 55%, 28%));`;

                return `
                    <div class="testimonial-card-item">
                        <p class="t-message">"${msg}"</p>
                        <div class="t-footer">
                            <div class="t-avatar" style="${avatarStyle}">${initials}</div>
                            <div style="flex: 1; min-width: 0;">
                                <div class="t-name">${t.user_name}</div>
                                <div class="t-meta">${location ? location + ' · ' : ''}${stars}</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (e) {
        const feed = document.getElementById('testimonials-feed');
        if (feed) {
            feed.innerHTML = `
                <div class="testimonials-empty">
                    Could not load testimonials. Check your connection.
                </div>
            `;
        }
    }
}

// ─── MODAL CONTROLS ───────────────────────────────────────────────────────────

function openTestimonialModal() {
    const overlay = document.getElementById('testimonial-modal-overlay');
    if (!overlay) return;

    // Reset form
    const form = document.getElementById('testimonial-form');
    if (form) form.reset();
    setTestimonialRating(0);
    const charCount = document.getElementById('testimonial-char-count');
    if (charCount) charCount.textContent = '0 / 500';

    // Show login notice if not logged in
    const loginNotice = document.getElementById('testimonial-login-notice');
    const submitBtn = document.getElementById('testimonial-submit-btn');
    if (loginNotice && submitBtn) {
        if (!currentToken) {
            loginNotice.style.display = 'block';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
        } else {
            loginNotice.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        }
    }

    // Open with animation
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('active'));
}

function closeTestimonialModal() {
    const overlay = document.getElementById('testimonial-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => overlay.style.display = 'none', 350);
}

// ─── STAR RATING SELECTOR ─────────────────────────────────────────────────────

function setTestimonialRating(value) {
    currentTestimonialRating = value;
    const ratingInput = document.getElementById('testimonial-rating');
    if (ratingInput) ratingInput.value = value;

    const stars = document.querySelectorAll('#testimonial-stars .tstar');
    stars.forEach((star, idx) => {
        if (idx < value) {
            star.textContent = '⭐';
            star.classList.add('filled');
        } else {
            star.textContent = '☆';
            star.classList.remove('filled');
        }
    });
}

// ─── SUBMIT TESTIMONIAL ───────────────────────────────────────────────────────

async function submitTestimonial(event) {
    event.preventDefault();

    if (!currentToken) {
        Toast.show('Please sign in to share your story!', 'warning');
        return;
    }

    const rating = parseInt(document.getElementById('testimonial-rating')?.value || '0', 10);
    const message = document.getElementById('testimonial-message')?.value?.trim();

    if (!rating || rating < 1) {
        Toast.show('Please select a star rating!', 'warning');
        return;
    }
    if (!message || message.length < 10) {
        Toast.show('Your story must be at least 10 characters.', 'warning');
        return;
    }

    const submitBtn = document.getElementById('testimonial-submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';
    }

    const loader = Toast.show('Submitting your story…', 'loading');

    try {
        const res = await fetch('/api/testimonials', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message, rating })
        });
        const data = await res.json();

        if (data.status === 'success') {
            Toast.update(loader, data.message || 'Thank you! Your story has been submitted for review. 🎉', 'success');
            closeTestimonialModal();
        } else {
            Toast.update(loader, data.message || 'Submission failed. Please try again.', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Network error. Please try again.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Feedback ✨';
        }
    }
}

// ─── ADMIN: Load Pending Testimonials ─────────────────────────────────────────

async function loadAdminTestimonials() {
    const list = document.getElementById('admin-testimonials-list');
    if (!list) return;

    list.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="toast-spinner" style="margin: 0 auto;"></div></div>';

    try {
        const res = await fetch('/api/testimonials/pending', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await res.json();

        if (data.status === 'success') {
            const items = data.testimonials;
            if (items.length === 0) {
                list.innerHTML = `
                    <div style="text-align: center; padding: 24px; color: var(--text-secondary); font-size: 13px;">
                        No testimonials pending review.
                    </div>
                `;
                return;
            }

            list.innerHTML = items.map(t => {
                const stars = '⭐'.repeat(t.rating || 5);
                const location = [t.campus, t.university].filter(Boolean).join(' · ');
                const date = new Date(t.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
                return `
                    <div class="testimonial-admin-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div>
                                <span style="font-weight: 700; font-size: 13px;">${t.user_name}</span>
                                <span style="font-size: 11px; color: var(--text-secondary); margin-left: 6px;">${location}</span>
                            </div>
                            <span style="font-size: 11px; color: var(--text-muted);">${stars} · ${date}</span>
                        </div>
                        <p class="admin-quote">"${t.message}"</p>
                        <div style="display: flex; gap: 8px; margin-top: 8px;">
                            <button class="btn btn-primary btn-sm" onclick="moderateTestimonial(${t.id}, 'approve')" style="padding: 6px 14px; width: auto; font-size: 12px;">
                                ✅ Approve & Publish
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="moderateTestimonial(${t.id}, 'reject')" style="padding: 6px 14px; width: auto; font-size: 12px; background: #FEE2E2; color: #DC2626;">
                                ✕ Reject
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (e) {
        list.innerHTML = '<p style="color: var(--danger); font-size: 13px; text-align: center;">Failed to load testimonials queue.</p>';
    }
}

async function moderateTestimonial(id, action) {
    const loader = Toast.show(action === 'approve' ? 'Approving testimonial…' : 'Rejecting testimonial…', 'loading');
    try {
        const res = await fetch(`/api/testimonials/${id}/${action}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await res.json();
        if (data.status === 'success') {
            Toast.update(loader, data.message, 'success');
            loadAdminTestimonials();
            // Refresh public feed if on landing
            loadTestimonials();
        } else {
            Toast.update(loader, data.message || 'Action failed', 'error');
        }
    } catch (e) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

// ─── CHAR COUNTER ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('testimonial-message');
    const counter = document.getElementById('testimonial-char-count');
    if (textarea && counter) {
        textarea.addEventListener('input', () => {
            const len = textarea.value.length;
            counter.textContent = `${len} / 500`;
            counter.style.color = len > 450 ? 'var(--danger)' : 'var(--text-muted)';
        });
    }

    // Load testimonials on startup
    loadTestimonials();
});
