import { memo } from "react";

// Procedural scenery keeps the flight world self-contained and available offline.
function FlightEnvironment() {
  return <>
    <color attach="background" args={["#b8d6df"]} />
    <fog attach="fog" args={["#b8d6df", 45, 185]} />
    <hemisphereLight args={["#e9f7ff", "#737964", 2.1]} />
    <directionalLight position={[-35, 45, 20]} intensity={3.2} color="#fff0d5" castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-45} shadow-camera-right={45} shadow-camera-top={50} shadow-camera-bottom={-90} shadow-camera-far={180} shadow-bias={-0.001} />
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.65,-45]} receiveShadow><planeGeometry args={[800,800]}/><meshStandardMaterial color="#689fa9" roughness={.3} metalness={.35}/></mesh>
    <mesh position={[0,-2.05,-36]} scale={[23,2,82]} receiveShadow><sphereGeometry args={[1,48,24]}/><meshStandardMaterial color="#a6ab8c" roughness={1}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.015,-35]} receiveShadow><planeGeometry args={[15,110]}/><meshStandardMaterial color="#414f55" roughness={.92}/></mesh>
    {[-7.1,7.1].map(x=><mesh key={x} rotation={[-Math.PI/2,0,0]} position={[x,.03,-35]}><planeGeometry args={[.12,108]}/><meshBasicMaterial color="#e0e4d3"/></mesh>)}
    {Array.from({length:23},(_,i)=><mesh key={i} rotation={[-Math.PI/2,0,0]} position={[0,.04,12-i*4.5]}><planeGeometry args={[.16,1.8]}/><meshBasicMaterial color="#d8ded6"/></mesh>)}
    {Array.from({length:18},(_,i)=>{
      const side=i%2?1:-1, x=side*(27+(i%4)*13), z=12-Math.floor(i/2)*19;
      return <group key={i} position={[x,-2,z]}>
        <mesh scale={[1.5,1,1.25]} castShadow><coneGeometry args={[12+(i%3)*4,12+(i%5)*6,7]}/><meshStandardMaterial color={i%2?"#78988c":"#8fa69c"} roughness={1}/></mesh>
      </group>;
    })}
    {Array.from({length:26},(_,i)=>{
      const x=(i%2?1:-1)*(11+(i%3)*2.5), z=10-Math.floor(i/2)*7;
      return <group key={i} position={[x,0,z]}>
        <mesh position={[0,1,0]} castShadow><cylinderGeometry args={[.12,.2,2,6]}/><meshStandardMaterial color="#77684e"/></mesh>
        <mesh position={[0,2.2,0]} castShadow><coneGeometry args={[.9,3.1,8]}/><meshStandardMaterial color={i%3?"#476b59":"#668169"}/></mesh>
      </group>;
    })}
    {[-1,1].map(side=><group key={side} position={[side*13,0,5]}>
      <mesh position={[0,1.3,0]} castShadow receiveShadow><boxGeometry args={[5,2.6,7]}/><meshStandardMaterial color="#d1d4c8" roughness={.7}/></mesh>
      <mesh position={[0,2.75,0]}><boxGeometry args={[5.5,.3,7.5]}/><meshStandardMaterial color="#405761"/></mesh>
      <mesh position={[-side*2.51,1.2,0]}><boxGeometry args={[.03,1.8,5]}/><meshStandardMaterial color="#385761" metalness={.4} roughness={.3}/></mesh>
    </group>)}
    <mesh position={[-65,55,-170]}><sphereGeometry args={[9,24,16]}/><meshBasicMaterial color="#fff6dd"/></mesh>
    {Array.from({length:9},(_,i)=><mesh key={i} position={[-100+i*24,30+(i%3)*5,-120-(i%2)*30]} scale={[12,2,4]}><sphereGeometry args={[1,16,8]}/><meshBasicMaterial color="#eaf0e9" transparent opacity={.55}/></mesh>)}
  </>;
}
export default memo(FlightEnvironment);
