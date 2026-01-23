import { usePoints } from '@/contexts/PointsContext'
import { Star, Award } from 'lucide-react'

export default function RewardToast() {
    const { showReward, showBadge } = usePoints()

    if (!showReward && !showBadge) return null

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in-up">
            {showReward && (
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-warning/90 to-warning text-white shadow-xl">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Star className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                        <p className="font-bold text-lg">+{showReward.points} Points</p>
                        <p className="text-sm text-white/80">{showReward.label}</p>
                    </div>
                </div>
            )}

            {showBadge && (
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-primary/90 to-primary text-white shadow-xl">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                        {showBadge.icon}
                    </div>
                    <div>
                        <p className="font-bold text-lg flex items-center gap-2">
                            <Award className="w-4 h-4" /> Badge Unlocked!
                        </p>
                        <p className="text-sm text-white/80">{showBadge.name}: {showBadge.description}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
