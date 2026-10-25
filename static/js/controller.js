import { model } from './modules/model.js';
import { view } from './view.js';

/**
 * Controller Module
 * Coordinates application initialization, debug logging, and data bootstrapping.
 */
export const controller = {};

controller.doLog = false;

controller.initEditor = function () {
    controller.initLogging();
    view.init();
    model.getData(function () {
        view.render();
        if (typeof view.checkDraftOnLoad === 'function') {
            view.checkDraftOnLoad();
        }
    });
};

controller.initLogging = function () {
    if (typeof window === 'undefined') return;
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has('debug')) {
        controller.doLog = true;
    }
};

if (typeof window !== 'undefined') {
    window.controller = controller;
}
