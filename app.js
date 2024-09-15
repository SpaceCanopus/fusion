// 1. Setup Scene, Camera, Renderer
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);  // Black background

let camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 45;  // Keep the camera looking at the 2D plane

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create raycaster and mouse vector for detecting clicks
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let interactiveObjects = []; 

// 2. Create Protons (Red Spheres) with Random Positions and Velocities, restricted to 2D
let particles = [];
let flyingParticles = [];  // List to track positrons and neutrinos
let protonRadius = 1;
let deuteriumRadius = 2 * protonRadius;  // Bounding radius for deuterium
let helium3Radius = 3 * protonRadius;    // Bounding radius for helium-3 (two protons and one neutron)
let helium4Radius = 4 * protonRadius;    // Bounding radius for helium-4 (two protons and two neutrons)

for (let i = 0; i < 40; i++) {
    let proton = createProton();
    proton.position.set(Math.random() * 40 - 20, Math.random() * 40 - 20, 0);  // Random position, constrain Z to 0 for 2D
    proton.velocity = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, 0);  // Random velocity, no Z-axis movement
    proton.isDeuterium = false;  // Mark as proton (not deuterium)
    proton.isHelium3 = false;  // Mark as not helium-3
    proton.isHelium4 = false;  // Mark as not helium-4
    scene.add(proton);
    particles.push(proton);
}

// 3. Proton Creation Function
function createProton(position = null, velocity = null) {
    let geometry = new THREE.SphereGeometry(protonRadius, 32, 32);
    let material = new THREE.MeshBasicMaterial({ color: 0xff0000 });  // Red color for protons
    let proton = new THREE.Mesh(geometry, material);

    // Set the position and velocity of the proton if provided
    if (position) proton.position.copy(position);
    else proton.position.set(Math.random() * 40 - 20, Math.random() * 40 - 20, 0);  // Random position
    
    proton.velocity = velocity || new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, 0);  // Random velocity

    scene.add(proton);
    return proton;
}

// Create the "Reset" button with text on it
function createResetButton() {
    // Create a canvas element for the button text
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;

    // Draw the text "Reset" on the canvas
    context.fillStyle = '#00ff00';
    context.fillRect(0, 0, canvas.width, canvas.height); // Green background
    context.font = '40px Arial';
    context.fillStyle = '#000000';
    context.fillText('Reset', 75, 80);  // Position text in the center

    // Create a texture from the canvas
    let texture = new THREE.CanvasTexture(canvas);

    // Create a plane geometry for the button and apply the texture
    let buttonGeometry = new THREE.PlaneGeometry(8, 3);  // Button size
    let buttonMaterial = new THREE.MeshBasicMaterial({ map: texture });  // Use the texture with text
    let resetButton = new THREE.Mesh(buttonGeometry, buttonMaterial);

    resetButton.position.set(0, -20, 0);  // Position button near bottom of screen
    scene.add(resetButton);
    interactiveObjects.push(resetButton);  // Add button to interactive objects list for raycasting
    return resetButton;
}

// Create the reset button
let resetButton = createResetButton();

// 5. Handle Mouse Click Events
window.addEventListener('click', (event) => {
    // Convert mouse coordinates to normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast to check for intersections with interactive objects (the reset button)
    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects(interactiveObjects);

    // If the reset button is clicked, reset the simulation
    if (intersects.length > 0 && intersects[0].object === resetButton) {
        resetSimulation();
    }
});

// 6. Reset function to restart the simulation
function resetSimulation() {
    // Remove all particles and flying particles from the scene
    particles.forEach(particle => {
        scene.remove(particle);
    });
    flyingParticles.forEach(particle => {
        scene.remove(particle);
    });

    // Clear the particles array
    particles = [];
    flyingParticles = [];

    // Recreate the protons with random positions and velocities
    for (let i = 0; i < 40; i++) {
        let proton = createProton();
        proton.position.set(Math.random() * 40 - 20, Math.random() * 40 - 20, 0);
        proton.velocity = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, 0);
        proton.isDeuterium = false;
        proton.isHelium3 = false;
        proton.isHelium4 = false;
        scene.add(proton);
        particles.push(proton);
    }
}

