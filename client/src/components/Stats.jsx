import { useScrollAnimation, useCountUp } from '../hooks/useScrollAnimation';

const stats = [
    { value: 100, suffix: '%', label: 'Satisfied clients' },
    { value: 500, suffix: '+', label: 'Property Rented' },
    { value: 150, suffix: '+', label: 'Country & Cities' },
    { value: 1000, suffix: '+', label: 'Positive Reviews' },
];

export default function Stats() {
    const [ref, isVisible] = useScrollAnimation(0.3);

    return (
        <section ref={ref} className="py-16 lg:py-20 bg-white section-padding">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {stats.map((stat, index) => (
                        <StatCard
                            key={index}
                            stat={stat}
                            index={index}
                            isVisible={isVisible}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function StatCard({ stat, index, isVisible }) {
    const count = useCountUp(stat.value, 2000, isVisible);

    return (
        <div
            className={`text-center border-2 border-dark-200 rounded-2xl py-8 px-4 transition-all duration-700 hover:border-dark-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            style={{ transitionDelay: `${index * 150}ms` }}
        >
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 mb-2">
                {stat.value === 100 ? `${count}` : count.toLocaleString()}
                <span className="text-dark-900">{stat.suffix}</span>
            </div>
            <p className="text-dark-500 font-medium text-sm">
                {stat.label}
            </p>
        </div>
    );
}
