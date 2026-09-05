<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		BufferAttribute,
		Material,
		PerspectiveCamera,
		Points,
		Scene,
		WebGLRenderer
	} from 'three';

	let canvas = $state<HTMLCanvasElement | null>(null);
	let failed = $state(false);

	onMount(() => {
		const host = canvas;
		if (!(host instanceof HTMLCanvasElement)) return;
		const el = host;

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) return;

		let disposed = false;
		let frame = 0;
		let renderer: WebGLRenderer | null = null;
		let scene: Scene | null = null;
		let camera: PerspectiveCamera | null = null;
		let points: Points | null = null;
		let disposeScene = () => {};

		const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

		function onPointer(event: PointerEvent) {
			const rect = el.getBoundingClientRect();
			pointer.tx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			pointer.ty = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
		}

		el.addEventListener('pointermove', onPointer);

		void import('three')
			.then((THREE) => {
				if (disposed || !el.isConnected) return;

				scene = new THREE.Scene();
				camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
				camera.position.z = 18;

				renderer = new THREE.WebGLRenderer({
					canvas: el,
					antialias: true,
					alpha: true,
					powerPreference: 'high-performance'
				});
				renderer.setClearColor(0x000000, 0);
				renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

				const count = window.innerWidth < 768 ? 90 : 160;
				const positions = new Float32Array(count * 3);
				const seeds = new Float32Array(count);

				for (let i = 0; i < count; i += 1) {
					positions[i * 3] = (Math.random() - 0.5) * 28;
					positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
					positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
					seeds[i] = Math.random() * Math.PI * 2;
				}

				const pointsGeo = new THREE.BufferGeometry();
				pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

				points = new THREE.Points(
					pointsGeo,
					new THREE.PointsMaterial({
						color: 0xc4b5fd,
						size: 0.11,
						transparent: true,
						opacity: 0.9,
						depthWrite: false,
						sizeAttenuation: true
					})
				);
				scene.add(points);

				const maxLinks = count * 3;
				const linePositions = new Float32Array(maxLinks * 6);
				const lineGeo = new THREE.BufferGeometry();
				lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

				const lines = new THREE.LineSegments(
					lineGeo,
					new THREE.LineBasicMaterial({
						color: 0x6d28d9,
						transparent: true,
						opacity: 0.22,
						depthWrite: false
					})
				);
				scene.add(lines);

				const core = new THREE.Mesh(
					new THREE.IcosahedronGeometry(3.4, 1),
					new THREE.MeshBasicMaterial({
						color: 0x7c3aed,
						wireframe: true,
						transparent: true,
						opacity: 0.18
					})
				);
				scene.add(core);

				const halo = new THREE.Mesh(
					new THREE.IcosahedronGeometry(5.2, 0),
					new THREE.MeshBasicMaterial({
						color: 0x3b1e78,
						wireframe: true,
						transparent: true,
						opacity: 0.12
					})
				);
				scene.add(halo);

				function resize() {
					if (!renderer || !camera) return;
					const width = el.clientWidth;
					const height = el.clientHeight;
					if (width === 0 || height === 0) return;
					camera.aspect = width / height;
					camera.updateProjectionMatrix();
					renderer.setSize(width, height, false);
				}

				const observer = new ResizeObserver(resize);
				observer.observe(el);
				resize();

				function tick(now: number) {
					if (disposed || !renderer || !camera || !scene || !points) return;
					frame = requestAnimationFrame(tick);

					const t = now * 0.001;
					pointer.x += (pointer.tx - pointer.x) * 0.045;
					pointer.y += (pointer.ty - pointer.y) * 0.045;

					const pos = points.geometry.getAttribute('position') as BufferAttribute;

					for (let i = 0; i < count; i += 1) {
						const seed = seeds[i];
						pos.setY(i, pos.getY(i) + Math.sin(t * 0.45 + seed) * 0.004);
						pos.setX(i, pos.getX(i) + Math.cos(t * 0.28 + seed) * 0.003);
					}
					pos.needsUpdate = true;

					let link = 0;
					const linkDist = 4.4;
					for (let i = 0; i < count && link < maxLinks; i += 1) {
						const ax = pos.getX(i);
						const ay = pos.getY(i);
						const az = pos.getZ(i);
						for (let j = i + 1; j < count && link < maxLinks; j += 1) {
							const dx = ax - pos.getX(j);
							const dy = ay - pos.getY(j);
							const dz = az - pos.getZ(j);
							if (dx * dx + dy * dy + dz * dz < linkDist * linkDist) {
								linePositions[link * 6] = ax;
								linePositions[link * 6 + 1] = ay;
								linePositions[link * 6 + 2] = az;
								linePositions[link * 6 + 3] = pos.getX(j);
								linePositions[link * 6 + 4] = pos.getY(j);
								linePositions[link * 6 + 5] = pos.getZ(j);
								link += 1;
							}
						}
					}
					lineGeo.setDrawRange(0, link * 2);
					(lineGeo.getAttribute('position') as BufferAttribute).needsUpdate = true;

					core.rotation.y = t * 0.12;
					core.rotation.x = t * 0.05;
					halo.rotation.y = -t * 0.06;
					halo.rotation.z = t * 0.03;

					camera.position.x = pointer.x * 1.6;
					camera.position.y = pointer.y * 0.9;
					camera.lookAt(0, 0, 0);

					renderer.render(scene, camera);
				}

				frame = requestAnimationFrame(tick);

				disposeScene = () => {
					observer.disconnect();
					cancelAnimationFrame(frame);
					pointsGeo.dispose();
					lineGeo.dispose();
					(points?.material as Material | undefined)?.dispose();
					(lines.material as Material).dispose();
					core.geometry.dispose();
					(core.material as Material).dispose();
					halo.geometry.dispose();
					(halo.material as Material).dispose();
				};
			})
			.catch(() => {
				failed = true;
			});

		return () => {
			disposed = true;
			el.removeEventListener('pointermove', onPointer);
			disposeScene();
			renderer?.dispose();
			renderer = null;
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="absolute inset-0 h-full w-full {failed ? 'hidden' : ''}"
	aria-hidden="true"
></canvas>
