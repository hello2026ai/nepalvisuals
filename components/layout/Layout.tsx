
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isHeaderVisible, setIsHeaderVisible] = React.useState(true);
    const location = useLocation();

    const isTripDetailsPage = location.pathname.startsWith('/trip/');
    const isAdminPage = location.pathname.startsWith('/admin');

    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child) && isTripDetailsPage) {
            return React.cloneElement(child as React.ReactElement<{ setIsHeaderVisible: (visible: boolean) => void }>, { setIsHeaderVisible });
        }
        return child;
    });

    React.useEffect(() => {
        if (!isTripDetailsPage) {
            setIsHeaderVisible(true);
        }
    }, [location.pathname, isTripDetailsPage]);
    
    React.useEffect(() => {
        document.body.classList.remove('bg-admin-background');
        document.body.classList.add('dark', 'bg-background-dark');
    }, []);


    return (
        <div className="relative flex flex-col min-h-screen w-full">
            <div className={`sticky top-0 z-[100] transition-all duration-300 pointer-events-none ${isHeaderVisible ? 'opacity-100' : 'opacity-0 -translate-y-4'}`}>
                 <Header />
            </div>
            <div id="tour-info-portal" className="absolute top-0 left-0 w-full z-20 pointer-events-none"></div>
            <div className="flex-grow">
                {isTripDetailsPage ? childrenWithProps : children}
            </div>
            {!isAdminPage && <Footer />}
        </div>
    );
};

export default Layout;