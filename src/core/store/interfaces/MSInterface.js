import { makeSelector, makeDisplayEllipsoids, makeDisplayLabels, makeDisplayCScales, BaseInterface } from '../utils';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';

const initialMSState = {
    ms_view: null,
    ms_ellipsoids_on: false,
    ms_ellipsoids_scale: 0.05,
    ms_labels_type: 'none',
    ms_cscale_type: 'none',
    ms_cscale_displ: null
};

const msColor = 0xff8000;

const msDisplayEllipsoids = makeDisplayEllipsoids('ms', msColor);
const msDisplayLabels = makeDisplayLabels('ms', msColor, (r) => ([1.414*r, 0.0, 0.0]));
const msDisplayCScales = makeDisplayCScales('ms');

class MSInterface extends BaseInterface {

    get hasData() {
        let m = this.state.app_viewer.model;
        return (m && (m.hasArray('ms')));
    }

    get hasEllipsoids() {
        return this.state.ms_ellipsoids_on;
    }

    set hasEllipsoids(v) {
        this.dispatch({
            type: 'call',
            function: msDisplayEllipsoids,
            arguments: [v, this.state.ms_ellipsoids_scale]
        });
    }

    get ellipsoidScale() {
        return this.state.ms_ellipsoids_scale;
    }

    set ellipsoidScale(v) {
        this.dispatch({
            type: 'call',
            function: msDisplayEllipsoids,
            arguments: [this.state.ms_ellipsoids_on, v]
        });
    }

    get labelsMode() {
        return this.state.ms_labels_type;
    }

    set labelsMode(v) {
        this.dispatch({
            type: 'call', 
            function: msDisplayLabels,
            arguments: [v]
        });
    }

    get cscaleMode() {
        return this.state.ms_cscale_type;
    }

    set cscaleMode(v) {
        this.dispatch({
            type: 'call',
            function: msDisplayCScales,
            arguments: [v]
        });
    }

}

function useMSInterface() {
    let state = useSelector(makeSelector('ms', ['app_viewer']), shallowEqual);
    let dispatcher = useDispatch();

    let intf = new MSInterface(state, dispatcher);

    return intf;
}

export default useMSInterface;
export { initialMSState, msDisplayEllipsoids, msDisplayLabels, msDisplayCScales };