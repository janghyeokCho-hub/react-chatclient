import { managesvr } from '@/lib/api';

function _loginRequest_browser(method, path, params) {
    return managesvr(method, path, params);
}

export {
    _loginRequest_browser as _loginRequest
}