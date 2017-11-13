/* global expect, describe,it */
/* eslint no-console: 0 */
/* eslint-env node, mocha */
'use strict';

import React from 'react';
import TestUtils from 'react-addons-test-utils';
import SketchField from '../src/SketchField';

function objectFromDrag(canvas, from = { x: 0, y: 0 }, to = { x: 10, y: 10 }, id) {
    function MouseEventPositionGenerator(pos = { x: 0, y: 0 }) {
        const eventX = ['x', 'pageX', 'screenX', 'clientX', 'offsetX'];
        const eventY = ['y', 'pageY', 'screenY', 'clientY', 'offsetY'];
        const generated = {};
        eventX.forEach(key => generated[key] = pos.x);
        eventY.forEach(key => generated[key] = pos.y);
        return generated;
    }

    canvas.trigger('mouse:down', { e: MouseEventPositionGenerator(from) });
    canvas.trigger('mouse:move', { e: MouseEventPositionGenerator(to) });
    canvas.trigger('mouse:up', { e: MouseEventPositionGenerator(to) });
    // Get the last object as the last created object
    const objects = canvas.getObjects();
    const newObj = objects[objects.length - 1];
    id && (newObj.id = id);
    return newObj;
}

describe('SketchField', () => {

    it('Loads Normally', () => {
        require('../src/SketchField')
    });

    it('Contains canvas tag', () => {
        let sketch = TestUtils.renderIntoDocument(<SketchField />);
        expect(TestUtils.findRenderedDOMComponentWithTag(sketch, 'canvas')).to.exist;
    });

    it('Drag to create rectangle', () => {
        const sketch = TestUtils.renderIntoDocument(<SketchField tool={'rectangle'} />);
        const canvas = sketch._fc;
        expect(canvas).to.exist;
        
        const startPt = { x: 10, y: 10 };
        const endPt = { x: 40, y: 50 };
        const bounding = {
            left: startPt.x,
            top: startPt.y,
            width: endPt.x - startPt.x,
            height: endPt.y - startPt.y
        }

        // From left-top to right-bottom
        objectFromDrag(canvas, startPt, endPt);

        // Check the rectangle existed
        expect(canvas.getObjects()[0]).to.exist;
        const rect1 = canvas.getObjects()[0];
        expect(rect1.type).equal('rect');

        // Check the rectangle dimension
        expect({ left: rect1.left, top: rect1.top, width: rect1.width, height: rect1.height }).eql(bounding);

        canvas.remove(rect1);
        // From right-bottom to left-top;
        objectFromDrag(canvas, endPt, startPt);
        const rect2 = canvas.getObjects()[0];
        expect(rect2.type).equal('rect');

        // Check the rectangle dimension
        expect({ left: rect2.left, top: rect2.top, width: rect2.width, height: rect2.height }).eql(bounding);
    });

    it('Undo/Redo for multiple rectangles add to canvas', () => {
        const sketch = TestUtils.renderIntoDocument(<SketchField tool={'rectangle'} />);
        const canvas = sketch._fc;
        expect(canvas).to.exist;

        const startPt = { x: 10, y: 10 };
        const endPt = { x: 40, y: 50 };

        canvas.renderOnAddRemove = false;
        objectFromDrag(canvas, startPt, endPt, 'rect1');
        objectFromDrag(canvas, startPt, endPt, 'rect2');
        expect(canvas.getObjects().map(o => o.id)).eql(['rect1', 'rect2']);

        sketch.undo();
        expect(canvas.getObjects().map(o => o.id)).eql(['rect1']);

        sketch.undo();
        expect(canvas.getObjects().map(o => o.id)).eql([]);

        sketch.redo();
        expect(canvas.getObjects().map(o => o.id)).eql(['rect1']);

        objectFromDrag(canvas, startPt, endPt, 'rect3');
        expect(canvas.getObjects().map(o => o.id)).eql(['rect1', 'rect3']);

        sketch.undo();
        expect(canvas.getObjects().map(o => o.id)).eql(['rect1']);
    });
});