// 4. Create Positron (Blue Sphere) and Neutrino (Green Sphere) when Deuterium or Helium-3 is Formed
function createFlyingParticle(color, position) {
    let geometry = new THREE.SphereGeometry(0.5, 16, 16);
    let material = new THREE.MeshBasicMaterial({ color: color });  // Blue for positron, Green for neutrino
    let particle = new THREE.Mesh(geometry, material);
    
    // Set random direction and reduce speed (slowing down particles)
    particle.velocity = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, 0).normalize().multiplyScalar(0.3); // Slower speed
    
    particle.position.copy(position);
    scene.add(particle);

    return particle;
}


// 5. Deuterium Creation Function (White Neutron and Red Proton next to each other)
function createDeuterium(position) {
    let group = new THREE.Group();

    // Create proton (red sphere)
    let protonGeometry = new THREE.SphereGeometry(protonRadius, 32, 32);
    let protonMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });  // Red for proton
    let proton = new THREE.Mesh(protonGeometry, protonMaterial);
    proton.position.set(-protonRadius, 0, 0);  // Position proton slightly to the left

    // Create neutron (white sphere)
    let neutronMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });  // White for neutron
    let neutron = new THREE.Mesh(protonGeometry, neutronMaterial);
    neutron.position.set(protonRadius, 0, 0);  // Position neutron slightly to the right

    // Add both proton and neutron to the group (deuterium)
    group.add(proton);
    group.add(neutron);

    // Set the position of the group
    group.position.copy(position);

    // Add the deuterium to the scene
    scene.add(group);

    // Set velocity for deuterium group
    group.velocity = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, 0);
    group.isDeuterium = true;  // Mark as deuterium
    group.isHelium3 = false;   // Mark as not helium-3
    group.isHelium4 = false;   // Mark as not helium-4

    return group;
}

// 6. Helium-3 Creation Function (Two Red Protons and One White Neutron)
function createHelium3(position) {
    let group = new THREE.Group();

    // Create first proton (red sphere)
    let protonGeometry = new THREE.SphereGeometry(protonRadius, 32, 32);
    let protonMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });  // Red for proton
    let proton1 = new THREE.Mesh(protonGeometry, protonMaterial);
    proton1.position.set(-protonRadius, 0, 0);  // Position proton slightly to the left

    // Create second proton (red sphere)
    let proton2 = new THREE.Mesh(protonGeometry, protonMaterial);
    proton2.position.set(protonRadius, 0, 0);  // Position to the right of the first proton

    // Create neutron (white sphere)
    let neutronMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });  // White for neutron
    let neutron = new THREE.Mesh(protonGeometry, neutronMaterial);
    neutron.position.set(0, protonRadius, 0);  // Position above the two protons

    // Add protons and neutron to the group (helium-3)
    group.add(proton1);
    group.add(proton2);
    group.add(neutron);

    // Set the position of the group
    group.position.copy(position);

    // Add the helium-3 to the scene
    scene.add(group);

    // Set velocity for helium-3 group
    group.velocity = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, 0);
    group.isDeuterium = false;  // Mark as not deuterium
    group.isHelium3 = true;     // Mark as helium-3
    group.isHelium4 = false;    // Mark as not helium-4

    return group;
}

