// Events used to trigger listeners
import { Enum } from '../../../utils';

const Events = new Enum([
    'VIEWS',
    'SEL_LABELS',
    'CSCALE',
    'MS_ELLIPSOIDS',
    'MS_LABELS',
    'EFG_ELLIPSOIDS',
    'EFG_LABELS',
    'DIP_LINKS',                // Links require two events, one before a VIEWS update, the other after
    'DIP_RENDER'
]);

export default Events;