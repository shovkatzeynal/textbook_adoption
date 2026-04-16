const { spawn } = require("child_process");

const commands = [
  { name: "backend", cmd: "node", args: ["backend/server.js"] },
  { name: "frontend", cmd: "npm", args: ["start"] },
];

const children = [];
let shuttingDown = false;

const shutdown = (exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach((child) => {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  });
  setTimeout(() => process.exit(exitCode), 100);
};

const startCommand = ({ name, cmd, args }) => {
  console.log(`Starting ${name}...`);
  const child = spawn(cmd, args, { stdio: "inherit", shell: true });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`${name} terminated by ${signal}`);
    } else {
      console.log(`${name} exited with code ${code}`);
    }
    shutdown(code || 0);
  });

  child.on("error", (error) => {
    console.error(`${name} failed to start:`, error);
    shutdown(1);
  });

  children.push(child);
};

["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) =>
  process.on(signal, () => {
    console.log(`Received ${signal}, stopping processes...`);
    shutdown(0);
  })
);

commands.forEach(startCommand);
