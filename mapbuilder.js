// mapbuilder.js v0.1.0

var map;

function init() {
    var serviceUrl = 'https://api.os.uk/maps/raster/v1/zxy';

    // Setup the EPSG:27700 (British National Grid) projection.
    proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs");
    ol.proj.proj4.register(proj4);

    var tilegrid = new ol.tilegrid.TileGrid({
        resolutions: [ 896.0, 448.0, 224.0, 112.0, 56.0, 28.0, 14.0, 7.0, 3.5, 1.75 ],
        origin: [ -238375.0, 1376256.0 ]
    });

    // Initialize the map object.
    map = new ol.Map({
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: serviceUrl + '/' + mapConfig.style + '_27700/{z}/{x}/{y}.png?key=' + apiKey,
                    projection: 'EPSG:27700',
                    tileGrid: tilegrid
                })
            })
        ],
        target: 'map',
        view: new ol.View({
            projection: 'EPSG:27700',
            resolutions: tilegrid.getResolutions(),
            minZoom: 0,
            maxZoom: 9,
            center: mapConfig.center,
            zoom: mapConfig.zoom
        })
    });

    if( typeof routeFeature !== 'undefined' ) {
        // Add a route to the map.
        var routeSourceObj = Array.isArray(routeFeature) ?
            { features: routeFeature } :
            { url: routeFeature, format: new ol.format.GPX() };

        var routeLayer = new ol.layer.Vector({
            name: 'route',
            source: new ol.source.Vector(routeSourceObj),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 205, 0.5)',
                    width: 4
                })
            })
        });
        map.addLayer(routeLayer);

        // Add a route markers to the map.
        var routeMarkerLayer = new ol.layer.Vector({
            name: 'routeMarker',
            source: new ol.source.Vector({
                features: []
            }),
            style: routeMarkerStyle
        });
        map.addLayer(routeMarkerLayer);

        if( Array.isArray(routeFeature) ) {
            addRouteMarkers();
        }
        else {
            // Create an event listener as a handler for once all the data has been loaded
            // into the route layer.
            routeLayer.once("change", addRouteMarkers);
        }
    }

    if( typeof markerFeatures !== 'undefined' ) {
        // Add the cluster markers to the map.
        var markerLayer = new ol.layer.Vector({
            name: 'marker',
            source: new ol.source.Cluster({
                source: new ol.source.Vector({
                    features: markerFeatures
                })
            }),
            style: markerStyle
        });
        map.addLayer(markerLayer);
    }

    if( mapConfig.markers.interactive ) {
        // Define a new popup and add it as an overlay to the map.
        var popup = new Popup({ offset: [ 0, -24 ] });
        map.addOverlay(popup);

        // Create a 'singleclick' event handler which displays a popup with some basic HTML content.
        map.on('singleclick', function(evt) {
            popup.hide();

            var selectedFeatures = [];

            var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                var originalFeatures = feature.get('features');
                if( layer.get('name') == 'marker' ) {
                    if( originalFeatures.length == 1 ) {
                        selectedFeatures.push(originalFeatures[0]);
                    }
                    else if( originalFeatures.length > 1 ) {
                        var extent = new ol.extent.createEmpty();
                        for( var i = 0; i < originalFeatures.length; i++ ) {
                            ol.extent.extend(extent, originalFeatures[i].getGeometry().getExtent());
                        }
                        map.getView().fit(extent, {
                            padding: [ 20, 20, 20, 20 ],
                            duration: 200
                        });
                    }
                }
            });

            if( selectedFeatures.length > 0 ) {
                var coords = selectedFeatures[0].get('geometry').getCoordinates(),
                    content = selectedFeatures[0].get('content');
                popup.show(coords, content);
            }
        });

        // Use hasFeatureAtPixel() to indicate that the features are clickable by changing the
        // cursor style to 'pointer'.
        map.on('pointermove', function(evt) {
            if( evt.dragging ) return;

            var hit = map.hasFeatureAtPixel(evt.pixel, {
                layerFilter: function(layer) {
                    return layer.get('name') === 'marker';
                }
            });

            map.getViewport().style.cursor = hit ? 'pointer' : '';
        });

        // Create a 'change:resolution' event handler which hides any popups when view resolution changes.
        map.getView().on('change:resolution', function(evt) {
            popup.hide();
        });
    }

    /**
     * Add route markers.
     */
    function addRouteMarkers() {
        // Get the geometry for the route.
        var geometry = routeLayer.getSource().getFeatures()[0].getGeometry();

        // Extract the first and last coordinates for the route.
        var startCoord = geometry.getFirstCoordinate(),
            endCoord = geometry.getLastCoordinate();

        // Create a marker features with for start and end of the route.
        var features = [
            new ol.Feature({
                icon: 'start',
                geometry: new ol.geom.Point(startCoord)
            }),
            new ol.Feature({
                icon: 'end',
                geometry: new ol.geom.Point(endCoord)
            })
        ];

        // If the start and end coordinates are within 5m of each other - create a single marker
        // feature at the end of the route.
        if( Math.abs(startCoord[0] - endCoord[0]) <= 5 &&
            Math.abs(startCoord[1] - endCoord[1]) <= 5 ) {
            features = [
                new ol.Feature({
                    icon: 'startend',
                    geometry: new ol.geom.Point(endCoord)
                })
            ];
        }

        // Add marker features to the route marker layer.
        routeMarkerLayer.getSource().addFeatures(features);
    }

    /**
     * Returns data-driven style object for the route markers.
     */
    function routeMarkerStyle(feature) {
        // Define an SVG (sprite) object to be used for the route marker icon.
        var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="144" viewBox="0 0 48 144">
                     <svg id="start" width="48" height="48" viewBox="0 0 36 36" x="0" y="0">
                       <g stroke="#2e2e2e">
                         <path d="m7.9 3.1h23.8v19.3h-23.8z" fill="#056734"/>
                         <path d="m4 1.3h3.9v33h-3.9z" fill="#cccccb"/>
                       </g>
                     </svg>
                     <svg id="end" width="48" height="48" viewBox="0 0 36 36" x="0" y="48">
                       <path d="m7.9 3.1h23.8v19.3h-23.8z" fill="#fff"/>
                       <path d="m8.3 8.1h4.6v4.6h-4.6z"/>
                       <path d="m8.3 17.3h4.6v4.6h-4.6z"/>
                       <path d="m12.9 3.5h4.6v4.6h-4.6z"/>
                       <path d="m12.9 12.7h4.6v4.6h-4.6z"/>
                       <path d="m17.5 8.1h4.6v4.6h-4.6z"/>
                       <path d="m17.5 17.3h4.6v4.6h-4.6z"/>
                       <path d="m22.1 3.5h4.6v4.6h-4.6z"/>
                       <path d="m22.1 12.7h4.6v4.6h-4.6z"/>
                       <path d="m26.7 8.1h4.6v4.6h-4.6z"/>
                       <path d="m26.7 17.3h4.6v4.6h-4.6z"/>
                       <g stroke="#2e2e2e">
                         <path d="m7.9 3.1h23.8v19.3h-23.8z" fill="none"/>
                         <path d="m4 1.3h3.9v33h-3.9z" fill="#cccccb"/>
                       </g>
                     </svg>
                     <svg id="startend" width="48" height="48" viewBox="0 0 36 36" x="0" y="96">
                     <path d="m7.9 3.1h23.8v19.3h-23.8z" fill="#fff"/>
                       <path d="m8.3 8.1h4.6v4.6h-4.6z"/>
                       <path d="m8.3 17.3h4.6v4.6h-4.6z"/>
                       <path d="m12.9 3.5h4.6v4.6h-4.6z"/>
                       <path d="m12.9 12.7h4.6v4.6h-4.6z"/>
                       <path d="m17.5 8.1h4.6v4.6h-4.6z"/>
                       <path d="m17.5 17.3h4.6v4.6h-4.6z"/>
                       <path d="m22.1 3.5h4.6v4.6h-4.6z"/>
                       <path d="m22.1 12.7h4.6v4.6h-4.6z"/>
                       <path d="m26.7 8.1h4.6v4.6h-4.6z"/>
                       <path d="m26.7 17.3h4.6v4.6h-4.6z"/>
                       <path d="m7.9 3.1h23.8l-23.8 19.3z" fill="#056734"/>
                       <g stroke="#2e2e2e">
                         <path d="m7.9 3.1h23.8v19.3h-23.8z" fill="none"/>
                         <path d="m4 1.3h3.9v33h-3.9z" fill="#cccccb"/>
                       </g>
                     </svg>
                   </svg>`;

        var img = new Image();
        img.src = 'data:image/svg+xml,' + escape(svg);

        // Define sub-rectangle offsets.
        var offsets = {
            'start': [ 0, 0 ],
            'end': [ 0, 48 ],
            'startend': [ 0, 96 ]
        };

        var style = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [ 0.2, 0.9 ],
                img: img,
                offset: offsets[feature.get('icon')],
                imgSize: [ 48, 48 ],
                scale: 0.75
            })
        });

        return style;
    }

    /**
     * Returns data-driven style object for the marker clusters.
     */
    function markerStyle(feature) {
        // Define an SVG object to be used for the marker icon.
        var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 141.7 141.7">
                     <path fill="${mapConfig.markers.color}" d="m70.9 7.1c-24.8 0-44.9 16.5-44.9 48.4s44.9 79.1 44.9 79.1 44.9-47.2 44.9-79.1c-.1-31.9-20.2-48.4-44.9-48.4z"/>
                     <path fill="#fff" d="m98.4 52.6c0 15.2-12.3 27.5-27.5 27.5s-27.6-12.3-27.6-27.5 12.4-27.6 27.6-27.6 27.5 12.4 27.5 27.6"/>
                   </svg>`;

        var img = new Image();
        img.src = 'data:image/svg+xml,' + escape(svg);

        var style = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [ 0.5, 1 ],
                img: img,
                imgSize: [ 48, 48 ],
                scale: 0.75
            })
        });

        var size = feature.get('features').length;

        // Return a marker cluster if the number of features is greater than one.
        // Otherwise style the single feature using a standard marker icon.
        if( size > 1 ) {
            // Define the text string to show inside the marker cluster icon.
            // This will be the number of grouped features (if less than 10) or '10+' (if greater).
            var textString = size >= 10 ? '10+' : size.toString();

            style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 15,
                    fill: new ol.style.Fill({
                        color: mapConfig.markers.color,
                    })
                }),
                text: new ol.style.Text({
                    font: 'bold 12px sans-serif',
                    text: textString,
                    fill: new ol.style.Fill({
                        color: '#fff'
                    })
                })
            });
        }

        return style;
    }
}