// 7. Helium-4 Creation Function (Two Red Protons and Two White Neutrons)
function createHelium4(position) {
    let group = new THREE.Group();

    // Create first proton (red sphere)
    let protonGeometry = new THREE.SphereGeometry(protonRadius, 32, 32);
    let protonMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });  // Red for proton
    let proton1 = new THREE.Mesh(protonGeometry, protonMaterial);
    proton1.position.set(-protonRadius, 0, 0);  // Position proton slightly to the left

    // Create second proton (red sphere)
    let proton2 = new THREE.Mesh(protonGeometry, protonMaterial);
    proton2.position.set(protonRadius, 0, 0);  // Position to the right of the first proton

    // Create first neutron (white sphere)
    let neutronMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });  // White for neutron
    let neutron1 = new THREE.Mesh(protonGeometry, neutronMaterial);
    neutron1.position.set(0, protonRadius, 0);  // Position above the two protons

    // Create second neutron (white sphere)
    let neutron2 = new THREE.Mesh(protonGeometry, neutronMaterial);
    neutron2.position.set(0, -protonRadius, 0);  // Position below the two protons

    // Add protons and neutrons to the group (helium-4)
    group.add(proton1);
    group.add(proton2);
    group.add(neutron1);
    group.add(neutron2);

    // Set the position of the group
    group.position.copy(position);

    // Add the helium-4 to the scene
    scene.add(group);

    // Set velocity for helium-4 group
    group.velocity = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, 0);
    group.isDeuterium = false;  // Mark as not deuterium
    group.isHelium3 = false;    // Mark as not helium-3
    group.isHelium4 = true;     // Mark as helium-4

    return group;
}

// 8. Handle Elastic Collision using Physics (For Protons, Deuterium, Helium-3, and Helium-4)
// 8. Handle Elastic Collision using Physics (For Protons, Deuterium, Helium-3, and Helium-4)
function handleCollision(particle1, particle2) {
    let dx = particle2.position.x - particle1.position.x;
    let dy = particle2.position.y - particle1.position.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    let combinedRadius = (particle1.isHelium4 ? helium4Radius : particle1.isHelium3 ? helium3Radius : particle1.isDeuterium ? deuteriumRadius : protonRadius) +
                         (particle2.isHelium4 ? helium4Radius : particle2.isHelium3 ? helium3Radius : particle2.isDeuterium ? deuteriumRadius : protonRadius);

    // Debugging: Log distance and combined radius
    //console.log(`Handling collision: distance=${distance}, combinedRadius=${combinedRadius}`);

    // Ensure that particles are not already overlapping
    if (distance < combinedRadius) {
        //console.log(`Collision detected! Separating particles...`);

        // Normalized direction of collision
        let normal = new THREE.Vector3(dx / distance, dy / distance, 0);

        // Tangent vector, perpendicular to normal
        let tangent = new THREE.Vector3(-normal.y, normal.x, 0);

        // Project velocities onto the normal and tangent vectors
        let dpTan1 = particle1.velocity.dot(tangent);
        let dpTan2 = particle2.velocity.dot(tangent);
        let dpNorm1 = particle1.velocity.dot(normal);
        let dpNorm2 = particle2.velocity.dot(normal);

        // Elastic collision formula along the normal vector
        let newDpNorm1 = dpNorm2;
        let newDpNorm2 = dpNorm1;

        // Update velocities using the new normal components and the original tangential components
        particle1.velocity.x = tangent.x * dpTan1 + normal.x * newDpNorm1;
        particle1.velocity.y = tangent.y * dpTan1 + normal.y * newDpNorm1;
        particle2.velocity.x = tangent.x * dpTan2 + normal.x * newDpNorm2;
        particle2.velocity.y = tangent.y * dpTan2 + normal.y * newDpNorm2;

        // Forcefully separate the particles to avoid sticking
        let overlap = combinedRadius - distance;
        if (overlap > 0) {
            let correction = normal.clone().multiplyScalar(overlap);
            particle1.position.sub(correction);  // Move particle1 backward aggressively
            particle2.position.add(correction);  // Move particle2 forward aggressively
        }
    }
}


// 9. Check for Proton-Proton, Proton-Deuterium, Proton-Helium3, Helium3-Helium3, Helium4 Collisions
// Define a buffer radius for helium-4 interactions
let helium4InteractionRadius = helium4Radius * 1.5;  // Increase helium-4's interaction radius by 50%

