import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';

const BackButtonHandler = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        let backButtonListener: any;

        const setupBackButton = async () => {
            backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
                if (location.pathname === '/' || location.pathname === '/auth') {
                    App.exitApp();
                } else {
                    // If we can go back in the browser history, do so
                    // Otherwise, maybe we should just go home or exit? 
                    // For now, let's just go back one step in history
                    navigate(-1);
                }
            });
        };

        setupBackButton();

        return () => {
            if (backButtonListener) {
                backButtonListener.remove();
            }
        };
    }, [location, navigate]);

    return null;
};

export default BackButtonHandler;
