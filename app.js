window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.createElement('canvas');
  canvas.id = 'renderCanvas';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  document.getElementById('scene-container').appendChild(canvas);

  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0.9, 0.95, 1);

  const camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2.2, Math.PI / 2.5, 150, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 300, height: 300 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.7, 0.95, 0.7);
  ground.material = groundMat;

  const layout = {
    Marketing: { x: -40, z: 0, color: "#f44336" },
    Sales: { x: -20, z: 0, color: "#ff9800" },
    Delivery: { x: 0, z: 20, color: "#4caf50" },
    Support: { x: 20, z: 20, color: "#9e9e9e" },
    Customers: { x: 0, z: 40, color: "#2196f3" },
    Management: { x: 0, z: -30, color: "#ffeb3b" }
  };

  const departments = {};
  const bubbles = {};
  const characters = [];

  function createDept(name) {
    const config = layout[name];
    const color = BABYLON.Color3.FromHexString(config.color);
    const x = config.x, z = config.z;

    // Building
    const building = BABYLON.MeshBuilder.CreateBox(name, { width: 20, depth: 20, height: 5 }, scene);
    building.position = new BABYLON.Vector3(x, 2.5, z);
    const mat = new BABYLON.StandardMaterial(`mat_${name}`, scene);
    mat.diffuseColor = color;
    mat.alpha = 0.5;
    building.material = mat;

    // Speech Bubble
    const plane = BABYLON.MeshBuilder.CreatePlane(`bubble_${name}`, { width: 10, height: 2 }, scene);
    plane.position = new BABYLON.Vector3(x, 7, z);
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane);
    const label = new BABYLON.GUI.TextBlock();
    label.text = "0 people • Score 0";
    label.color = "black";
    label.fontSize = 18;
    gui.addControl(label);
    bubbles[name] = label;

    departments[name] = {
      name, color, x, z, score: 0, people: []
    };
  }

  Object.keys(layout).forEach(createDept);

  function addPerson(deptName) {
    const dept = departments[deptName];
    const person = BABYLON.MeshBuilder.CreateCylinder(`char_${Date.now()}`, {
      height: 1.2, diameter: 0.8, tessellation: 8
    }, scene);
    person.position = new BABYLON.Vector3(
      dept.x + Math.random() * 10 - 5,
      0.6,
      dept.z + Math.random() * 10 - 5
    );
    const mat = new BABYLON.StandardMaterial(`mat_${person.name}`, scene);
    mat.diffuseColor = dept.color.scale(0.9);
    person.material = mat;
    dept.people.push(person);
    dept.score += 10;
    characters.push({ mesh: person, department: deptName });
    updateBubble(deptName);
  }

  function updateBubble(deptName) {
    const dept = departments[deptName];
    if (bubbles[deptName]) {
      bubbles[deptName].text = `${dept.people.length} people • Score ${dept.score}`;
    }
  }

  function animateCharacterWalk(character, from, to) {
    const start = layout[from];
    const end = layout[to];
    if (!start || !end || !character || !character.mesh) return;

    const animX = new BABYLON.Animation("animX", "position.x", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    const animZ = new BABYLON.Animation("animZ", "position.z", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    const duration = 60;

    animX.setKeys([{ frame: 0, value: character.mesh.position.x }, { frame: duration, value: end.x }]);
    animZ.setKeys([{ frame: 0, value: character.mesh.position.z }, { frame: duration, value: end.z }]);

    character.mesh.animations = [animX, animZ];
    scene.beginAnimation(character.mesh, 0, duration, false);
  }

  // Button handlers
  document.getElementById("hire-btn").onclick = () => addPerson("Sales");
  document.getElementById("budget-btn").onclick = () => {
    departments["Marketing"].score += 20;
    updateBubble("Marketing");
  };
  document.getElementById("optimize-btn").onclick = () => {
    departments["Delivery"].score += 30;
    updateBubble("Delivery");
  };

  setInterval(() => {
    if (characters.length === 0) return;
    const c = characters[Math.floor(Math.random() * characters.length)];
    const deptKeys = Object.keys(layout).filter(dep => dep !== c.department);
    const newDept = deptKeys[Math.floor(Math.random() * deptKeys.length)];
    animateCharacterWalk(c, c.department, newDept);
    c.department = newDept;
  }, 8000);

  // Init scene
  addPerson("Sales");
  addPerson("Marketing");
  addPerson("Delivery");
  addPerson("Management");

  scene.onBeforeRenderObservable.add(() => {
    document.getElementById("fps").textContent = Math.round(engine.getFps());
    document.getElementById("current-date").textContent = new Date().toLocaleDateString();
  });

  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());
  document.getElementById("loading-screen").style.display = "none";
});
