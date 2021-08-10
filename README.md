# OpenSpace Migration

JavaScript wrapper file to display Ordnance Survey maps with markers and/or a route.

**IMPORTANT: Use of this JavaScript file requires a valid API key. Please sign up to the [OS Data Hub](https://osdatahub.os.uk) and acquire a project API key<sup>[1]</sup> before going any further.**

## Examples

Live versions of the included examples to demonstrate usage:

- [Basic map](https://labs.os.uk/public/openspace-migration/src/examples/basic-map.html)
  - Create a simple map.
- [Location map](https://labs.os.uk/public/openspace-migration/src/examples/location-map.html)
  - Display a marker icon.
- [Marker clusters](https://labs.os.uk/public/openspace-migration/src/examples/marker-clusters.html)
  - Add multiple markers with clustering.
- [Route map](https://labs.os.uk/public/openspace-migration/src/examples/route-map.html)
  - Add a route.
- [Route map (GPX)](https://labs.os.uk/public/openspace-migration/src/examples/route-map-gpx.html)
  - Overlay a route using an external GPX file.
- [Coordinate information](https://labs.os.uk/public/openspace-migration/src/examples/control-coordinates.html)
  - Display coordinates of the mouse pointer.
- [Gazetteer search](https://labs.os.uk/public/openspace-migration/src/examples/control-gazetteer.html)
  - Incorporate a gazetteer search.
- [Overview map](https://labs.os.uk/public/openspace-migration/src/examples/control-overview.html)
  - Include an overview map.

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
    },
    controls: {
        coordinates: false,
        gazetteer: false,
        overview: false
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
`controls` | *object* | [see below]

Marker options:

Name | Type | Description
--- | --- | ---
`color` | *string* | Hexadecimal colour value (can also be an HTML [colour name](https://www.w3schools.com/colors/colors_names.asp)) for the styling the markers
`interactive` | *boolean* | Whether on not the markers are interactive (clickable)

Control options:

Name | Type | Description
--- | --- | ---
`coordinates` | *boolean* | Whether of not to display coordinates of the mouse pointer
`gazetteer` | *boolean* | Whether of not to incorporate a gazetteer search<sup>[2]</sup>
`overview` | *boolean* | Whether of not to include an overview map

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

An optional `color` key - with an associated hexadecimal colour value (or HTML colour name) - can also be included if you wish to assign different colours to the individual markers.

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

## Final Map

Once you have set your map configuration options; along with [optionally] adding any markers and/or a route - your completed Ordnance Survey map will be displayed using the `init();` function call.

## Change Log

**Version 0.1.0** (September 2020)
- Initial release.

**Version 0.2.0** (November 2020)
- Includes support for assigning different colours to individual markers; along with the option to incorporate map controls (coordinate information + gazetteer search + overview map).

**Version 0.2.1** (December 2020)
- Minor bug fixes; and new implementation of mouse position control for improved functionality on touch devices.

**Version 0.2.2** (March 2021)
- Added custom view for the overview map control.

## Notes

<sup>[1]</sup> Access to the 1:50 000 and 1:25 000 Scale Colour Raster datasets which are provided via the Leisure style require a valid OS Data Hub project API key with a [Premium plan](https://osdatahub.os.uk/plans).

<sup>[2]</sup> You will need to ensure that the OS Names API is included in your project to utilise the gazetteer search functionality.

## Licence

The contents of this repository are licensed under the [Open Government Licence 3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/).

![Logo](http://www.nationalarchives.gov.uk/images/infoman/ogl-symbol-41px-retina-black.png "OGL logo")
