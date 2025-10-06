import { Button } from "@/components/ui/button";

export default function FeaturesSection() {
    return (
        <section
            id="features"
            className="py-20 sm:py-32 bg-white dark:bg-black mx-2 sm:mx-4 mb-4 rounded-xl overflow-hidden"
        >
            <div className="max-w-6xl mx-auto px-4">
                {/* Section Header */}
                <div className="text-left space-y-4 mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-black dark:text-white">
                        Extend model capabilities with built-in{" "}
                        <span className="text-zinc-700/80 dark:text-zinc-300/80 font-semibold tracking-tighter">
                            Agents
                        </span>
                        .
                    </h2>
                    <p className="text-base sm:text-lg tracking-tight text-black/60 dark:text-white/60 max-w-2xl">
                        Seamless integration of AI agents to augment model
                        responses in just a few minutes.
                    </p>
                </div>

                {/* Row One: Image on left, content on right */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* Left: Image placeholder */}
                    <div className="relative h-full min-h-[300px] rounded-2xl bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 border border-black/5 dark:border-white/5 flex items-center justify-center">
                        <span className="text-sm text-black/40 dark:text-white/40">
                            Image Space
                        </span>
                    </div>

                    {/* Right: Content */}
                    <div className="flex flex-col justify-center space-y-6">
                        <h3 className="text-2xl sm:text-3xl font-semibold text-black dark:text-white">
                            Build useful and reliable agents
                        </h3>
                        <p className="text-base text-black/70 dark:text-white/70">
                            <span className="font-semibold ml-12">
                                The Agents SDK
                            </span>{" "}
                            is a robust and lightweight orchestration framework
                            for designing, building, and deploying agents with
                            built-in observability to track and optimize
                            performance.
                        </p>
                        <div className="pt-2">
                            <Button
                                size="sm"
                                className="h-6 group text-white dark:text-black bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90"
                            >
                                Learn more
                                <span className="ml-2 transition-transform group-hover:translate-x-1 h-1 w-1 rounded-full bg-current" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Row Two: Content on left, image on right */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    {/* Left: Content */}
                    <div className="flex flex-col space-y-6">
                        <h3 className="text-2xl sm:text-3xl font-semibold text-black dark:text-white">
                            Customize models for your needs
                        </h3>
                        <p className="text-base text-black/70 dark:text-white/70">
                            Customize a model’s existing knowledge and behavior
                            for a specific task using text and images via
                            supervised fine-tuning.
                        </p>

                        {/* Two cards side by side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 border border-black/15 dark:border-white/15 rounded-xl p-1">
                            {/* Card 1 */}
                            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:border-black/15 dark:hover:border-white/15">
                                <h4 className="text-lg font-medium text-black dark:text-white mb-2">
                                    Data Analysis
                                </h4>
                                <p className="text-sm text-black/60 dark:text-white/60">
                                    Extract insights from complex datasets with
                                    our advanced analytics tools.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:border-black/15 dark:hover:border-white/15">
                                <h4 className="text-lg font-medium text-black dark:text-white mb-2">
                                    Content Generation
                                </h4>
                                <p className="text-sm text-black/60 dark:text-white/60">
                                    Create high-quality content for marketing,
                                    documentation, and more.
                                </p>
                            </div>
                        </div>

                        {/* Additional title and subtitle below cards */}
                        <div className="flex items-center gap-2">
                            <div className="w-1/2 flex flex-col items-center gap-2">
                                <h4 className="font-semibold text-black/80 dark:text-white/80 uppercase text-4xl">
                                    100+
                                </h4>
                                <p className="text-xs text-black/60 dark:text-white/60">
                                    AI Agents created
                                </p>
                            </div>
                            <div className="w-1/2 flex flex-col items-center gap-2">
                                <h4 className="font-semibold text-black/80 dark:text-white/80 uppercase text-4xl">
                                    97%
                                </h4>
                                <p className="text-xs text-black/60 dark:text-white/60">
                                    Task completion rate
                                </p>
                            </div>

                            <div className="w-1/2 flex flex-col items-center gap-2">
                                <h4 className="font-semibold text-black/80 dark:text-white/80 uppercase text-4xl">
                                    50k+
                                </h4>
                                <p className="text-xs text-black/60 dark:text-white/60">
                                    Agents running
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Image placeholder */}
                    <div className="relative h-full min-h-[300px] rounded-2xl bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 border border-black/5 dark:border-white/5 flex items-center justify-center">
                        <span className="text-sm text-black/40 dark:text-white/40">
                            Image Space
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
