import clsx from 'clsx';

export const Card = ({ children, className, ...props }) => {
    return (
        <div
            className={clsx(
                "bg-surface/80 backdrop-blur-md border border-border rounded-lg p-4 shadow-xl transition-colors duration-300",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