// 9. Check for Proton-Proton, Proton-Deuterium, Proton-Helium3, Helium3-Helium3, Helium4 Collisions
function checkCollisions() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            let particle1 = particles[i];
            let particle2 = particles[j];

            // Adjust helium-4's radius for collisions to create a buffer
            let radius1 = particle1.isHelium4 ? helium4InteractionRadius : particle1.isHelium3 ? helium3Radius : particle1.isDeuterium ? deuteriumRadius : protonRadius;
            let radius2 = particle2.isHelium4 ? helium4InteractionRadius : particle2.isHelium3 ? helium3Radius : particle2.isDeuterium ? deuteriumRadius : protonRadius;

            let combinedRadius = radius1 + radius2;

            // Calculate the distance between the particles
            let distance = particle1.position.distanceTo(particle2.position);

            if (distance < combinedRadius) {
                let angle = particle1.velocity.angleTo(particle2.velocity) * (180 / Math.PI);  // Convert to degrees

                // Proton-proton collision logic
                if (angle < 20 && !particle1.isDeuterium && !particle1.isHelium3 && !particle1.isHelium4 && !particle2.isDeuterium && !particle2.isHelium3 && !particle2.isHelium4) {
                    console.log("Proton-proton collision detected");
                    let deuterium = createDeuterium(particle1.position);

                    // Create positron (blue) and neutrino (green) that fly off
                    let positron = createFlyingParticle(0x0000ff, particle1.position);  // Blue for positron
                    let neutrino = createFlyingParticle(0x00ff00, particle1.position);  // Green for neutrino

                    flyingParticles.push(positron);
                    flyingParticles.push(neutrino);

                    // Remove the two protons
                    scene.remove(particle1);
                    scene.remove(particle2);
                    particles.splice(j, 1);  // Remove the second proton
                    particles.splice(i, 1);  // Remove the first proton
                    particles.push(deuterium);  // Add deuterium as a new particle

                    return;  // Exit the loop after handling the collision
                } 
                // Proton-deuterium collision logic
                else if ((particle1.isDeuterium && !particle2.isDeuterium && !particle2.isHelium3 && !particle2.isHelium4) || (!particle1.isDeuterium && !particle1.isHelium3 && !particle1.isHelium4 && particle2.isDeuterium)) {
                    console.log("Proton-deuterium collision detected");
                    let helium3 = createHelium3(particle1.position);

                    // Create a neutrino (green) when helium-3 is formed
                    let neutrino = createFlyingParticle(0x00ff00, particle1.position);  // Green for neutrino
                    flyingParticles.push(neutrino);

                    // Remove the proton and deuterium
                    scene.remove(particle1);
                    scene.remove(particle2);
                    particles.splice(j, 1);  // Remove the second particle
                    particles.splice(i, 1);  // Remove the first particle
                    particles.push(helium3);  // Add helium-3 as a new particle

                    return;  // Exit the loop after handling the collision
                } 
                // Helium3-helium3 collision logic
                else if (particle1.isHelium3 && particle2.isHelium3) {
                    console.log("Helium-3 collision detected");
                    let helium4 = createHelium4(particle1.position);

                    // Create two protons that fly off in different directions
                    let proton1 = createProton(particle1.position.clone(), new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, 0).normalize().multiplyScalar(2));
                    let proton2 = createProton(particle2.position.clone(), new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, 0).normalize().multiplyScalar(2));

                    // Add the two protons to the main particle list so they behave like normal protons
                    particles.push(proton1);
                    particles.push(proton2);

                    // Remove the two helium-3 particles
                    scene.remove(particle1);
                    scene.remove(particle2);
                    particles.splice(j, 1);  // Remove the second helium-3
                    particles.splice(i, 1);  // Remove the first helium-3
                    particles.push(helium4);  // Add helium-4 as a new particle

                    return;  // Exit the loop after handling the collision
                } 
                // Deuterium-helium-4 elastic collision
                else if ((particle1.isDeuterium && particle2.isHelium4) || (particle1.isHelium4 && particle2.isDeuterium)) {
                    console.log("Deuterium-helium-4 elastic collision detected");
                    // Deuterium and Helium-4 collisions should be purely elastic
                    handleCollision(particle1, particle2);
                } 
                // Helium-4 elastic collisions
                else if (particle1.isHelium4 || particle2.isHelium4) {
                    console.log("Helium-4 elastic collision detected");
                    // Helium-4 collisions are purely elastic (including with helium-3, deuterium, and protons)
                    handleCollision(particle1, particle2);
                } 
                // Helium3 or deuterium elastic collisions
                else if ((particle1.isHelium3 || particle2.isHelium3) || (particle1.isDeuterium && particle2.isDeuterium)) {
                    console.log("Helium-3 or deuterium elastic collision detected");
                    // Helium3 or deuterium collisions -> Elastic only
                    handleCollision(particle1, particle2);
                }
            }
        }
    }

    // Handle wall bouncing for protons, deuterium, helium-3, and helium-4
    particles.forEach(particle => {
        let particleRadius = particle.isHelium4 ? helium4InteractionRadius : particle.isHelium3 ? helium3Radius : particle.isDeuterium ? deuteriumRadius : protonRadius;
        if (particle.position.x > 20 - particleRadius || particle.position.x < -20 + particleRadius) {
            particle.velocity.x *= -1;  // Reverse X velocity when hitting the left/right walls
        }
        if (particle.position.y > 20 - particleRadius || particle.position.y < -20 + particleRadius) {
            particle.velocity.y *= -1;  // Reverse Y velocity when hitting the top/bottom walls
        }
    });

    // Update positrons, neutrinos, and flying protons that fly off the screen
    flyingParticles.forEach((particle, index) => {
        particle.position.add(particle.velocity);

        // Remove the positron or neutrino when it flies off the screen
        if (Math.abs(particle.position.x) > 50 || Math.abs(particle.position.y) > 50) {
            scene.remove(particle);
            flyingParticles.splice(index, 1);  // Remove it from the list
        }
    });
}

