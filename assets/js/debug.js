// Site-wide debug logging helpers
(function() {
    const MAX_LOGS = 200;
    const logBuffer = [];

    function getDebugFromQuery() {
        try {
            return new URLSearchParams(window.location.search).get('debug') === '1';
        } catch (e) {
            return false;
        }
    }

    function getDebugFromStorage() {
        try {
            return window.localStorage && localStorage.getItem('DEBUG') === '1';
        } catch (e) {
            return false;
        }
    }

    function sanitizePath(value) {
        if (typeof value !== 'string') {
            return value;
        }

        try {
            const url = new URL(value, window.location.origin);
            const pathname = url.pathname || value;
            if (url.origin === window.location.origin) {
                return pathname;
            }
            if (url.hostname) {
                return `${url.hostname}${pathname}`;
            }
            return pathname;
        } catch (e) {
            const noHash = value.split('#')[0];
            return noHash.split('?')[0];
        }
    }

    function formatDetails(details) {
        if (details === undefined) {
            return '';
        }
        if (typeof details === 'string') {
            return details;
        }
        if (typeof details === 'number' || typeof details === 'boolean') {
            return String(details);
        }
        try {
            const json = JSON.stringify(details);
            if (json && json.length > 300) {
                return `${json.slice(0, 297)}...`;
            }
            return json;
        } catch (e) {
            return String(details);
        }
    }

    function pushLog(entry) {
        logBuffer.push(entry);
        if (logBuffer.length > MAX_LOGS) {
            logBuffer.splice(0, logBuffer.length - MAX_LOGS);
        }
    }

    if (typeof window.DEBUG === 'undefined') {
        window.DEBUG = false;
    }

    if (getDebugFromQuery() || getDebugFromStorage()) {
        window.DEBUG = true;
    }

    window.debugLog = function(step, details) {
        if (!window.DEBUG) {
            return;
        }
        const prefix = `[DBG] ${step}`;
        if (details === undefined) {
            console.log(prefix);
            pushLog(prefix);
            return;
        }
        console.log(prefix, details);
        pushLog(`${prefix} ${formatDetails(details)}`);
    };

    window.debugError = function(step, details) {
        const prefix = `[DBG_ERR] ${step}`;
        if (details === undefined) {
            console.error(prefix);
            pushLog(prefix);
            return;
        }
        console.error(prefix, details);
        pushLog(`${prefix} ${formatDetails(details)}`);
    };

    window.debugTime = function(label) {
        if (!window.DEBUG) {
            return;
        }
        console.time(`[DBG] ${label}`);
    };

    window.debugTimeEnd = function(label) {
        if (!window.DEBUG) {
            return;
        }
        console.timeEnd(`[DBG] ${label}`);
    };

    window.copyDebugLogs = function() {
        const output = logBuffer.join('\n');
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(output).catch(() => {});
        }
        return output;
    };

    window.enableDebug = function() {
        try {
            localStorage.setItem('DEBUG', '1');
        } catch (e) {
        }
        window.DEBUG = true;
    };

    window.disableDebug = function() {
        try {
            localStorage.removeItem('DEBUG');
        } catch (e) {
        }
        window.DEBUG = false;
        logBuffer.length = 0;
    };

    document.addEventListener('DOMContentLoaded', function() {
        window.debugLog('page_loaded', {
            path: location.pathname,
            title: document.title
        });
    });

    window.addEventListener('error', function(event) {
        window.debugError('window_error', {
            message: event.message,
            filename: sanitizePath(event.filename),
            lineno: event.lineno,
            colno: event.colno
        });
    });

    window.addEventListener('unhandledrejection', function(event) {
        const reason = event && event.reason;
        const message = reason instanceof Error ? reason.message : String(reason);
        window.debugError('unhandled_rejection', { message });
    });
})();
