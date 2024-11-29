import { useCallback, useEffect } from "react";
import Particles from "react-tsparticles";
import { Engine } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";

export default function ParticlesBackground() {
    const particlesInit = useCallback(async (engine: Engine) => {
        await loadSlim(engine);
    }, []);

    useEffect(() => {
        return () => {
            // Cleanup particles when component unmounts
            const container = document.getElementById("tsparticles");
            if (container) {
                container.remove();
            }
        };
    }, []);

    return (
        <Particles
            id="tsparticles"
            init={particlesInit}
            options={{
                fullScreen: {
                    enable: true,
                    zIndex: -1
                },
                particles: {
                    number: {
                        value: 30,
                        density: {
                            enable: true,
                            value_area: 800
                        }
                    },
                    color: {
                        value: "#3b82f6"
                    },
                    shape: {
                        type: "circle"
                    },
                    opacity: {
                        value: 0.1,
                        random: true,
                        animation: {
                            enable: true,
                            speed: 1,
                            minimumValue: 0.1,
                            sync: false
                        }
                    },
                    size: {
                        value: 50,
                        random: true,
                        animation: {
                            enable: true,
                            speed: 4,
                            minimumValue: 0.1,
                            sync: false
                        }
                    },
                    links: {
                        enable: true,
                        distance: 150,
                        color: "#3b82f6",
                        opacity: 0.1,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 1,
                        direction: "none",
                        random: false,
                        straight: false,
                        outModes: {
                            default: "out"
                        },
                        attract: {
                            enable: true,
                            rotateX: 600,
                            rotateY: 1200
                        }
                    }
                },
                interactivity: {
                    detectsOn: "window",
                    events: {
                        onHover: {
                            enable: true,
                            mode: "grab"
                        },
                        onClick: {
                            enable: true,
                            mode: "push"
                        },
                        resize: true
                    },
                    modes: {
                        grab: {
                            distance: 140,
                            links: {
                                opacity: 0.5
                            }
                        },
                        push: {
                            quantity: 4
                        }
                    }
                },
                background: {
                    color: "transparent"
                }
            }}
        />
    );
}
