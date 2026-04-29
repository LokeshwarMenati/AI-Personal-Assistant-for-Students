(function () {
    const CURRENT_USER_KEY = 'user';
    const statusText = document.getElementById('oauthStatusText');
    const backLink = document.getElementById('oauthBackLink');

    function setStatus(message, isError = false) {
        if (statusText) {
            statusText.textContent = message;
            statusText.classList.toggle('text-danger', isError);
        }
        if (backLink) {
            backLink.classList.toggle('hidden', !isError);
        }
    }

    function getHashParams() {
        return new URLSearchParams(window.location.hash.replace(/^#/, ''));
    }

    function getQueryParams() {
        return new URLSearchParams(window.location.search);
    }

    try {
        const hashParams = getHashParams();
        const queryParams = getQueryParams();
        const error = queryParams.get('error') || hashParams.get('error');
        if (error) {
            setStatus(decodeURIComponent(error), true);
            return;
        }
        const token = hashParams.get('token');
        const userPayload = hashParams.get('user');

        if (token && userPayload) {
            const user = JSON.parse(userPayload);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            localStorage.setItem('authToken', token);
            localStorage.setItem('session', 'persistent');
            setStatus('Login complete. Redirecting...');
            window.location.replace('/dashboard.html');
            return;
        }

        // Token not present in fragment. This may indicate the server set an
        // HttpOnly cookie for the JWT (recommended in production). Attempt to
        // confirm the session by calling the profile endpoint and then
        // redirect to the dashboard if authenticated.
        try {
            const resp = await fetch('/api/auth/profile', { credentials: 'include' });
            if (resp.ok) {
                setStatus('Login complete. Redirecting...');
                window.location.replace('/dashboard.html');
                return;
            }
        } catch (err) {
            // ignore and show error below
        }

        setStatus('Google login did not return a valid session.', true);
    } catch (error) {
        setStatus(error.message || 'Unable to complete Google login.', true);
    }
})();
