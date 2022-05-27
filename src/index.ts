import { createBackend, createBackendHttp, createFrontend, createFrontendHttp } from 'frakas/api';
import { getBackend } from "./backend";
import { Frontend } from './frontend';

createBackend(api => {
    getBackend(api)
});

createFrontend(api => {
    new Frontend(api);
});
