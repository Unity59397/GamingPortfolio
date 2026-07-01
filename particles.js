const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

let particles = [];
let mouse = { x: null, y: null };

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", () => {
    resize();
    createParticles();
});

resize();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;

        this.baseSize = Math.random() * 2 + 0.5;
        this.size = this.baseSize;

        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;

        this.alpha = Math.random() * 0.6 + 0.4;

        this.colors = [
            "#9c6fff",
            "#4b8fff",
            "#ff6fe9",
            "#00eaff"
        ];

        this.color = this.colors[Math.floor(Math.random() * this.colors.length)];

        this.node = Math.random() > 0.97;

        if (this.node) {
            this.size = Math.random() * 4 + 3;
            this.baseSize = this.size;
            this.orbitRadius = Math.random() * 25 + 15;
            this.orbitAngle = Math.random() * Math.PI * 2;
            this.orbitSpeed = Math.random() * 0.01 + 0.005;
            this.connections = [];
            this.pulse = 1;
        }
    }

    draw() {
        ctx.globalAlpha = this.alpha;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        if (this.node) {
            this.drawOrbiters();
            this.drawConnections();
        }

        ctx.globalAlpha = 1;
    }

    drawOrbiters() {
        const orbiters = 3;

        for (let i = 0; i < orbiters; i++) {
            const angle = this.orbitAngle + (Math.PI * 2 / orbiters) * i;

            const ox = this.x + Math.cos(angle) * this.orbitRadius;
            const oy = this.y + Math.sin(angle) * this.orbitRadius;

            ctx.beginPath();
            ctx.arc(ox, oy, 1, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    drawConnections() {
        this.connections.forEach(other => {
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 200) {
                ctx.globalAlpha = (1 - dist / 200) * 0.2;

                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(other.x, other.y);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 0.5;
                ctx.stroke();

                ctx.globalAlpha = this.alpha;
            }
        });
    }

    update() {

        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        if (this.node) {
            this.orbitAngle += this.orbitSpeed;

            this.size += this.pulse * 0.03;

            if (this.size > this.baseSize * 1.5 || this.size < this.baseSize * 0.8) {
                this.pulse *= -1;
            }
        }

        if (mouse.x !== null) {

            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 120) {
                const force = (120 - dist) / 1500;

                this.speedX += dx > 0 ? force : -force;
                this.speedY += dy > 0 ? force : -force;
            }
        }

        this.speedX *= 0.99;
        this.speedY *= 0.99;
    }
}

function createParticles() {

    particles = [];

    const count = Math.min(
        150,
        Math.floor((canvas.width * canvas.height) / 8000)
    );

    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }

    const nodes = particles.filter(p => p.node);

    nodes.forEach(node => {

        const others = nodes.filter(n => n !== node);

        const total = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < total && others.length; i++) {

            const index = Math.floor(Math.random() * others.length);

            node.connections.push(others[index]);

            others.splice(index, 1);
        }
    });
}

createParticles();

window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
});

function animate() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

animate();