const particlesConfig = {
  fpsLimit: 120,
  particles: {
    number: {
      value: 200, // More particles
      density: {
        enable: true,
        value_area: 800,
      },
    },
    color: {
      value: "#ffffff",
    },
    shape: {
      type: "circle",
    },
    opacity: {
      value: { min: 0.1, max: 0.5 },
      animation: {
        enable: true,
        speed: 0.5,
        sync: false,
      },
    },
    size: {
      value: { min: 0.5, max: 1.5 }, // Finer particles
    },
    move: {
      enable: true,
      speed: 0.2, // Even slower drift
      direction: "none",
      random: true,
      straight: false,
      out_mode: "out",
      bounce: false,
    },
  },
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "bubble", // A softer hover effect
      },
    },
    modes: {
      bubble: {
        distance: 100,
        size: 2,
        duration: 2,
        opacity: 1,
      },
    },
  },
  detectRetina: true,
};

export default particlesConfig;