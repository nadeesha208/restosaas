import React from 'react';
import type { User } from '../types';

interface HeaderProps {
    title: string;
    showBackButton?: boolean;
    onBack?: () => void;
    rightContent?: React.ReactNode;
}

const BackIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const Header: React.FC<HeaderProps> = ({ title, showBackButton = false, onBack, rightContent }) => {

    return (
        <header className="bg-white shadow-md sticky top-0 z-40">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                    {showBackButton && onBack && (
                        <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900">
                            <BackIcon />
                        </button>
                    )}
                    <h1 className="text-xl font-bold text-gray-800">{title}</h1>
                </div>
                <div className="flex items-center gap-4">
                    {rightContent}
                </div>
            </div>
        </header>
    );
};

export default Header;