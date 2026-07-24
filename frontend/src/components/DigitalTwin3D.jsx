import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const DigitalTwin3D = ({ machineData, isOnline = true, machineState = 'RUNNING' }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  // References to dynamic objects and materials
  const refs = useRef({
    leftWheel: null,
    rightWheel: null,
    rightMotor: null,
    leftLEDMaterial: null,
    rightLEDMaterial: null,
    pulseTime: 0,
    rightMotorShakeAmount: 0,
    wheelRotationSpeed: 0,
    rightMotorBasePos: { x: 2.2, y: 0, z: 0 }
  });

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null; 
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 4.0, 7.0);
    camera.lookAt(0, -0.25, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor( 0x000000, 0 ); // transparent
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 0.25);
    dirLight2.position.set(-6, 3, -5);
    scene.add(dirLight2);

    // Floor Grid
    const gridHelper = new THREE.GridHelper(10, 12, 0x6366f1, 0x94a3b8);
    gridHelper.position.y = -1.1;
    scene.add(gridHelper);

    // Materials
    const gearboxMaterial = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.1 });
    const motorMetalMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.95 });
    const wheelHubMaterial = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.1 });
    const wheelTireMaterial = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.05 });
    const beltMaterial = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9, metalness: 0.0 });
    const spokeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });

    // Glowing LEDs
    const leftLEDMaterial = new THREE.MeshStandardMaterial({ color: 0x64748b, emissive: 0x334155, emissiveIntensity: 0.2, roughness: 0.1 });
    const rightLEDMaterial = new THREE.MeshStandardMaterial({ color: 0x64748b, emissive: 0x334155, emissiveIntensity: 0.2, roughness: 0.1 });
    
    refs.current.leftLEDMaterial = leftLEDMaterial;
    refs.current.rightLEDMaterial = rightLEDMaterial;

    // LEFT DC MOTOR ASSEMBLY
    const leftGroup = new THREE.Group();
    leftGroup.position.set(-2.2, 0, 0);

    const gearboxGeom = new THREE.BoxGeometry(1.3, 0.8, 0.8);
    const leftGearbox = new THREE.Mesh(gearboxGeom, gearboxMaterial);
    leftGearbox.castShadow = true;
    leftGearbox.receiveShadow = true;
    leftGroup.add(leftGearbox);

    const motorGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.6, 16);
    const leftMotorMetal = new THREE.Mesh(motorGeom, motorMetalMaterial);
    leftMotorMetal.rotation.z = Math.PI / 2;
    leftMotorMetal.position.set(-0.6, 0, 0);
    leftMotorMetal.castShadow = true;
    leftGroup.add(leftMotorMetal);

    const shaftGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12);
    const leftShaft = new THREE.Mesh(shaftGeom, motorMetalMaterial);
    leftShaft.rotation.z = Math.PI / 2;
    leftShaft.position.set(0.8, 0, 0);
    leftGroup.add(leftShaft);

    const ledGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16);
    const leftLed = new THREE.Mesh(ledGeom, leftLEDMaterial);
    leftLed.position.set(0, 0.45, 0);
    leftGroup.add(leftLed);

    const wheelHubGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.22, 16);
    const wheelTireGeom = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 32);
    
    const leftWheelHub = new THREE.Mesh(wheelHubGeom, wheelHubMaterial);
    const leftWheelTire = new THREE.Mesh(wheelTireGeom, wheelTireMaterial);
    leftWheelTire.castShadow = true;

    const leftWheel = new THREE.Group();
    leftWheel.position.set(1.0, 0, 0);
    leftWheel.rotation.x = Math.PI / 2;
    leftWheel.add(leftWheelHub);
    leftWheel.add(leftWheelTire);

    const spokeGeom = new THREE.BoxGeometry(0.08, 0.5, 0.24);
    for (let i = 0; i < 4; i++) {
      const spoke = new THREE.Mesh(spokeGeom, spokeMat);
      const angle = (i * Math.PI) / 2;
      spoke.position.set(Math.cos(angle) * 0.2, Math.sin(angle) * 0.2, 0);
      spoke.rotation.z = angle;
      leftWheel.add(spoke);
    }
    leftGroup.add(leftWheel);
    scene.add(leftGroup);
    refs.current.leftWheel = leftWheel;

    // RIGHT DC MOTOR ASSEMBLY
    const rightGroup = new THREE.Group();
    rightGroup.position.set(2.2, 0, 0);

    const rightGearbox = new THREE.Mesh(gearboxGeom, gearboxMaterial);
    rightGearbox.castShadow = true;
    rightGearbox.receiveShadow = true;
    rightGroup.add(rightGearbox);

    const rightMotorMetal = new THREE.Mesh(motorGeom, motorMetalMaterial);
    rightMotorMetal.rotation.z = Math.PI / 2;
    rightMotorMetal.position.set(0.6, 0, 0);
    rightMotorMetal.castShadow = true;
    rightGroup.add(rightMotorMetal);

    const rightShaft = new THREE.Mesh(shaftGeom, motorMetalMaterial);
    rightShaft.rotation.z = -Math.PI / 2;
    rightShaft.position.set(-0.8, 0, 0);
    rightGroup.add(rightShaft);

    const rightLed = new THREE.Mesh(ledGeom, rightLEDMaterial);
    rightLed.position.set(0, 0.45, 0);
    rightGroup.add(rightLed);

    const rightWheelHub = new THREE.Mesh(wheelHubGeom, wheelHubMaterial);
    const rightWheelTire = new THREE.Mesh(wheelTireGeom, wheelTireMaterial);
    rightWheelTire.castShadow = true;

    const rightWheel = new THREE.Group();
    rightWheel.position.set(-1.0, 0, 0);
    rightWheel.rotation.x = Math.PI / 2;
    rightWheel.add(rightWheelHub);
    rightWheel.add(rightWheelTire);

    for (let i = 0; i < 4; i++) {
      const spoke = new THREE.Mesh(spokeGeom, spokeMat);
      const angle = (i * Math.PI) / 2;
      spoke.position.set(Math.cos(angle) * 0.2, Math.sin(angle) * 0.2, 0);
      spoke.rotation.z = angle;
      rightWheel.add(spoke);
    }
    rightGroup.add(rightWheel);
    scene.add(rightGroup);
    refs.current.rightWheel = rightWheel;
    refs.current.rightMotor = rightGroup;

    // RUBBER BELT
    const beltLen = 2.4;
    const beltGeom = new THREE.BoxGeometry(beltLen, 0.04, 0.16);

    const topBelt = new THREE.Mesh(beltGeom, beltMaterial);
    topBelt.position.set(0, 0.7, 0);
    scene.add(topBelt);

    const bottomBelt = new THREE.Mesh(beltGeom, beltMaterial);
    bottomBelt.position.set(0, -0.7, 0);
    scene.add(bottomBelt);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      refs.current.pulseTime += 0.05;
      const { 
        leftWheel, rightWheel, rightMotor, 
        leftLEDMaterial, rightLEDMaterial, 
        wheelRotationSpeed, rightMotorShakeAmount,
        rightMotorBasePos, pulseTime
      } = refs.current;

      if (leftWheel && rightWheel) {
        leftWheel.rotation.y += wheelRotationSpeed;
        rightWheel.rotation.y += wheelRotationSpeed;
      }

      if (leftLEDMaterial && leftLEDMaterial.emissiveIntensity > 1.2) {
        leftLEDMaterial.emissiveIntensity = 1.2 + Math.sin(pulseTime * 4) * 0.4;
      }
      if (rightLEDMaterial && rightLEDMaterial.emissiveIntensity > 1.2) {
        rightLEDMaterial.emissiveIntensity = 1.2 + Math.sin(pulseTime * 4) * 0.4;
      }

      if (rightMotor && rightMotorShakeAmount > 0) {
        rightMotor.position.x = rightMotorBasePos.x + (Math.random() - 0.5) * rightMotorShakeAmount;
        rightMotor.position.y = rightMotorBasePos.y + (Math.random() - 0.5) * rightMotorShakeAmount;
        rightMotor.position.z = rightMotorBasePos.z + (Math.random() - 0.5) * rightMotorShakeAmount;
      } else if (rightMotor) {
        rightMotor.position.set(rightMotorBasePos.x, rightMotorBasePos.y, rightMotorBasePos.z);
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight || 400;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Handle state updates
  useEffect(() => {
    const isRunning = isOnline && machineState === 'RUNNING';
    const sensor = machineData?.sensor || {};
    
    const temp = Number(sensor.temperature) || 0;
    const sound = Number(sensor.sound || sensor.raw_sound) || 0;
    const vibrationDetected = Boolean(sensor.vibration_detected) || Number(sensor.vibration) > 0;

    const { leftLEDMaterial, rightLEDMaterial } = refs.current;

    if (!isRunning) {
      // Off / Idle LEDs
      if (leftLEDMaterial) {
        leftLEDMaterial.color.setHex(0x64748b);
        leftLEDMaterial.emissive.setHex(0x334155);
        leftLEDMaterial.emissiveIntensity = 0.2;
      }
      if (rightLEDMaterial) {
        rightLEDMaterial.color.setHex(0x64748b);
        rightLEDMaterial.emissive.setHex(0x334155);
        rightLEDMaterial.emissiveIntensity = 0.2;
      }
      refs.current.rightMotorShakeAmount = 0.0;
      refs.current.wheelRotationSpeed = 0.0;
      return;
    }

    // RUNNING animation & LEDs
    refs.current.wheelRotationSpeed = 0.08;

    if (leftLEDMaterial && !isNaN(temp)) {
      if (temp <= 27) {
        leftLEDMaterial.color.setHex(0x22c55e);      
        leftLEDMaterial.emissive.setHex(0x22c55e);
        leftLEDMaterial.emissiveIntensity = 1.0;
      } else if (temp <= 35) {
        leftLEDMaterial.color.setHex(0xf97316);      
        leftLEDMaterial.emissive.setHex(0xf97316);
        leftLEDMaterial.emissiveIntensity = 1.2;
      } else {
        leftLEDMaterial.color.setHex(0xef4444);      
        leftLEDMaterial.emissive.setHex(0xef4444);
        leftLEDMaterial.emissiveIntensity = 1.3;
      }
    }

    if (rightLEDMaterial && !isNaN(sound)) {
      if (vibrationDetected) {
        rightLEDMaterial.color.setHex(0xef4444);     
        rightLEDMaterial.emissive.setHex(0xef4444);
        rightLEDMaterial.emissiveIntensity = 1.3;
        refs.current.rightMotorShakeAmount = 0.05;
      } else {
        rightLEDMaterial.color.setHex(0x22c55e);     
        rightLEDMaterial.emissive.setHex(0x22c55e);
        rightLEDMaterial.emissiveIntensity = 1.0;
        refs.current.rightMotorShakeAmount = 0.0;
      }
    }
  }, [machineData, isOnline, machineState]);

  const isRunning = isOnline && machineState === 'RUNNING';
  const isIdle = isOnline && machineState === 'IDLE';

  const getStatusText = () => {
    if (!isOnline || machineState === 'OFFLINE') return 'Machine Offline';
    if (machineState === 'IDLE') return 'Machine Idle / Stopped';
    return 'Machine Active & Running';
  };

  const getStatusColor = () => {
    if (!isOnline || machineState === 'OFFLINE') return 'var(--color-danger)';
    if (machineState === 'IDLE') return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  const getTempDisplay = () => {
    if (!isOnline) return '--';
    const sensor = machineData?.sensor || machineData || {};
    const val = Number(sensor.temperature);
    if (!isNaN(val) && val > 0) {
      return `${val.toFixed(1)} °C`;
    }
    return '--';
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '450px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} className="glass-panel">
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Overlays */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', background: 'var(--bg-surface)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Left Motor</h4>
        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          {getTempDisplay()}
        </div>
      </div>

      <div style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--bg-surface)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', textAlign: 'right' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Right Motor</h4>
        <div style={{ fontSize: '1.1rem', fontWeight: '600', color: isOnline ? (machineData?.sensor?.vibration_detected ? 'var(--color-danger)' : 'var(--color-success)') : 'var(--text-muted)' }}>
          Vib: {isOnline ? (machineData?.sensor?.vibration_detected ? 'DETECTED' : 'Normal') : 'Offline'}
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Sound: {isOnline && (machineData?.sensor?.sound !== undefined || machineData?.sensor?.raw_sound !== undefined) ? `${Number(machineData.sensor.sound ?? machineData.sensor.raw_sound ?? 0).toFixed(0)} dB` : '--'}
        </div>
      </div>
      
      <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-surface)', padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ 
          width: '10px', height: '10px', borderRadius: '50%', 
          background: getStatusColor()
        }} />
        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
          {getStatusText()}
        </span>
      </div>
    </div>
  );
};

export default DigitalTwin3D;
