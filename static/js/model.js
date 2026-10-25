export * from './modules/model.js';
import { model } from './modules/model.js';
if (typeof window !== 'undefined') {
    window.model = model;
}
