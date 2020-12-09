// mapbuilder.js v0.2.1

var map, routeLayer, routeMarkerLayer, markerLayer;
var styles = '';

function init() {
    var tileServiceUrl = 'https://api.os.uk/maps/raster/v1/zxy',
        nameServiceUrl = 'https://api.os.uk/search/names/v1';

    // Setup the EPSG:27700 (British National Grid) projection.
    proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs");
    ol.proj.proj4.register(proj4);

    var extent = [ -238375.0, 0.0, 900000.0, 1376256.0 ];

    var tilegrid = new ol.tilegrid.TileGrid({
        resolutions: [ 896.0, 448.0, 224.0, 112.0, 56.0, 28.0, 14.0, 7.0, 3.5, 1.75 ],
        origin: [ -238375.0, 1376256.0 ]
    });

    var tileSource = new ol.source.XYZ({
        url: tileServiceUrl + '/' + mapConfig.style + '_27700/{z}/{x}/{y}.png?key=' + apiKey,
        projection: 'EPSG:27700',
        tileGrid: tilegrid
    });

    // Initialize the map object.
    map = new ol.Map({
        layers: [
            new ol.layer.Tile({
                source: tileSource
            })
        ],
        target: 'map',
        view: new ol.View({
            projection: 'EPSG:27700',
            extent: extent,
            resolutions: tilegrid.getResolutions(),
            minZoom: 0,
            maxZoom: 9,
            center: mapConfig.center,
            zoom: mapConfig.zoom
        })
    });

    if( mapConfig.controls.coordinates ) {
        styles += `.custom-mouse-position { display:block; position:absolute; margin:auto 25%; width:50%; padding:10px 0; border:none; border-radius:0 0 3px 3px; text-align:center; color:#fff; background:#333; z-index:9999; } `;

        // Define the mouse position control.
        var mousePositionControl = new ol.control.MousePosition({
            coordinateFormat: getCoordinateString,
            className: 'custom-mouse-position',
            undefinedHTML: '',
        });

        map.controls.push(mousePositionControl);
    }

    if( mapConfig.controls.gazetteer ) {
        styles += `.ol-geocoder .gcd-gl-btn { background-image:url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNSIgaGVpZ2h0PSIxNSIgdmlld0JveD0iMCAwIDMwIDMwIj4KPHBhdGggZD0iTTIwLjE5NCwzLjQ2Yy00LjYxMy00LjYxMy0xMi4xMjEtNC42MTMtMTYuNzM0LDBjLTQuNjEyLDQuNjE0LTQuNjEyLDEyLjEyMSwwLDE2LjczNWM0LjEwOCw0LjEwNywxMC41MDYsNC41NDcsMTUuMTE2LDEuMzRjMC4wOTcsMC40NTksMC4zMTksMC44OTcsMC42NzYsMS4yNTRsNi43MTgsNi43MThjMC45NzksMC45NzcsMi41NjEsMC45NzcsMy41MzUsMGMwLjk3OC0wLjk3OCwwLjk3OC0yLjU2LDAtMy41MzVsLTYuNzE4LTYuNzJjLTAuMzU1LTAuMzU0LTAuNzk0LTAuNTc3LTEuMjUzLTAuNjc0QzI0Ljc0MywxMy45NjcsMjQuMzAzLDcuNTcsMjAuMTk0LDMuNDZ6TTE4LjA3MywxOC4wNzRjLTMuNDQ0LDMuNDQ0LTkuMDQ5LDMuNDQ0LTEyLjQ5MiwwYy0zLjQ0Mi0zLjQ0NC0zLjQ0Mi05LjA0OCwwLTEyLjQ5MmMzLjQ0My0zLjQ0Myw5LjA0OC0zLjQ0MywxMi40OTIsMEMyMS41MTcsOS4wMjYsMjEuNTE3LDE0LjYzLDE4LjA3MywxOC4wNzR6IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg=="); } .ol-geocoder ul.gcd-gl-result { max-height:13.75em; } `;

        // Set the provider (passing any options that are required).
        var provider = osOpenNames({
            url: nameServiceUrl + '/find',
        });

        // Instantiate the Geocoder control.
        var geocoder = new Geocoder('nominatim', {
            provider: provider,
            autoComplete: true,
            autoCompleteMinLength: 3,
            placeholder: 'Search...',
            targetType: 'glass-button',
            lang: 'en',
            keepOpen: false,
            preventDefault: true
        });
        map.addControl(geocoder);

        // Event handler which is triggered when an address is chosen.
        geocoder.on('addresschosen', function(evt) {
            if( evt.bbox )
                map.getView().fit(evt.bbox, { duration: 500 });
            else
                map.getView().animate({ zoom: 9, center: evt.coordinate });
        });
    }

    if( mapConfig.controls.overview ) {
        styles += `.ol-custom-overviewmap, .ol-custom-overviewmap.ol-uncollapsible { top:auto; bottom:24px; left:auto; right:8px; } `;

        // Define the overview map control.
        var overviewMapControl = new ol.control.OverviewMap({
            className: 'ol-overviewmap ol-custom-overviewmap',
            collapsible: false,
            layers: [
                new ol.layer.Tile({
                    source: tileSource
                })
            ]
        });

        map.controls.push(overviewMapControl);
    }

    var styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    if( typeof routeFeature !== 'undefined' ) {
        // Add a route to the map.
        var routeSourceObj = Array.isArray(routeFeature) ?
            { features: routeFeature } :
            { url: routeFeature, format: new ol.format.GPX() };

        routeLayer = new ol.layer.Vector({
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
        routeMarkerLayer = new ol.layer.Vector({
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
        markerLayer = new ol.layer.Vector({
            name: 'marker',
            source: new ol.source.Cluster({
                // distance: 20,
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
     * Returns string with templated details for the input coordinate location.
     */
    function getCoordinateString(coord) {
        var templateOSGB = 'Easting: {x} Northing: {y}';
        var strOSGB = ol.coordinate.format(coord, templateOSGB, 0);

        var templateWGS84 = 'Longitude: {x} Latitude: {y}';
        var strWGS84 = ol.coordinate.format(ol.proj.transform(coord, 'EPSG:27700', 'EPSG:4326'), templateWGS84, 6);

        var gridRef = toGridRef({ ea: coord[0], no: coord[1] });
        var strGridRef = 'OS Grid Reference: ' + gridRef.text;

        return strOSGB + '<br>' + strWGS84 + '<br>' + strGridRef;
    }

    /**
     * Convert northing and easting to letter and number grid system.
     */
    function toGridRef(coordinates) {
        var prefixes = new Array(
            new Array("SV","SW","SX","SY","SZ","TV","TW"),
            new Array("SQ","SR","SS","ST","SU","TQ","TR"),
            new Array("SL","SM","SN","SO","SP","TL","TM"),
            new Array("SF","SG","SH","SJ","SK","TF","TG"),
            new Array("SA","SB","SC","SD","SE","TA","TB"),
            new Array("NV","NW","NX","NY","NZ","OV","OW"),
            new Array("NQ","NR","NS","NT","NU","OQ","OR"),
            new Array("NL","NM","NN","NO","NP","OL","OM"),
            new Array("NF","NG","NH","NJ","NK","OF","OG"),
            new Array("NA","NB","NC","ND","NE","OA","OB"),
            new Array("HV","HW","HX","HY","HZ","JV","JW"),
            new Array("HQ","HR","HS","HT","HU","JQ","JR"),
            new Array("HL","HM","HN","HO","HP","JL","JM")
        );

        var x = Math.floor(coordinates.ea / 100000);
        var y = Math.floor(coordinates.no / 100000);

        var prefix = prefixes[y][x];

        var e = Math.round(coordinates.ea % 100000);
        var n = Math.round(coordinates.no % 100000);

        e = String(e).padStart(5, '0');
        n = String(n).padStart(5, '0');

        var text = prefix + ' ' + e + ' ' + n,
            html = prefix + '&thinsp;' + e + '&thinsp;' + n;

        return { text: text, html: html };
    }

    /**
     * Custom provider for OS Names API.
     * Factory function which returns an object with the methods 'getParameters'
     * and 'handleResponse' called by the Geocoder.
     */
    function osOpenNames(options) {
        var url = options.url;
        return {
            getParameters: function(opt) {
                return {
                    url: url,
                    params: {
                        key: apiKey,
                        query: opt.query,
                        maxresults: 5
                    }
                };
            },
            handleResponse: function(data) {
                // On error show alert with returned error message.
                if( data.error ) {
                    alert('Error: ' + data.error.message);
                    return;
                }

                var response = [];

                if( data.header.totalresults > 0 ) {
                    data.results.forEach(function(val, i) {
                        var result = val.GAZETTEER_ENTRY;

                        // Transform the returned coordinates into latitude and longitude.
                        var coords = ol.proj.transform(
                            [ result.GEOMETRY_X, result.GEOMETRY_Y ],
                            'EPSG:27700',
                            'EPSG:4326'
                        );

                        // Generate the populated place string.
                        var name = result.NAME1;
                        if( result.NAME2 ) {
                            name += '/';
                            name += result.NAME2;
                        }
                        name = name.toUpperCase();

                        var entity = [ name ];
                        if( result.POPULATED_PLACE ) {
                            entity.push(result.POPULATED_PLACE);
                        }
                        if( result.DISTRICT_BOROUGH ) {
                            entity.push(result.DISTRICT_BOROUGH);
                        }
                        if( result.COUNTY_UNITARY ) {
                            entity.push(result.COUNTY_UNITARY);
                        }
                        entity.push(result.REGION);
                        entity.push(result.COUNTRY);

                        entity = entity.filter((item, index) => entity.indexOf(item) === index);

                        response[i] = {
                            lon: coords[0],
                            lat: coords[1],
                            address: {
                                name: entity.join(', ')
                            }
                        };

                        // Add transformed bounding box value to the response.
                        // Minimum bounding rectangle (MBR) is returned for all features except postcodes.
                        if( result.MBR_XMIN && result.MBR_YMIN && result.MBR_XMAX && result.MBR_YMAX )
                            response[i].bbox = ol.proj.transformExtent(
                                [ result.MBR_XMIN, result.MBR_YMIN, result.MBR_XMAX, result.MBR_YMAX ],
                                'EPSG:27700',
                                'EPSG:4326'
                            );
                    });
                }

                return response;
            }
        };
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
        if( new ol.geom.LineString([ startCoord, endCoord ]).getLength() <= 5 ) {
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
      var color = feature.get('features')[0].get('color') || mapConfig.markers.color;

      // Define an SVG object to be used for the marker icon.
      var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 141.7 141.7">
                   <path fill="${color}" d="m70.9 7.1c-24.8 0-44.9 16.5-44.9 48.4s44.9 79.1 44.9 79.1 44.9-47.2 44.9-79.1c-.1-31.9-20.2-48.4-44.9-48.4z"/>
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
            }),
            zIndex: 1
        });

        var size = feature.get('features').length;

        // Return a marker cluster if the number of features is greater than one.
        // Otherwise style the single feature using a standard marker icon.
        if( size > 1 ) {
            // Define the text string to show inside the marker cluster icon.
            var textString = (size < 10) ? size.toString() :
                (size >= 10 && size < 20) ? '10+' :
                (size >= 20 && size < 30) ? '20+' :
                (size >= 30 && size < 50) ? '30+' :
                '50+';

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
                }),
                zIndex: 2
            });
        }

        return style;
    }
}
