import MVSubInterface from './MVSubInterface';
import CrystVis from 'crystvis-js';

const LC = CrystVis.LEFT_CLICK;
const SLC = CrystVis.LEFT_CLICK + CrystVis.SHIFT_BUTTON;
const CLC = CrystVis.LEFT_CLICK + CrystVis.CTRL_BUTTON;

class MVSelectInterface extends MVSubInterface {

    get highlighted() {
        return this.parent.state.sel_highlight;
    }

    set highlighted(v) {
        this.parent.app.highlight_selected = v;
        this.parent.dispatch({
            type: 'set',
            key: 'sel_highlight',
            value: v
        });
    }

    // Interfaces to selected and displayed. We use these so we can have
    // callbacks when they change
    get selected() {
        return this.parent.app.selected;
    }

    set selected(v) {
        this.parent.app.selected = v;
        this.parent.onSelectChange();
    }

    get selection_mode() {
        return this.parent.state.sel_mode;
    }

    get selection_sphere_R() {
        return this.parent.state.sel_sph_r;
    }

    get selection_bond_n() {
        return this.parent.state.sel_bond_n;
    }

    get displayed() {
        return this.parent.app.displayed;
    }

    set displayed(v) {
        this.parent.app.displayed = v;
        this.parent.onDisplayChange();
    }

    set_select(mode, options={}) {

        // App
        var app = this.parent.app;
        if (!app) 
            return;


        // Set the selection callbacks for a certain mode on picking an atom
        var selFunc = null; // Selector function (defined only in some cases)
        switch(mode) {
            case 'atom':
                if (this.selection_mode === mode)
                    return;
                selFunc = ((a, e) => {
                    return app.model.view([a.img_index]); // Just the one
                });
                break;
            case 'element':
                if (this.selection_mode === mode)
                    return;
                // Selector function
                selFunc = ((a, e) => {
                    var found = app.model._queryElements(a.element);
                    return app.model.view(found);
                });
                break;
            case 'sphere':
                const r = options.r || 2.0; // Default 2 Angstroms
                if (this.selection_mode === mode && this.selection_sphere_R === r)
                    return;
                selFunc = ((a, e) => {
                    var found = app.model._querySphere(a, r); 
                    return app.model.view(found);
                });
                break;
            case 'molecule': 
                if (this.selection_mode === mode)
                    return;
                selFunc = ((a, e) => {
                    var found = app.model._queryMolecule(a);
                    return app.model.view(found);
                });
                break;
            case 'bonds':
                const n = options.n || 1;
                if (this.selection_mode === mode && this.selection_bond_n === n)
                    return;
                selFunc = ((a, e) => {
                    var found = app.model._queryBonded(a, n, false);
                    found = found.concat([a.img_index]); // Crystvis excludes the original atom
                    return app.model.view(found);
                });
                break;
            default:
                if (this.selection_mode === mode)
                    return;
                // No selection at all
                app.onAtomClick((a, e) => {}, LC);
                app.onAtomClick((a, e) => {}, SLC);
                app.onAtomClick((a, e) => {}, CLC);
                break;
        }

        // We use this to guarantee that the selection still doesn't go out of
        // the default display (e.g. the main cell). Everything else remains
        // hidden or can be used as ghost for other purposes
        var dd = this.parent.state.default_displayed;
        var intf = this;

        if (selFunc) {
            app.onAtomClick((a, e) => { intf.selected = dd.and(selFunc(a, e)); }, LC);
            app.onAtomClick((a, e) => { intf.selected = dd.and(intf.selected.or(selFunc(a, e))); }, SLC);
            app.onAtomClick((a, e) => { intf.selected = dd.and(intf.selected.xor(selFunc(a, e))); }, CLC);
        }

        this.parent.dispatch({type: 'update', data: {
            sel_mode: mode, 
            sel_sph_r: options.r || this.selection_sphere_R,
            sel_bond_n: options.n || this.selection_bond_n
        }});
    }

    set_display(mode) {

        // App
        var app = this.parent.app;
        if (!app) 
            return;

        switch (mode) {
            case 'selected':
                this.displayed = this.selected;
                break;
            default:
                // Restore original
                let m = app.model;
                if (m)
                    this.displayed = m.view(m._queryCell([0,0,0]));
                break;
        }

    }

}

export default MVSelectInterface;