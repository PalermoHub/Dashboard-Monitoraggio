/* leaflet-hash 0.2.1 — mlevans/leaflet-hash (MIT license) */
(function(window, document, undefined) {
    "use strict";

    L.Hash = function(map) {
        this.onHashChange = L.Util.bind(this.onHashChange, this);
        if (map) { this.init(map); }
    };

    L.Hash.parseHash = function(hash) {
        if (hash.indexOf('#') === 0) { hash = hash.substr(1); }
        var args = hash.split("/");
        if (args.length === 3) {
            var zoom = parseInt(args[0], 10),
                lat  = parseFloat(args[1]),
                lon  = parseFloat(args[2]);
            if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) { return false; }
            return { center: new L.LatLng(lat, lon), zoom: zoom };
        }
        return false;
    };

    L.Hash.formatHash = function(map) {
        var center    = map.getCenter(),
            zoom      = map.getZoom(),
            precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        return "#" + [zoom,
            L.Util.formatNum(center.lat, precision),
            L.Util.formatNum(center.lng, precision)
        ].join("/");
    };

    L.Hash.prototype = {
        map: null,
        lastHash: null,
        parseHash: L.Hash.parseHash,
        formatHash: L.Hash.formatHash,

        init: function(map) {
            this.map = map;
            this.lastHash = null;
            this.onHashChange();
            this.isListening = false;
            this.hashChangeInterval = null;
            this.startListening();
        },

        remove: function() {
            this.stopListening();
            this.map = null;
        },

        onMapMove: function() {
            if (this.movingMap || !this.map._loaded) { return false; }
            var hash = this.formatHash(this.map);
            if (this.lastHash !== hash) {
                location.replace(hash);
                this.lastHash = hash;
            }
        },

        movingMap: false,

        update: function() {
            var hash = location.hash;
            if (hash === this.lastHash) { return; }
            var parsed = this.parseHash(hash);
            if (parsed) {
                this.movingMap = true;
                this.map.setView(parsed.center, parsed.zoom);
                this.movingMap = false;
            } else {
                this.onMapMove(this.map);
            }
        },

        onHashChange: function() { this.update(); },

        isListening: false,
        hashChangeInterval: null,

        startListening: function() {
            this.map.on("moveend", this.onMapMove, this);
            if (L.Browser.ie) {
                this.hashChangeInterval = setInterval(this.onHashChange, 50);
            } else {
                window.addEventListener("hashchange", this.onHashChange, false);
            }
            this.isListening = true;
        },

        stopListening: function() {
            this.map.off("moveend", this.onMapMove, this);
            if (L.Browser.ie) {
                clearInterval(this.hashChangeInterval);
            } else {
                window.removeEventListener("hashchange", this.onHashChange, false);
            }
            this.isListening = false;
        }
    };

    L.hash = function(map) { return new L.Hash(map); };

    L.Map.prototype.addHash = function() { this._hash = L.hash(this); };
    L.Map.prototype.removeHash = function() { this._hash.remove(); };

})(window, document);
