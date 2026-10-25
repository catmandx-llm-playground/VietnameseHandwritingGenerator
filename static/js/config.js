export * from './modules/config.js';
import { APP_CONFIG } from './modules/config.js';
if (typeof window !== 'undefined') {
    window.APP_CONFIG = APP_CONFIG;
}
