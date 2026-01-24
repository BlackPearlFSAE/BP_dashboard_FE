import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const variants = {
    primary: 'bg-primary text-black hover:bg-opacity-80 shadow-glow-primary',
    secondary: 'bg-secondary text-white hover:bg-opacity-80 shadow-glow-secondary',
    success: 'bg-success text-black hover:bg-opacity-80',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    outline: 'border border-primary text-primary hover:bg-primary hover:text-black',
    ghost: 'bg-transparent text-gray-400 hover:text-white',
};

export const Button = ({ children, variant = 'primary', className, ...props }) => {
    return (
        <button
            className={twMerge(
                'px-4 py-2 font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300 transform rounded-sm flex items-center gap-2',
                variants[variant],
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};
