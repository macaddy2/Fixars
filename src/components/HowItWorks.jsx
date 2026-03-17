import { Search, UserPlus, Rocket, Trophy } from 'lucide-react'

const STEPS = [
    {
        icon: Search,
        title: 'Discover',
        description: 'Explore interconnected apps that match your goals—invest, collaborate, validate, or find talent.',
        color: 'bg-accent'
    },
    {
        icon: UserPlus,
        title: 'Connect',
        description: 'Single sign-on across all Fixars apps. Your profile, points, and data flow seamlessly.',
        color: 'bg-primary'
    },
    {
        icon: Rocket,
        title: 'Create',
        description: 'Launch ideas on ConceptNexus, build on Collaboard, staff from SkillsCanvas, fund on VestDen.',
        color: 'bg-collaboard'
    },
    {
        icon: Trophy,
        title: 'Earn',
        description: 'Every action earns points. Level up, unlock features, and build your reputation across the ecosystem.',
        color: 'bg-warning'
    }
]

export default function HowItWorks() {
    return (
        <section className="py-16 bg-muted/5" id="how">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-foreground mb-4">How it Works</h2>
                    <p className="text-muted max-w-2xl mx-auto">
                        Fixars connects your journey from idea to execution with an ecosystem designed for doers.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {STEPS.map((step, index) => (
                        <div
                            key={step.title}
                            className="relative bg-card rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Step number */}
                            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-foreground text-card flex items-center justify-center font-bold text-sm shadow-md">
                                {index + 1}
                            </div>

                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center mb-4`}>
                                <step.icon className="w-7 h-7 text-white" />
                            </div>

                            {/* Content */}
                            <h3 className="font-bold text-lg text-foreground mb-2">{step.title}</h3>
                            <p className="text-sm text-muted">{step.description}</p>

                            {/* Connector line (except last) */}
                            {index < STEPS.length - 1 && (
                                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 border-t-2 border-dashed border-muted/30" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
