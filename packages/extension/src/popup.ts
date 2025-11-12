/**
 * Main script for the PufferPhish extension popup.
 *
 * This script handles view switching for the demo and
 * will be expanded to include real logic.
 */

// --- CSS IMPORTS ---
// Import your shared CSS files
// (Adjust the path if they are not in src/assets/css)
// import './assets/css/main.css';
// import './assets/css/components.css';

// Import the popup-specific styles
import './popup.css';
import './main.css';
import './components.css';
// --- END CSS IMPORTS ---


// Define the possible view states
type ViewName = 'safe' | 'warning' | 'danger';

/**
 * Shows a specific view in the extension popup and hides others.
 * @param {ViewName} viewName - The name of the view to show.
 */
function showView(viewName: ViewName): void {
    // Hide all views
    document.querySelectorAll<HTMLElement>('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected view
    const viewToShow = document.getElementById(`${viewName}-view`);
    if (viewToShow) {
        viewToShow.classList.add('active');
    } else {
        console.error('View not found:', viewName);
        return;
    }

    // Announce to screen readers
    const stateText: Record<ViewName, string> = {
        'safe': 'Safe state: You are protected',
        'warning': 'Warning state: This page has suspicious signs',
        'danger': 'Danger state: This page is likely a scam'
    };

    // Find existing announcement div or create a new one
    let announcement = document.getElementById('sr-announcement');
    if (!announcement) {
        announcement = document.createElement('div');
        announcement.id = 'sr-announcement';
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only'; // Assumes .sr-only class exists
        document.body.appendChild(announcement);
    }

    announcement.textContent = stateText[viewName] || `Viewing ${viewName}`;

    // Clear the announcement after a delay
    setTimeout(() => {
        if (announcement) {
            announcement.textContent = '';
        }
    }, 1000);
}

/**
 * Attaches all event listeners for the popup.
 */
function setupEventListeners(): void {
    // --- Demo Controls ---
    const safeButton = document.getElementById('demo-safe') as HTMLButtonElement | null;
    if (safeButton) {
        safeButton.addEventListener('click', () => showView('safe'));
    }

    const warningButton = document.getElementById('demo-warning') as HTMLButtonElement | null;
    if (warningButton) {
        warningButton.addEventListener('click', () => showView('warning'));
    }

    const dangerButton = document.getElementById('demo-danger') as HTMLButtonElement | null;
    if (dangerButton) {
        dangerButton.addEventListener('click', () => showView('danger'));
    }

    // Keyboard navigation for demo controls
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === '1') showView('safe');
        if (e.key === '2') showView('warning');
        if (e.key === '3') showView('danger');
    });

    // --- Add other application event listeners here ---
    // Example:
    // const settingsButton = document.getElementById('settings-button') as HTMLButtonElement | null;
    // if (settingsButton) {
    //     settingsButton.addEventListener('click', () => {
    //         console.log('Settings button clicked');
    //         // chrome.runtime.openOptionsPage(); // Example for real extension
    //     });
    // }
    //
    // const dashboardButton = document.getElementById('dashboard-button') as HTMLButtonElement | null;
    // if (dashboardButton) {
    //     dashboardButton.addEventListener('click', () => {
    //         console.log('Dashboard button clicked');
    //         // chrome.tabs.create({ url: 'dashboard.html' }); // Example
    //     });
    // }
}

// Wait for the DOM to be fully loaded before attaching listeners
document.addEventListener('DOMContentLoaded', setupEventListeners);