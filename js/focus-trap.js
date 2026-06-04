/**
 * focus-trap.js — AC1 (WCAG 2.1 AA §2.1.2)
 * Focus trap riutilizzabile per modali.
 * Usa MutationObserver: nessuna modifica al codice di apertura/chiusura esistente.
 */
(function () {
    'use strict';

    const FOCUSABLE = [
        'a[href]',
        'button:not([disabled])',
        'input:not([type="hidden"]):not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    /* ── FocusTrap ──────────────────────────────────────────── */
    class FocusTrap {
        constructor(el, closeBtnId) {
            this.el          = el;
            this.closeBtnId  = closeBtnId;
            this.prevFocus   = null;
            this._handler    = this._onKey.bind(this);
        }

        activate() {
            this.prevFocus = document.activeElement;
            const first = this._focusable()[0];
            if (first) first.focus();
            document.addEventListener('keydown', this._handler);
        }

        deactivate() {
            document.removeEventListener('keydown', this._handler);
            if (this.prevFocus && typeof this.prevFocus.focus === 'function') {
                this.prevFocus.focus();
            }
            this.prevFocus = null;
        }

        _focusable() {
            return Array.from(this.el.querySelectorAll(FOCUSABLE)).filter(el => {
                const s = getComputedStyle(el);
                return s.display !== 'none' && s.visibility !== 'hidden' && !el.closest('[hidden]');
            });
        }

        _onKey(e) {
            // Escape → chiude il modal
            if (e.key === 'Escape') {
                e.preventDefault();
                const btn = document.getElementById(this.closeBtnId);
                if (btn) btn.click();
                return;
            }
            if (e.key !== 'Tab') return;

            const focusable = this._focusable();
            if (!focusable.length) { e.preventDefault(); return; }

            const first  = focusable[0];
            const last   = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (e.shiftKey) {
                // Shift+Tab su primo elemento → vai all'ultimo
                if (active === first || !this.el.contains(active)) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                // Tab su ultimo elemento → vai al primo
                if (active === last || !this.el.contains(active)) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }

    /* ── Rilevamento visibilità ─────────────────────────────── */
    function isVisible(el) {
        if (!el || el.classList.contains('hidden')) return false;
        const s = getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden';
    }

    /* ── Configurazione modali ──────────────────────────────── */
    const MODALS = [
        { id: 'pattoModal', closeBtn: 'closeModal'      },
        { id: 'tableModal', closeBtn: 'closeTableModal' },
        { id: 'tabsModal',  closeBtn: 'closeTabsBtn'    },
    ];

    /* ── Inizializzazione ───────────────────────────────────── */
    function init() {
        MODALS.forEach(({ id, closeBtn }) => {
            const el = document.getElementById(id);
            if (!el) return;

            const trap = new FocusTrap(el, closeBtn);
            let wasOpen = false;

            const obs = new MutationObserver(() => {
                const open = isVisible(el);
                if (open && !wasOpen) {
                    trap.activate();
                    wasOpen = true;
                } else if (!open && wasOpen) {
                    trap.deactivate();
                    wasOpen = false;
                }
            });

            obs.observe(el, {
                attributes: true,
                attributeFilter: ['class', 'style'],
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
