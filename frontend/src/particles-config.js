const particlesConfig = {
  background: {
    color: {
      value: "#010409", // Deep space black
    },
  },
  fpsLimit: 120,
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "repulse",
      },
      resize: true,
    },
    modes: {
      repulse: {
        distance: 80,
        duration: 0.4,
      },
    },
  },
  particles: {
    color: {
      value: "#ffffff",
    },
    links: {
      color: "#ffffff",
      distance: 150,
      enable: false, // Set to false for a starfield look
      opacity: 0.5,
      width: 1,
    },
    collisions: {
      enable: false,
    },
    move: {
      direction: "none",
      enable: true,
      outModes: {
        default: "out",
      },
      random: true,
      speed: 0.1, // Very slow drift
      straight: false,
    },
    number: {
      density: {
        enable: true,
        area: 800,
      },
      value: 120, // Number of stars
    },
    opacity: {
      value: { min: 0.1, max: 0.7 },
      animation: {
        enable: true,
        speed: 1,
        sync: false,
      },
    },
    shape: {
      type: "circle",
    },
    size: {
      value: { min: 1, max: 3 },
      animation: {
        enable: true,
        speed: 2,
        sync: false,
      },
    },
  },
  detectRetina: true,
};

export default particlesConfig;