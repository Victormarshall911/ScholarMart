/**
 * Scholarmart Custom Toast Notification System
 * Avoids default browser alerts for premium visual experience.
 */
class ToastNotification {
    constructor() {
        this.container = null;
        this.createContainer();
    }

    createContainer() {
        if (document.getElementById('toast-container')) {
            this.container = document.getElementById('toast-container');
            return;
        }

        const container = document.createElement('div');
        container.id = 'toast-container';
        // Add default container styles via inline CSS for self-containment
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '90%',
            maxWidth: '380px',
            pointerEvents: 'none'
        });

        document.body.appendChild(container);
        this.container = container;
    }

    /**
     * Show a custom toast notification
     * @param {string} message 
     * @param {'success' | 'error' | 'warning' | 'info' | 'loading'} type 
     * @param {number} duration milliseconds (defaults to 3500)
     * @returns {string} Toast element ID
     */
    show(message, type = 'info', duration = 3500) {
        this.createContainer();

        const toastId = 'toast_' + Math.random().toString(36).substr(2, 9);
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast toast-${type}`;
        
        // Define colors
        let bgColor = '#1F2937'; // info/dark
        let textColor = '#FFFFFF';
        let progressColor = '#4B5563';
        let icon = '';

        if (type === 'success') {
            bgColor = '#FFFFFF';
            textColor = '#1F2937';
            progressColor = '#22C55E';
            icon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#22C55E"/></svg>`;
        } else if (type === 'error') {
            bgColor = '#FFFFFF';
            textColor = '#1F2937';
            progressColor = '#EF4444';
            icon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM15 11H5V9H15V11Z" fill="#EF4444"/></svg>`;
        } else if (type === 'warning') {
            bgColor = '#FFFFFF';
            textColor = '#1F2937';
            progressColor = '#F59E0B';
            icon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="#F59E0B"/></svg>`;
        } else if (type === 'loading') {
            bgColor = '#1F2937';
            textColor = '#FFFFFF';
            progressColor = '#00A86B';
            icon = `<div class="toast-spinner"></div>`;
        }

        // Apply visual card styles
        Object.assign(toast.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: bgColor,
            color: textColor,
            padding: '12px 16px',
            borderRadius: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            fontWeight: '500',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'auto',
            border: '1px solid #E5E7EB',
            overflow: 'hidden',
            position: 'relative'
        });

        toast.innerHTML = `
            <div style="flex-shrink: 0; display: flex; align-items: center;">${icon}</div>
            <div class="toast-message" style="flex-grow: 1; word-break: break-word; line-height: 1.4;">${message}</div>
            ${type !== 'loading' ? `<div class="toast-progress" style="position: absolute; bottom: 0; left: 0; height: 3px; width: 100%; background-color: ${progressColor}; transform-origin: left; transition: transform ${duration}ms linear;"></div>` : ''}
        `;

        this.container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
            
            // Start progress bar scaling if not loading
            if (type !== 'loading') {
                const progress = toast.querySelector('.toast-progress');
                if (progress) {
                    progress.style.transform = 'scaleX(0)';
                }
            }
        }, 50);

        // Schedule auto dismissal if not loading
        if (type !== 'loading') {
            setTimeout(() => {
                this.dismiss(toastId);
            }, duration);
        }

        return toastId;
    }

    /**
     * Dismiss a specific toast
     * @param {string} id 
     */
    dismiss(id) {
        const toast = document.getElementById(id);
        if (!toast) return;

        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px) scale(0.9)';
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Update an active toast (e.g. from loading state to success)
     * @param {string} id 
     * @param {string} message 
     * @param {'success' | 'error' | 'warning' | 'info'} newType 
     */
    update(id, message, newType) {
        const toast = document.getElementById(id);
        if (!toast) return;

        // Re-run show layout inside target element
        let bgColor = '#FFFFFF';
        let textColor = '#1F2937';
        let progressColor = '#4B5563';
        let icon = '';

        if (newType === 'success') {
            progressColor = '#22C55E';
            icon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#22C55E"/></svg>`;
        } else if (newType === 'error') {
            progressColor = '#EF4444';
            icon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM15 11H5V9H15V11Z" fill="#EF4444"/></svg>`;
        } else if (newType === 'warning') {
            progressColor = '#F59E0B';
            icon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="#F59E0B"/></svg>`;
        }

        toast.style.backgroundColor = bgColor;
        toast.style.color = textColor;
        
        toast.innerHTML = `
            <div style="flex-shrink: 0; display: flex; align-items: center;">${icon}</div>
            <div class="toast-message" style="flex-grow: 1; word-break: break-word; line-height: 1.4;">${message}</div>
            <div class="toast-progress" style="position: absolute; bottom: 0; left: 0; height: 3px; width: 100%; background-color: ${progressColor}; transform-origin: left; transition: transform 3500ms linear;"></div>
        `;

        // Start progress transition
        setTimeout(() => {
            const progress = toast.querySelector('.toast-progress');
            if (progress) {
                progress.style.transform = 'scaleX(0)';
            }
        }, 50);

        // Auto dismiss after 3.5 seconds
        setTimeout(() => {
            this.dismiss(id);
        }, 3500);
    }
}

// Attach style for loading spinner keyframes to document head
const style = document.createElement('style');
style.innerHTML = `
    .toast-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #00A86B;
        animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

const Toast = new ToastNotification();
window.Toast = Toast; // Make global
