import { controller } from './controller.js';

/**
 * Main Application Entry Point
 */
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            controller.initEditor();
        });
    } else {
        controller.initEditor();
    }
}
