// Redirect Page Component
const RedirectPage = () => {
    const [countdown, setCountdown] = React.useState(5);
    const [redirecting, setRedirecting] = React.useState(false);

    React.useEffect(() => {
        // Start countdown
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    setRedirecting(true);
                    clearInterval(timer);
                    // Redirect to Spotify
                    window.location.href = 'https://open.spotify.com/artist/2Zkj0a4p1ENEdQEUXCs8Ib?si=7lTmHAEKRXyHV9mcnqK04w';
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="redirect-container">
            <div className="spinner-container">
                <div className="spinner"></div>
                <h1 className="display-1 fade-in">MOON RACCOON</h1>
                <p className="lead fade-in">Redirecting to Spotify...</p>
                <div className="countdown fade-in">
                    {redirecting ? 'Redirecting now...' : `Redirecting in ${countdown} seconds`}
                </div>
                <div className="mt-4 fade-in">
                    <a 
                        href="https://open.spotify.com/artist/2Zkj0a4p1ENEdQEUXCs8Ib?si=7lTmHAEKRXyHV9mcnqK04w" 
                        className="btn btn-outline-light"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <i className="fab fa-spotify me-2"></i>Go to Spotify Now
                    </a>
                </div>
            </div>
        </div>
    );
};

// Main App Component
const App = () => (
    <React.Fragment>
        <RedirectPage />
    </React.Fragment>
);

// Render the app
ReactDOM.render(<App />, document.getElementById('root')); 