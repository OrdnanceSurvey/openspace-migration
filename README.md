# OpenSpace Migration

JavaScript wrapper file to display Ordnance Survey maps with markers and/or a route.

**IMPORTANT: Use of this JavaScript file requires a valid API key. Please sign up to the [OS Data Hub](https://osdatahub.os.uk) and acquire a project API key before going any further.**

## Installation

Include the following `<script>` tag in the header section of your HTML document:

```html
<script src="mapbuilder.js"></script>
```

## Usage

```js
var apiKey = 'INSERT_API_KEY_HERE';

var mapConfig = {
    style: 'Leisure',
    center: [ 337297, 503695 ],
    zoom: 7,
    markers: {
        color: '#c00',
        interactive: true
    }
};

// OPTIONAL: var markerFeatures = [];
// OPTIONAL: var routeFeature = [];

init();
```

Map configuration options:

Name | Type | Description
--- | --- | ---
`style` | *string* | Map style [possible values are `Leisure`, `Outdoor`, `Light` or `Road`]
`center` | *array* | Map center (easting & northing)
`zoom` | *integer* | Map zoom level
`markers` | *object* | [see below]

Marker options:

Name | Type | Description
--- | --- | ---
`color` | *string* | Hexadecimal colour value (can also be an HTML [colour name](https://www.w3schools.com/colors/colors_names.asp)) for the styling the markers
`interactive` | *boolean* | Whether on not the markers are interactive (clickable)

## Markers

Markers are added to the map as a cluster source.

Clustering helps you to manage multiple markers at different zoom levels.

When you view the map at a high zoom level, the individual markers show on the map. As you zoom out, the markers gather together into clusters, to make viewing the map easier.

If your marker interactivity in the map configuration option is set to 'true' - you can click on a cluster to zoom to the bounds of the contained markers.

Markers are added using the `markerFeatures` variable:

```js
var markerFeatures = [
    new ol.Feature({
        content: 'I am a <b>marker</b>.',
        geometry: new ol.geom.Point([ 337297, 503695 ])
    }),
    new ol.Feature({
        content: 'I am another <b>marker</b>.',
        geometry: new ol.geom.Point([ 357720, 512405 ])
    })
];
```

This is an array of one or more point features which are defined by a `geometry` (easting & northing) and `content` (string or element of HTML to display within the popup) key-value pair.

## Routes

A route can be added to the map using a `LineString` geometry made up of a sequence of easting & northing coordinate pairs:

```js
var routeFeature = [
    new ol.Feature({
        geometry: new ol.geom.LineString([
            [ 337260, 503850 ],
            [ 337390, 504100 ],
            [ 337690, 504080 ],
            [ 337720, 503180 ],
            [ 337550, 503380 ],
            [ 337370, 503400 ],
            [ 337260, 503850 ]
        ])
    })
];
```

Alternatively, if you have captured your route as a GPX file - it can be added as follows:

```js
var routeFeature = 'route.gpx';
```
