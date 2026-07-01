/**
 * Scholarmart Custom Toast Notification System
 */
class ToastNotification {
  constructor() {
    this.container = null;
  }

  createContainer() {
    if (document.getElementById('toast-container')) {
      this.container = document.getElementById('toast-container');
      return;
    }

    const container = document.createElement('div');
    container.id = 'toast-container';
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

  show(message, type = 'info', duration = 3500) {
    this.createContainer();

    const toastId = 'toast_' + Math.random().toString(36).substr(2, 9);
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast toast-${type}`;
    
    let bgColor = 'var(--toast-bg-dark)';
    let textColor = 'var(--toast-text-dark)';
    let progressColor = 'var(--toast-progress-dark)';
    let icon = '';

    if (type === 'success') {
      bgColor = 'var(--toast-bg-light)';
      textColor = 'var(--toast-text-light)';
      progressColor = 'var(--success)';
      icon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="var(--success)"/></svg>`;
    } else if (type === 'error') {
      bgColor = 'var(--toast-bg-light)';
      textColor = 'var(--toast-text-light)';
      progressColor = 'var(--danger)';
      icon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM15 11H5V9H15V11Z" fill="var(--danger)"/></svg>`;
    } else if (type === 'warning') {
      bgColor = 'var(--toast-bg-light)';
      textColor = 'var(--toast-text-light)';
      progressColor = 'var(--warning)';
      icon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="var(--warning)"/></svg>`;
    } else if (type === 'loading') {
      bgColor = 'var(--toast-bg-dark)';
      textColor = 'var(--toast-text-dark)';
      progressColor = 'var(--primary-green)';
      icon = `<div class="toast-spinner"></div>`;
    }

    Object.assign(toast.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: bgColor,
      color: textColor,
      padding: '12px 16px',
      borderRadius: '16px',
      boxShadow: 'var(--shadow-md)',
      fontSize: '14px',
      fontWeight: '500',
      opacity: '0',
      transform: 'translateY(-20px)',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: 'auto',
      border: '1px solid var(--toast-border-light)',
      overflow: 'hidden',
      position: 'relative'
    });

    toast.innerHTML = `
      <div style="flex-shrink: 0; display: flex; align-items: center;">${icon}</div>
      <div class="toast-message" style="flex-grow: 1; word-break: break-word; line-height: 1.4;">${message}</div>
      ${type !== 'loading' ? `<div class="toast-progress" style="position: absolute; bottom: 0; left: 0; height: 3px; width: 100%; background-color: ${progressColor}; transform-origin: left; transition: transform ${duration}ms linear;"></div>` : ''}
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
      if (type !== 'loading') {
        const progress = toast.querySelector('.toast-progress');
        if (progress) progress.style.transform = 'scaleX(0)';
      }
    }, 50);

    if (type !== 'loading') {
      setTimeout(() => {
        this.dismiss(toastId);
      }, duration);
    }

    return toastId;
  }

  dismiss(id) {
    const toast = document.getElementById(id);
    if (!toast) return;

    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px) scale(0.9)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }
}

if (typeof window !== 'undefined' && !document.getElementById('toast-spinner-style')) {
  const style = document.createElement('style');
  style.id = 'toast-spinner-style';
  style.innerHTML = `
    .toast-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--border-white-medium);
      border-radius: 50%;
      border-top-color: var(--primary-green);
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

const Toast = new ToastNotification();
if (typeof window !== 'undefined') window.Toast = Toast;

export default Toast;
