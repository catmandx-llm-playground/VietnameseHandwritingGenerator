export * from './modules/utils.js';
import { utils } from './modules/utils.js';
if (typeof window !== 'undefined') {
    window.utils = utils;
}
