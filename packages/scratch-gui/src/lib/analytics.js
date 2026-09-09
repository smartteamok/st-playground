/**
 * Analytics sink. ST-Playground does not send telemetry (D-07).
 * Callers still invoke `.event(...)`; this is a deliberate no-op.
 */
const GA4 = {
    event: () => {}
};

export default GA4;
