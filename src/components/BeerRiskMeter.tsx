import React from 'react';
import { motion } from 'framer-motion';

interface BeerRiskMeterProps {
    count: number;
}

export const BeerRiskMeter: React.FC<BeerRiskMeterProps> = ({ count }) => {
    // Determine zone
    let zoneColor = 'bg-green-500';
    let zoneLabel = 'All good';
    let textColor = 'text-green-600 dark:text-green-400';

    if (count >= 4 && count < 8) {
        zoneColor = 'bg-orange-500';
        zoneLabel = 'Careful';
        textColor = 'text-orange-600 dark:text-orange-400';
    } else if (count >= 8) {
        zoneColor = 'bg-red-600';
        zoneLabel = 'Red zone';
        textColor = 'text-red-600 dark:text-red-400';
    }

    // Calculate percentage for visual bar (cap at max reasonable number like 15 for 100%)
    const maxScale = 12;
    const percentage = Math.min((count / maxScale) * 100, 100);

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between items-end">
                <span className={`text-lg font-bold ${textColor}`}>{zoneLabel}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Red starts at 8</span>
            </div>

            {/* Meter Bar Background */}
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                {/* Background markers for zones (optional, subtle) */}
                <div className="absolute top-0 bottom-0 left-[25%] w-0.5 bg-white/20 z-10" title="Green Limit (3)" />
                <div className="absolute top-0 bottom-0 left-[58%] w-0.5 bg-white/20 z-10" title="Orange Limit (7)" />

                {/* Fill Bar */}
                <motion.div
                    className={`h-full ${zoneColor} transition-colors duration-300`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                />
            </div>

            <div className="flex justify-between text-xs text-slate-400">
                <span>0</span>
                <span>4</span>
                <span>8</span>
                <span>12+</span>
            </div>
        </div>
    );
};
