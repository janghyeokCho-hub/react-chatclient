export function clearUserData() {
    if (!localStorage) {
        return;
    }
    localStorage.removeItem('covi_user_access_token');
    localStorage.removeItem('covi_user_access_id');
}

export function clearZoomData() {
    localStorage.removeItem('covi_user_access_zoom_user');
    localStorage.removeItem('covi_user_access_zoom_token');
    localStorage.removeItem('covi_user_access_zoom_refresh');
}