import { useState } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const faqData = [
    {
        question: 'What types of rental properties do you list?',
        answer: 'We list a wide variety of rental properties including apartments, villas, independent houses, penthouses, condos, and co-living spaces. All our properties are verified by our expert team to ensure quality and authenticity.',
    },
    {
        question: 'How do I know if the rent is fair and affordable?',
        answer: 'Our platform provides detailed neighborhood insights, average rental price comparisons, and transparent pricing for every listing. We also offer free consultation with our property advisors to help you find the best rental within your budget.',
    },
    {
        question: 'Do I need to hire a real estate agent to rent?',
        answer: 'Not necessarily! Our platform is designed to connect tenants directly with verified landlords. However, we do offer optional agent assistance for those who prefer a guided experience throughout the rental process.',
    },
    {
        question: 'What is the process for renting a property?',
        answer: 'It\'s simple: Browse listings → Schedule a visit (in-person or virtual) → Review documents → Sign the digital rental agreement → Move in! Our platform streamlines the entire process with secure payments and digital documentation.',
    },
    {
        question: 'Can I tour a rental property before committing?',
        answer: 'Absolutely! We offer both in-person property visits and immersive 360° virtual tours. You can schedule a visit directly through our platform at a time that works best for you.',
    },
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(0);
    const [ref, isVisible] = useScrollAnimation(0.1);

    return (
        <section id="faq" ref={ref} className="py-20 lg:py-28 bg-white section-padding">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Left Column */}
                    <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                        <span className="inline-block text-primary-600 font-semibold text-sm uppercase tracking-widest mb-4 bg-primary-50 px-4 py-1.5 rounded-full">
                            FAQ
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 mb-6 leading-tight">
                            Frequently asked{' '}
                            <span className="gradient-text">questions</span>
                        </h2>
                        <p className="text-dark-500 text-lg leading-relaxed mb-8">
                            Everything you need to know about finding and renting your perfect property.
                            Can't find the answer you're looking for? Reach out to our support team.
                        </p>
                        <button className="btn-primary">
                            Contact Support
                            <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </button>
                    </div>

                    {/* Right Column - Accordion */}
                    <div className={`space-y-3 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                        {faqData.map((faq, index) => (
                            <div
                                key={index}
                                className={`border-2 rounded-2xl transition-all duration-300 overflow-hidden ${openIndex === index
                                    ? 'border-primary-200 bg-primary-50/50 shadow-lg shadow-primary-100/50'
                                    : 'border-dark-100 hover:border-dark-200 bg-white'
                                    }`}
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                    className="w-full flex items-center justify-between p-5 text-left"
                                    id={`faq-btn-${index}`}
                                >
                                    <span className={`font-semibold pr-4 transition-colors ${openIndex === index ? 'text-primary-700' : 'text-dark-800'
                                        }`}>
                                        {faq.question}
                                    </span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${openIndex === index
                                        ? 'bg-primary-600 text-white rotate-180'
                                        : 'bg-dark-100 text-dark-500'
                                        }`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>
                                <div
                                    className={`transition-all duration-300 ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <p className="px-5 pb-5 text-dark-500 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
