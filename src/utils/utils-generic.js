import _ from 'lodash';
import colormap from 'colormap';
import ColorScale from 'color-scales';

import CrystVis from 'crystvis-js';

/*
 * Merges together all the outputs of multiple async processes into a single
 * argument to pass to a callback, according the outputs are in Object form.
 */
class CallbackMerger {
    
    constructor(n, callback) {
        this._callback = callback;
        this._n = n;

        this._arg = {};
    }

    call(arg) {
        
        if (this._n <= 0) {
            throw Error('CallbackMerger has completed its iterations');
        }

        _.merge(this._arg, arg);
        this._n -= 1;
        if (this._n === 0) {
            this._callback(this._arg);
        }
    }
}

/**
 * A custom class that acts like an Enum type
 */
class Enum {

    constructor(values={}) {

        if (Array.isArray(values)) {
            values = _.fromPairs(values.map((x, i) => [x, i]));
        }

        for (let key in values) {
            let v = values[key];

            Object.defineProperty(this, key, {
                get: () => v
            });
        }
    }

}

/**
 * A class to manage more conveniently click events sent to the CrystVis app.
 * It helps sorting out possible conflicts between different components trying
 * to each set their own handler.
 */
class ClickHandler {

    constructor(app) {

        app.onAtomClick(this.leftClick.bind(this), 
                        CrystVis.LEFT_CLICK);
        app.onAtomClick(this.leftClickCtrl.bind(this), 
                        CrystVis.LEFT_CLICK + CrystVis.CTRL_BUTTON);
        app.onAtomClick(this.leftClickShift.bind(this), 
                        CrystVis.LEFT_CLICK + CrystVis.SHIFT_BUTTON);
        app.onAtomClick(this.rightClick.bind(this), 
                        CrystVis.RIGHT_CLICK);

        this._callbacks = {
            [CrystVis.LEFT_CLICK]: {},
            [CrystVis.LEFT_CLICK + CrystVis.CTRL_BUTTON]: {},
            [CrystVis.LEFT_CLICK + CrystVis.SHIFT_BUTTON]: {},
            [CrystVis.RIGHT_CLICK]: {},
        };
    }

    setCallback(name, code, cback=null) {

        if (!(code in this._callbacks)) {
            throw Error('Invalid callback code; unsupported event type');
        }

        if (!cback) {
            delete(this._callbacks[code][name]);
        }
        else {
            this._callbacks[code][name] = cback;            
        }

    }

    leftClick(atom, event) {

        const cbacks = this._callbacks[CrystVis.LEFT_CLICK];

        for (let n in cbacks) {
            cbacks[n](atom, event);
        }

    }

    leftClickCtrl(atom, event) {

        const cbacks = this._callbacks[CrystVis.LEFT_CLICK+CrystVis.CTRL_BUTTON];

        for (let n in cbacks) {
            cbacks[n](atom, event);
        }

    }

    leftClickShift(atom, event) {

        const cbacks = this._callbacks[CrystVis.LEFT_CLICK+CrystVis.SHIFT_BUTTON];

        for (let n in cbacks) {
            cbacks[n](atom, event);
        }

    }

    rightClick(atom, event) {

        const cbacks = this._callbacks[CrystVis.RIGHT_CLICK];

        for (let n in cbacks) {
            cbacks[n](atom, event);
        }

    }

}

/**
 * Return a color scale with a specified map and number of intermediate
 * shades
 * 
 * @param  {Number} min    Smallest value of the range mapping to the color scale
 * @param  {Number} max    Largest value of the range
 * @param  {String} scale  Name of the scale (from package colormap; default is 'jet')
 * @param  {Number} shades Number of shades
 * 
 * @return {ColorScale}    Color scale
 */
function getColorScale(min=0, max=1, scale='jet', shades=10) {
    
    let colors = colormap({
        colormap: scale,
        nshades: shades,
        format: 'hex',
        alpha: 1
    });

    // If min and max are equal we get an error so fix that
    max = (max === min)? max+1e-8 : max;

    let cscale = new ColorScale(min, max, colors, 1.0);

    return cscale;
}

/**
 * Merge the values from an object into another, but without creating
 * new values if they were absent to begin with.
 * 
 * @param  {Object} a The object to update
 * @param  {Object} b The object containing the updated values
 * 
 * @return {Object}   The updated object
 */
function mergeOnly(a, b) {

    let c = {};

    for (let k in a) {
        c[k] = (k in b)? b[k] : a[k];
    }

    return c;
}

/**
 * Make a single row of an ASCII table with a fixed field width
 * 
 * @param  {Array}  values      Values to include in the row
 * @param  {Number} width       Width of each field of the row
 * @param  {Number} precision   Digits used for numerical values
 * 
 * @return {String}        Compiled row
 */
function tableRow(values, width=20, precision=5) {
    return values.reduce((s, v) => {        
        if (Number.isFinite(v) && !Number.isInteger(v)) {
            v = v.toFixed(precision);
        }
        else {
            v = v.toString();
        }
        const ns = width-v.length;
        return s + ' '.repeat(ns > 0? ns : 0) + v;
    }, '') + '\n';
}

/**
 * Download a file
 * 
 * @param  {String} data     The data content of the file, must be a valid data URL
 * @param  {[type]} filename The name of the file to download
 */
function saveContents(data, filename) {

    const download = document.createElement('a');
    download.setAttribute('download', filename);
    download.setAttribute('href', data);
    download.click();
}

/**
 * Download a PNG screenshot from data take from a Canvas
 * 
 * @param  {String} data     Data URL retrieved with the .toDataURL() method
 * @param  {[type]} filename Filename to save
 */
function saveImage(data, filename='image.png') {
    data = data.replace('image/png', 'image/octet-stream');
    saveContents(data, filename);
}

/**
 * Load an image from a file, return a promise
 * 
 * @param  {File}   file    File with the image to load
 * 
 * @return {Promise}        Promise that gets fulfilled once the image is loaded; resolves with an HTMLImageElement containing the image
 */
function loadImage(file) {

    let reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = ((e) => { 
            // Make it into a data URL
            var img = new Image();
            img.src = e.target.result;
            img.decode().then(() => {
                resolve(img);
            });
        });
        reader.readAsDataURL(file);
    });
}

/**
 * Copy something to the clipboard
 * 
 * @param  {String} data Content to copy
 */
function copyContents(data) {
    navigator.clipboard.writeText(data);
}



export { CallbackMerger, Enum, ClickHandler, 
         getColorScale, mergeOnly, saveContents, 
         saveImage, loadImage, copyContents, tableRow };