// 10. Animate Protons, Deuterium, Helium-3, Helium-4, and Flying Particles
function animate() {
    requestAnimationFrame(animate);

    let speedFactor = 0.1;  // Adjust this to slow down or speed up the simulation

    // Update Proton, Deuterium, Helium-3, and Helium-4 Positions (only in 2D)
    particles.forEach(particle => {
        if (particle.velocity) {  // Only update if the particle has velocity
            // Slow down the movement by multiplying velocity by the speed factor
            particle.position.add(particle.velocity.clone().multiplyScalar(speedFactor));
        }

        let particleRadius = particle.isHelium4 ? helium4InteractionRadius : particle.isHelium3 ? helium3Radius : particle.isDeuterium ? deuteriumRadius : protonRadius;

        // Handle bouncing for rectangular boundary (left, right, top, bottom walls)
        if (particle.position.x + particleRadius > 20) {
            particle.velocity.x *= -1;  // Reverse X velocity when hitting the right wall
            particle.position.x = 20 - particleRadius;  // Adjust position to prevent sticking
        }
        if (particle.position.x - particleRadius < -20) {
            particle.velocity.x *= -1;  // Reverse X velocity when hitting the left wall
            particle.position.x = -20 + particleRadius;  // Adjust position to prevent sticking
        }
        if (particle.position.y + particleRadius > 20) {
            particle.velocity.y *= -1;  // Reverse Y velocity when hitting the top wall
            particle.position.y = 20 - particleRadius;  // Adjust position to prevent sticking
        }
        if (particle.position.y - particleRadius < -20) {
            particle.velocity.y *= -1;  // Reverse Y velocity when hitting the bottom wall
            particle.position.y = -20 + particleRadius;  // Adjust position to prevent sticking
        }
    });

    checkCollisions();  // Check for collisions and wall bouncing

    renderer.render(scene, camera);
}

animate();
