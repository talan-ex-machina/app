'use client';

import { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Stars } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, RotateCcw, DollarSign } from 'lucide-react';
import * as THREE from 'three';

interface Enhanced3DViewProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface Investment {
  id: string;
  department: string;
  amount: number;
  timestamp: Date;
  projectedROI: number;
}

interface ChartData {
  id: string;
  label: string;
  value: number;
  color: string;
  maxValue: number;
  growth?: number;
  previousValue?: number;
}

interface CompetitorNode {
  id: string;
  name: string;
  position: [number, number, number];
  marketShare: number;
  innovationIndex: number;
  riskLevel: number;
  color: string;
}

interface MarketOpportunity {
  id: string;
  sector: string;
  position: [number, number, number];
  potential: number;
  saturation: number;
  timeToEntry: number;
}

interface Agent {
  id: string;
  name: string;
  position: [number, number, number];
  status: 'active' | 'processing' | 'idle';
  connections: string[];
}

interface Sector {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
  icon: string;
}

const SECTORS: Sector[] = [
  { id: 'investment', name: 'Investment Simulator', position: [0, 0, 0], color: '#3b82f6', icon: 'DollarSign' },
  { id: 'competitive', name: 'Competitive Landscape', position: [-30, 0, 0], color: '#8b5cf6', icon: 'Target' },
  { id: 'opportunities', name: 'Opportunity Radar', position: [30, 0, 0], color: '#10b981', icon: 'Radar' },
  { id: 'timeline', name: 'Market Timeline', position: [0, 0, -30], color: '#f59e0b', icon: 'TrendingUp' },
  { id: 'geographic', name: 'Geo-Spatial Markets', position: [0, 0, 30], color: '#ef4444', icon: 'Globe' },
  { id: 'agents', name: 'Agent Network', position: [-20, 15, -20], color: '#06b6d4', icon: 'Users' },
  { id: 'scenarios', name: 'Scenario Planning', position: [20, 15, 20], color: '#f97316', icon: 'AlertTriangle' },
];

// Sector Navigation Component
function SectorPortal({ 
  sector, 
  onEnter, 
  isActive 
}: { 
  sector: Sector; 
  onEnter: (sectorId: string) => void;
  isActive: boolean;
}) {
  const portalRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (portalRef.current && isActive) {
      portalRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      portalRef.current.position.y = sector.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.5;
    }
  });

  return (
    <group ref={portalRef} position={sector.position}>
      {/* Portal Base */}
      <mesh
        onClick={() => onEnter(sector.id)}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <cylinderGeometry args={[3, 3, 0.5, 8]} />
        <meshStandardMaterial 
          color={sector.color} 
          emissive={sector.color} 
          emissiveIntensity={isActive ? 0.3 : 0.1}
          transparent 
          opacity={0.8} 
        />
      </mesh>

      {/* Portal Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4, 0.3, 8, 16]} />
        <meshStandardMaterial 
          color={sector.color} 
          emissive={sector.color} 
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Sector Label */}
      <Text
        position={[0, 5, 0]}
        fontSize={1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {sector.name}
      </Text>

      {/* Icon representation */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={sector.color} 
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

// Competitive Landscape Map
function CompetitiveLandscape() {
  const competitors: CompetitorNode[] = [
    { id: 'accenture', name: 'Accenture', position: [8, 2, 5], marketShare: 85, innovationIndex: 78, riskLevel: 25, color: '#3b82f6' },
    { id: 'deloitte', name: 'Deloitte', position: [6, 1.5, -3], marketShare: 72, innovationIndex: 82, riskLevel: 30, color: '#10b981' },
    { id: 'mckinsey', name: 'McKinsey', position: [-5, 3, 4], marketShare: 65, innovationIndex: 95, riskLevel: 15, color: '#8b5cf6' },
    { id: 'pwc', name: 'PwC', position: [-8, 1, -6], marketShare: 68, innovationIndex: 71, riskLevel: 35, color: '#f59e0b' },
    { id: 'ey', name: 'EY', position: [2, 2.5, 8], marketShare: 58, innovationIndex: 69, riskLevel: 40, color: '#ef4444' },
    { id: 'talan', name: 'Talan', position: [0, 4, 0], marketShare: 12, innovationIndex: 88, riskLevel: 20, color: '#06b6d4' },
  ];

  return (
    <group position={[-30, 0, 0]}>
      {/* Base Plane with Heatmap */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color="#1f2937" 
          transparent 
          opacity={0.7}
          wireframe
        />
      </mesh>

      {/* Competitor Nodes */}
      {competitors.map((competitor) => (
        <group key={competitor.id} position={competitor.position}>
          {/* Company Node */}
          <mesh>
            <sphereGeometry args={[competitor.marketShare / 50, 16, 16]} />
            <meshStandardMaterial 
              color={competitor.color}
              emissive={competitor.color}
              emissiveIntensity={competitor.innovationIndex / 200}
            />
          </mesh>

          {/* Risk Level Indicator */}
          <mesh position={[0, competitor.marketShare / 25, 0]}>
            <coneGeometry args={[0.3, competitor.riskLevel / 20, 8]} />
            <meshStandardMaterial 
              color={competitor.riskLevel > 30 ? '#ef4444' : '#10b981'}
            />
          </mesh>

          {/* Company Label */}
          <Text
            position={[0, -2, 0]}
            fontSize={0.5}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {competitor.name}
          </Text>

          {/* Metrics Display */}
          <Html position={[2, 0, 0]} transform occlude>
            <div className="bg-black/80 text-white p-2 rounded text-xs min-w-[120px]">
              <div>Market Share: {competitor.marketShare}%</div>
              <div>Innovation: {competitor.innovationIndex}/100</div>
              <div>Risk: {competitor.riskLevel}/100</div>
            </div>
          </Html>
        </group>
      ))}

      {/* Title */}
      <Text
        position={[0, 8, 0]}
        fontSize={1.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Competitive Landscape Map
      </Text>

      {/* Legend */}
      <Html position={[-10, 6, 0]} transform>
        <div className="bg-black/80 text-white p-4 rounded">
          <h4 className="font-bold mb-2">Legend</h4>
          <div className="text-xs space-y-1">
            <div>• Sphere size = Market Share</div>
            <div>• Glow intensity = Innovation</div>
            <div>• Cone height = Risk Level</div>
            <div>• Position = Strategic Positioning</div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// Opportunity Radar
function OpportunityRadar() {
  const opportunities: MarketOpportunity[] = [
    { id: 'edge-ai', sector: 'Edge AI Computing', position: [5, 3, 2], potential: 85, saturation: 25, timeToEntry: 6 },
    { id: 'quantum', sector: 'Quantum Security', position: [8, 2, -4], potential: 95, saturation: 15, timeToEntry: 18 },
    { id: 'green-tech', sector: 'Green Tech Solutions', position: [-3, 4, 6], potential: 78, saturation: 45, timeToEntry: 12 },
    { id: 'metaverse', sector: 'Metaverse Consulting', position: [-6, 1, -2], potential: 65, saturation: 70, timeToEntry: 9 },
    { id: 'biotech', sector: 'BioTech Analytics', position: [2, 5, -7], potential: 88, saturation: 30, timeToEntry: 24 },
  ];

  return (
    <group position={[30, 0, 0]}>
      {/* Radar Rings */}
      {[2, 4, 6, 8].map((radius, index) => (
        <mesh key={index} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.05, 8, 32]} />
          <meshStandardMaterial 
            color="#374151" 
            emissive="#374151" 
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      {/* Radar Sweep */}
      <mesh rotation={[0, Date.now() * 0.001, 0]}>
        <coneGeometry args={[8, 0.1, 3]} />
        <meshStandardMaterial 
          color="#10b981" 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Opportunity Blips */}
      {opportunities.map((opp) => (
        <group key={opp.id} position={opp.position}>
          {/* Opportunity Node */}
          <mesh>
            <sphereGeometry args={[opp.potential / 50, 16, 16]} />
            <meshStandardMaterial 
              color={opp.saturation < 40 ? '#10b981' : opp.saturation < 70 ? '#f59e0b' : '#ef4444'}
              emissive={opp.saturation < 40 ? '#10b981' : opp.saturation < 70 ? '#f59e0b' : '#ef4444'}
              emissiveIntensity={0.4}
            />
          </mesh>

          {/* Pulse Effect */}
          <mesh>
            <sphereGeometry args={[opp.potential / 30, 16, 16]} />
            <meshStandardMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.2}
            />
          </mesh>

          {/* Sector Label */}
          <Text
            position={[0, -1.5, 0]}
            fontSize={0.3}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {opp.sector}
          </Text>

          {/* Opportunity Details */}
          <Html position={[1.5, 0, 0]} transform occlude>
            <div className="bg-black/80 text-white p-2 rounded text-xs min-w-[140px]">
              <div>Potential: {opp.potential}/100</div>
              <div>Saturation: {opp.saturation}%</div>
              <div>Time to Entry: {opp.timeToEntry}mo</div>
            </div>
          </Html>
        </group>
      ))}

      {/* Title */}
      <Text
        position={[0, 8, 0]}
        fontSize={1.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Opportunity Radar
      </Text>
    </group>
  );
}

// Market Timeline
function MarketTimeline() {
  const timelineEvents = [
    { year: 2020, event: 'Digital Transformation Boom', position: [-8, 2, 0], impact: 85 },
    { year: 2021, event: 'Remote Work Revolution', position: [-4, 3, 0], impact: 92 },
    { year: 2022, event: 'AI/ML Mainstream Adoption', position: [0, 4, 0], impact: 78 },
    { year: 2023, event: 'Cybersecurity Crisis', position: [4, 2.5, 0], impact: 95 },
    { year: 2024, event: 'Sustainability Focus', position: [8, 3.5, 0], impact: 73 },
    { year: 2025, event: 'Quantum Computing', position: [12, 5, 0], impact: 65 },
  ];

  return (
    <group position={[0, 0, -30]}>
      {/* Timeline Base */}
      <mesh position={[2, 0, 0]}>
        <boxGeometry args={[24, 0.2, 1]} />
        <meshStandardMaterial color="#374151" />
      </mesh>

      {/* Timeline Events */}
      {timelineEvents.map((event) => (
        <group key={event.year} position={event.position as [number, number, number]}>
          {/* Event Marker */}
          <mesh>
            <cylinderGeometry args={[0.3, 0.3, event.impact / 20, 8]} />
            <meshStandardMaterial 
              color="#3b82f6"
              emissive="#3b82f6"
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Year Label */}
          <Text
            position={[0, -1, 0]}
            fontSize={0.4}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {event.year}
          </Text>

          {/* Event Description */}
          <Text
            position={[0, event.impact / 20 + 1, 0]}
            fontSize={0.3}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            maxWidth={4}
          >
            {event.event}
          </Text>

          {/* Impact Visualization */}
          <Html position={[0, event.impact / 40, 2]} transform occlude>
            <div className="bg-black/80 text-white p-2 rounded text-xs text-center">
              <div>Impact: {event.impact}/100</div>
            </div>
          </Html>
        </group>
      ))}

      {/* Title */}
      <Text
        position={[2, 8, 0]}
        fontSize={1.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Market Trends Timeline
      </Text>
    </group>
  );
}

// Geographic Market View
function GeographicMarketView() {
  const regions = [
    { name: 'North America', position: [-6, 2, 4], demand: 85, density: 75, risk: 25 },
    { name: 'Europe', position: [0, 3, 2], demand: 78, density: 85, risk: 20 },
    { name: 'Asia Pacific', position: [6, 4, -2], demand: 92, density: 65, risk: 45 },
    { name: 'Middle East', position: [2, 1, 6], demand: 65, density: 45, risk: 60 },
    { name: 'Latin America', position: [-4, 1.5, -4], demand: 58, density: 35, risk: 55 },
    { name: 'Africa', position: [0, 2, -6], demand: 45, density: 25, risk: 70 },
  ];

  return (
    <group position={[0, 0, 30]}>
      {/* Globe Base */}
      <mesh>
        <sphereGeometry args={[8, 32, 32]} />
        <meshStandardMaterial 
          color="#1e40af" 
          transparent 
          opacity={0.3}
          wireframe
        />
      </mesh>

      {/* Regional Markers */}
      {regions.map((region) => (
        <group key={region.name} position={region.position as [number, number, number]}>
          {/* Region Node */}
          <mesh>
            <sphereGeometry args={[region.demand / 50, 16, 16]} />
            <meshStandardMaterial 
              color={region.risk < 40 ? '#10b981' : region.risk < 60 ? '#f59e0b' : '#ef4444'}
              emissive={region.risk < 40 ? '#10b981' : region.risk < 60 ? '#f59e0b' : '#ef4444'}
              emissiveIntensity={0.4}
            />
          </mesh>

          {/* Demand Indicator */}
          <mesh position={[0, region.demand / 40, 0]}>
            <cylinderGeometry args={[0.2, 0.2, region.demand / 20, 8]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>

          {/* Region Label */}
          <Text
            position={[0, -2, 0]}
            fontSize={0.4}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {region.name}
          </Text>

          {/* Regional Data */}
          <Html position={[2, 0, 0]} transform occlude>
            <div className="bg-black/80 text-white p-2 rounded text-xs min-w-[120px]">
              <div>Demand: {region.demand}/100</div>
              <div>Density: {region.density}%</div>
              <div>Risk: {region.risk}/100</div>
            </div>
          </Html>
        </group>
      ))}

      {/* Title */}
      <Text
        position={[0, 12, 0]}
        fontSize={1.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Global Market Analysis
      </Text>
    </group>
  );
}

// Agent Network Visualization
function AgentNetwork() {
  const agents: Agent[] = [
    { id: 'data-collector', name: 'Data Collector', position: [-4, 2, 0], status: 'active', connections: ['analyzer', 'reporter'] },
    { id: 'analyzer', name: 'Market Analyzer', position: [0, 4, 2], status: 'processing', connections: ['predictor', 'reporter'] },
    { id: 'predictor', name: 'Trend Predictor', position: [4, 2, -2], status: 'active', connections: ['optimizer'] },
    { id: 'optimizer', name: 'Strategy Optimizer', position: [2, 0, 4], status: 'idle', connections: ['reporter'] },
    { id: 'reporter', name: 'Report Generator', position: [-2, 1, -4], status: 'active', connections: [] },
  ];

  return (
    <group position={[-20, 15, -20]}>
      {/* Agent Nodes */}
      {agents.map((agent) => (
        <group key={agent.id} position={agent.position}>
          {/* Agent Avatar */}
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
              color={
                agent.status === 'active' ? '#10b981' :
                agent.status === 'processing' ? '#f59e0b' : '#6b7280'
              }
              emissive={
                agent.status === 'active' ? '#10b981' :
                agent.status === 'processing' ? '#f59e0b' : '#6b7280'
              }
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Status Indicator */}
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial 
              color={
                agent.status === 'active' ? '#10b981' :
                agent.status === 'processing' ? '#f59e0b' : '#6b7280'
              }
            />
          </mesh>

          {/* Agent Name */}
          <Text
            position={[0, -1.5, 0]}
            fontSize={0.3}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {agent.name}
          </Text>

          {/* Connection Lines */}
          {agent.connections.map((connId) => {
            const targetAgent = agents.find(a => a.id === connId);
            if (targetAgent) {
              const start = new THREE.Vector3(...agent.position);
              const end = new THREE.Vector3(...targetAgent.position);
              const direction = end.clone().sub(start);
              const distance = direction.length();
              const midpoint = start.clone().add(direction.clone().multiplyScalar(0.5));

              return (
                <group key={connId} position={[midpoint.x - agent.position[0], midpoint.y - agent.position[1], midpoint.z - agent.position[2]]}>
                  <mesh lookAt={end}>
                    <cylinderGeometry args={[0.05, 0.05, distance, 8]} />
                    <meshStandardMaterial 
                      color="#06b6d4" 
                      emissive="#06b6d4" 
                      emissiveIntensity={0.2}
                    />
                  </mesh>
                </group>
              );
            }
            return null;
          })}
        </group>
      ))}

      {/* Title */}
      <Text
        position={[0, 8, 0]}
        fontSize={1.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        AI Agent Network
      </Text>
    </group>
  );
}

// Scenario Planning Room
function ScenarioPlanningRoom() {
  const scenarios = [
    { name: 'Price War', impact: -25, probability: 35, position: [-3, 2, 0] },
    { name: 'New Entrant', impact: -15, probability: 60, position: [0, 3, 2] },
    { name: 'Tech Disruption', impact: 45, probability: 25, position: [3, 1, -2] },
    { name: 'Economic Recession', impact: -35, probability: 40, position: [0, 2, -3] },
  ];

  return (
    <group position={[20, 15, 20]}>
      {/* Room Walls */}
      <mesh position={[0, 3, -5]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color="#1f2937" transparent opacity={0.7} />
      </mesh>
      
      <mesh position={[-5, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#1f2937" transparent opacity={0.7} />
      </mesh>

      {/* Scenario Panels */}
      {scenarios.map((scenario) => (
        <group key={scenario.name} position={scenario.position as [number, number, number]}>
          {/* Scenario Visualization */}
          <mesh>
            <boxGeometry args={[2, 1.5, 0.2]} />
            <meshStandardMaterial 
              color={scenario.impact > 0 ? '#10b981' : '#ef4444'}
              emissive={scenario.impact > 0 ? '#10b981' : '#ef4444'}
              emissiveIntensity={0.2}
            />
          </mesh>

          {/* Impact Bar */}
          <mesh position={[0, -1, 0.2]}>
            <boxGeometry args={[Math.abs(scenario.impact) / 25, 0.3, 0.1]} />
            <meshStandardMaterial 
              color={scenario.impact > 0 ? '#10b981' : '#ef4444'}
            />
          </mesh>

          {/* Scenario Label */}
          <Text
            position={[0, 0, 0.3]}
            fontSize={0.3}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {scenario.name}
          </Text>

          {/* Details */}
          <Html position={[2.5, 0, 0]} transform occlude>
            <div className="bg-black/80 text-white p-2 rounded text-xs min-w-[120px]">
              <div>Impact: {scenario.impact}%</div>
              <div>Probability: {scenario.probability}%</div>
            </div>
          </Html>
        </group>
      ))}

      {/* Title */}
      <Text
        position={[0, 6, 0]}
        fontSize={1.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Scenario Planning Room
      </Text>
    </group>
  );
}
const simulateInvestmentImpact = (
  department: string,
  amount: number,
  currentData: ChartData[]
): ChartData[] => {
  const impactMultipliers: { [key: string]: number } = {
    'cybersecurity': 0.0003, // Each $1000 increases revenue by 0.3M
    'digital': 0.0004,
    'cloud': 0.0003,
    'data': 0.0005,
    'ai': 0.0006
  };

  const growthMultipliers: { [key: string]: number } = {
    'cybersecurity': 0.15, // 15% base growth rate
    'digital': 0.20,
    'cloud': 0.18,
    'data': 0.25,
    'ai': 0.30
  };

  const normalizedDept = department.toLowerCase();
  const matchedDept = Object.keys(impactMultipliers).find(key => 
    normalizedDept.includes(key)
  ) || 'digital';

  const impactMultiplier = impactMultipliers[matchedDept];
  const growthRate = growthMultipliers[matchedDept];
  const directImpact = amount * impactMultiplier;

  return currentData.map(item => {
    let newValue = item.value;
    let growth = 0;

    // Direct impact on related department
    if (item.label.toLowerCase().includes(matchedDept)) {
      const investmentImpact = directImpact * (1 + Math.random() * 0.5); // Add some randomness
      newValue = Math.min(item.maxValue, item.value + investmentImpact);
      growth = ((newValue - item.value) / item.value) * 100;
    } 
    // Indirect impact on other departments (spillover effect)
    else {
      const spilloverEffect = directImpact * 0.3 * (0.5 + Math.random() * 0.5);
      newValue = Math.min(item.maxValue, item.value + spilloverEffect);
      growth = ((newValue - item.value) / item.value) * 100;
    }

    return {
      ...item,
      previousValue: item.value,
      value: newValue,
      growth: growth
    };
  });
};

function InvestmentInput({ 
  onInvest 
}: { 
  onInvest: (department: string, amount: number) => void;
}) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const parseInvestmentCommand = (command: string) => {
    // Parse commands like "invest 30000 in cybersecurity" or "talan invest $50000 in digital transformation"
    const patterns = [
      /invest\s+\$?(\d+(?:,\d{3})*)\s+(?:in\s+)?(.+)/i,
      /talan\s+invest\s+\$?(\d+(?:,\d{3})*)\s+(?:in\s+)?(.+)/i,
      /allocate\s+\$?(\d+(?:,\d{3})*)\s+(?:to\s+)?(.+)/i,
      /spend\s+\$?(\d+(?:,\d{3})*)\s+(?:on\s+)?(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match) {
        const amount = parseInt(match[1].replace(/,/g, ''));
        const department = match[2].trim();
        return { amount, department };
      }
    }
    return null;
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    const parsed = parseInvestmentCommand(input);
    
    if (parsed) {
      setTimeout(() => {
        onInvest(parsed.department, parsed.amount);
        setInput('');
        setIsProcessing(false);
      }, 1000); // Simulate processing time
    } else {
      setTimeout(() => {
        setIsProcessing(false);
        alert('Please use format: "invest $30000 in cybersecurity" or "talan invest 50000 in digital transformation"');
      }, 500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Html position={[0, 6, 0]} transform occlude>
      <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/20 min-w-[400px]">
        <h3 className="text-white font-bold mb-3 text-center">Investment Simulation</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., 'invest $30000 in cybersecurity'"
            className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          />
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                <span>Invest</span>
              </>
            )}
          </button>
        </div>
        <div className="mt-2 text-xs text-white/70">
          Try: &quot;invest $50000 in AI&quot;, &quot;talan invest 25000 in cloud solutions&quot;
        </div>
      </div>
    </Html>
  );
}

function InteractiveBarChart({ 
  data, 
  position, 
  onDataChange 
}: { 
  data: ChartData[]; 
  position: [number, number, number];
  onDataChange: (id: string, newValue: number) => void;
}) {
  return (
    <group position={position}>
      {/* Chart Base */}
      <mesh position={[0, -1, 0]}>
        <boxGeometry args={[4, 0.1, 2]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Chart Bars */}
      {data.map((item, index) => {
        const barHeight = (item.value / item.maxValue) * 3;
        const xPos = (index - data.length / 2) * 0.8;
        
        return (
          <group key={item.id} position={[xPos, 0, 0]}>
            {/* Interactive Bar */}
            <mesh 
              position={[0, barHeight / 2 - 0.95, 0]}
              onClick={(e) => {
                e.stopPropagation();
                const newValue = Math.min(item.maxValue, item.value + 10);
                onDataChange(item.id, newValue);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              <boxGeometry args={[0.6, barHeight, 0.6]} />
              <meshStandardMaterial color={item.color} />
            </mesh>

            {/* Value Label with Growth Indicator */}
            <Text
              position={[0, barHeight - 0.5, 0.4]}
              fontSize={0.2}
              color={item.growth && item.growth > 0 ? "#10b981" : "#ffffff"}
              anchorX="center"
              anchorY="middle"
            >
              {item.value.toFixed(1)}
              {item.growth && item.growth > 0 && (
                <tspan style={{ fontSize: '0.8em' }}> (+{item.growth.toFixed(1)}%)</tspan>
              )}
            </Text>

            {/* Category Label */}
            <Text
              position={[0, -1.3, 0]}
              fontSize={0.15}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
              rotation={[-Math.PI / 2, 0, 0]}
            >
              {item.label}
            </Text>
          </group>
        );
      })}

      {/* Chart Title */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Revenue by Quarter (€M)
      </Text>
    </group>
  );
}

function Interactive3DPieChart({ 
  data, 
  position,
  onDataChange 
}: { 
  data: ChartData[]; 
  position: [number, number, number];
  onDataChange: (id: string, newValue: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  return (
    <group ref={groupRef} position={position}>
      {data.map((item) => {
        const angle = (item.value / total) * Math.PI * 2;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        const midAngle = (startAngle + endAngle) / 2;
        
        currentAngle += angle;

        // Create pie slice geometry
        const geometry = new THREE.CylinderGeometry(1, 1, 0.3, 32, 1, false, startAngle, angle);
        
        return (
          <group key={item.id}>
            {/* Pie Slice */}
            <mesh 
              geometry={geometry}
              onClick={(e) => {
                e.stopPropagation();
                const newValue = Math.min(item.maxValue, item.value + 5);
                onDataChange(item.id, newValue);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              <meshStandardMaterial color={item.color} />
            </mesh>

            {/* Percentage Label */}
            <Text
              position={[
                Math.cos(midAngle) * 1.5,
                0.2,
                Math.sin(midAngle) * 1.5
              ]}
              fontSize={0.15}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {((item.value / total) * 100).toFixed(1)}%
            </Text>

            {/* Category Label */}
            <Text
              position={[
                Math.cos(midAngle) * 2,
                -0.5,
                Math.sin(midAngle) * 2
              ]}
              fontSize={0.12}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
            >
              {item.label}
            </Text>
          </group>
        );
      })}

      {/* Chart Title */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Service Distribution
      </Text>
    </group>
  );
}

function Interactive3DLineChart({ 
  data, 
  position,
  onDataChange 
}: { 
  data: ChartData[]; 
  position: [number, number, number];
  onDataChange: (id: string, newValue: number) => void;
}) {
  const points: THREE.Vector3[] = [];
  
  data.forEach((item, index) => {
    const x = (index - data.length / 2) * 0.8;
    const y = (item.value / item.maxValue) * 2 - 1;
    points.push(new THREE.Vector3(x, y, 0));
  });

  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 64, 0.05, 8, false);

  return (
    <group position={position}>
      {/* Chart Base Plane */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color="#1f2937" transparent opacity={0.3} />
      </mesh>

      {/* Line */}
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#3b82f6" />
      </mesh>

      {/* Data Points */}
      {data.map((item, index) => {
        const x = (index - data.length / 2) * 0.8;
        const y = (item.value / item.maxValue) * 2 - 1;
        
        return (
          <group key={item.id} position={[x, y, 0]}>
            {/* Interactive Point */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                const newValue = Math.min(item.maxValue, item.value + 5);
                onDataChange(item.id, newValue);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#10b981" />
            </mesh>

            {/* Value Label */}
            <Text
              position={[0, 0.3, 0]}
              fontSize={0.12}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {item.value}
            </Text>
          </group>
        );
      })}

      {/* Chart Title */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Growth Trend
      </Text>
    </group>
  );
}

function Scene3D({ 
  barData, 
  pieData, 
  lineData, 
  onDataChange,
  onInvest
}: { 
  barData: ChartData[];
  pieData: ChartData[];
  lineData: ChartData[];
  onDataChange: (chartType: string, id: string, newValue: number) => void;
  onInvest: (department: string, amount: number) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <directionalLight position={[-5, 5, 5]} intensity={0.4} />
      
      {/* Investment Input Interface */}
      <InvestmentInput onInvest={onInvest} />
      
      {/* Main Dashboard Title */}
      <group position={[0, 3.5, -2]}>
        <Text
          position={[0, 0, 0]}
          fontSize={0.6}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Talan Investment Simulator
        </Text>
        
        <Text
          position={[0, -0.5, 0]}
          fontSize={0.25}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          Interactive Business Impact Analysis
        </Text>
      </group>

      {/* Interactive Charts */}
      <InteractiveBarChart 
        data={barData}
        position={[-6, 1, 0]}
        onDataChange={(id, value) => onDataChange('bar', id, value)}
      />
      
      <Interactive3DPieChart 
        data={pieData}
        position={[6, 1, 0]}
        onDataChange={(id, value) => onDataChange('pie', id, value)}
      />
      
      <Interactive3DLineChart 
        data={lineData}
        position={[0, -2, 2]}
        onDataChange={(id, value) => onDataChange('line', id, value)}
      />

      {/* Background Grid */}
      <gridHelper args={[30, 30, '#374151', '#1f2937']} position={[0, -5, 0]} />
      
      <OrbitControls 
        enableZoom={true} 
        enablePan={true}
        autoRotate={false}
        maxDistance={25}
        minDistance={5}
      />
    </>
  );
}

// InteractiveCharts3D Component (Original investment simulator)
function InteractiveCharts3D({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [investmentHistory, setInvestmentHistory] = useState<Investment[]>([]);

  // Initial sample data for interactive charts
  const [barData, setBarData] = useState<ChartData[]>([
    { id: 'q1', label: 'Q1 Revenue', value: 15.2, color: '#3b82f6', maxValue: 80 },
    { id: 'q2', label: 'Q2 Revenue', value: 25.8, color: '#10b981', maxValue: 80 },
    { id: 'q3', label: 'Q3 Revenue', value: 32.1, color: '#8b5cf6', maxValue: 80 },
    { id: 'q4', label: 'Q4 Revenue', value: 28.5, color: '#f59e0b', maxValue: 80 },
  ]);

  const [pieData, setPieData] = useState<ChartData[]>([
    { id: 'digital', label: 'Digital Transform', value: 35, color: '#3b82f6', maxValue: 100 },
    { id: 'cloud', label: 'Cloud Solutions', value: 25, color: '#8b5cf6', maxValue: 100 },
    { id: 'cybersecurity', label: 'Cybersecurity', value: 20, color: '#10b981', maxValue: 100 },
    { id: 'ai', label: 'AI & Data Analytics', value: 20, color: '#f59e0b', maxValue: 100 },
  ]);

  const [lineData, setLineData] = useState<ChartData[]>([
    { id: 'jan', label: 'Client Satisfaction', value: 85, color: '#3b82f6', maxValue: 100 },
    { id: 'feb', label: 'Market Share', value: 12, color: '#3b82f6', maxValue: 50 },
    { id: 'mar', label: 'Operational Efficiency', value: 78, color: '#3b82f6', maxValue: 100 },
    { id: 'apr', label: 'Innovation Index', value: 82, color: '#3b82f6', maxValue: 100 },
    { id: 'may', label: 'Revenue Growth', value: 15, color: '#3b82f6', maxValue: 50 },
  ]);

  const handleInvestment = (department: string, amount: number) => {
    // Create investment record
    const investment: Investment = {
      id: Date.now().toString(),
      department,
      amount,
      timestamp: new Date(),
      projectedROI: Math.random() * 0.3 + 0.1 // 10-40% ROI
    };

    setInvestmentHistory(prev => [...prev, investment]);
    setTotalInvestment(prev => prev + amount);

    // Apply investment impact to relevant charts
    if (department.toLowerCase().includes('revenue') || department.toLowerCase().includes('sales')) {
      setBarData(prev => simulateInvestmentImpact(department, amount, prev));
    } else {
      // Impact service distribution
      setPieData(prev => simulateInvestmentImpact(department, amount, prev));
      // Also impact business metrics
      setLineData(prev => simulateInvestmentImpact(department, amount, prev));
    }

    // Show impact notification
    setTimeout(() => {
      const impact = amount * 0.0004; // Simple impact calculation
      alert(`Investment Impact: $${amount.toLocaleString()} in ${department} 
        Projected quarterly revenue increase: +$${impact.toFixed(1)}M
        Estimated ROI: ${(investment.projectedROI * 100).toFixed(1)}%`);
    }, 1500);
  };

  const handleDataChange = (chartType: string, id: string, newValue: number) => {
    switch (chartType) {
      case 'bar':
        setBarData(prev => prev.map(item => 
          item.id === id ? { ...item, value: newValue } : item
        ));
        break;
      case 'pie':
        setPieData(prev => prev.map(item => 
          item.id === id ? { ...item, value: newValue } : item
        ));
        break;
      case 'line':
        setLineData(prev => prev.map(item => 
          item.id === id ? { ...item, value: newValue } : item
        ));
        break;
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetView = () => {
    // Reset all data to initial values
    setBarData([
      { id: 'q1', label: 'Q1 Revenue', value: 15.2, color: '#3b82f6', maxValue: 80 },
      { id: 'q2', label: 'Q2 Revenue', value: 25.8, color: '#10b981', maxValue: 80 },
      { id: 'q3', label: 'Q3 Revenue', value: 32.1, color: '#8b5cf6', maxValue: 80 },
      { id: 'q4', label: 'Q4 Revenue', value: 28.5, color: '#f59e0b', maxValue: 80 },
    ]);
    setPieData([
      { id: 'digital', label: 'Digital Transform', value: 35, color: '#3b82f6', maxValue: 100 },
      { id: 'cloud', label: 'Cloud Solutions', value: 25, color: '#8b5cf6', maxValue: 100 },
      { id: 'cybersecurity', label: 'Cybersecurity', value: 20, color: '#10b981', maxValue: 100 },
      { id: 'ai', label: 'AI & Data Analytics', value: 20, color: '#f59e0b', maxValue: 100 },
    ]);
    setLineData([
      { id: 'jan', label: 'Client Satisfaction', value: 85, color: '#3b82f6', maxValue: 100 },
      { id: 'feb', label: 'Market Share', value: 12, color: '#3b82f6', maxValue: 50 },
      { id: 'mar', label: 'Operational Efficiency', value: 78, color: '#3b82f6', maxValue: 100 },
      { id: 'apr', label: 'Innovation Index', value: 82, color: '#3b82f6', maxValue: 100 },
      { id: 'may', label: 'Revenue Growth', value: 15, color: '#3b82f6', maxValue: 50 },
    ]);
    setTotalInvestment(0);
    setInvestmentHistory([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${
            isFullscreen ? 'p-0' : ''
          }`}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative ${
              isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-4xl h-[600px]'
            }`}
          >
            {/* Controls */}
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={resetView}
                className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-colors"
                title="Reset View"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleFullscreen}
                className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-colors"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 z-10 bg-white/10 backdrop-blur-md rounded-lg p-3 text-white text-sm">
              <p className="font-medium mb-1">3D Chart Controls:</p>
              <ul className="text-xs space-y-1 opacity-80">
                <li>• Click on charts to increase values</li>
                <li>• Drag to rotate view</li>
                <li>• Scroll to zoom</li>
                <li>• Right-click + drag to pan</li>
              </ul>
            </div>

            {/* Data Summary */}
            <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-md rounded-lg p-3 text-white text-sm">
              <p className="font-medium mb-2">Live Data:</p>
              <div className="text-xs space-y-1">
                <div>Bar Total: {barData.reduce((sum, item) => sum + item.value, 0).toFixed(1)}M €</div>
                <div>Pie Total: {pieData.reduce((sum, item) => sum + item.value, 0)}%</div>
                <div>Line Avg: {Math.round(lineData.reduce((sum, item) => sum + item.value, 0) / lineData.length)}</div>
              </div>
            </div>

            {/* 3D Canvas */}
            <div className="w-full h-full">
              <Canvas
                camera={{ 
                  position: [8, 5, 12], 
                  fov: 60,
                  near: 0.1,
                  far: 1000
                }}
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e40af 100%)' }}
              >
                <Scene3D 
                  barData={barData}
                  pieData={pieData}
                  lineData={lineData}
                  onDataChange={handleDataChange}
                  onInvest={handleInvestment}
                />
              </Canvas>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Main Enhanced3DView Component - Multi-Sector Business Intelligence Hub
export default function Enhanced3DView({ isOpen, onClose }: Enhanced3DViewProps = { isOpen: true, onClose: () => {} }) {
  const [is3DChartsOpen, setIs3DChartsOpen] = useState(false);
  const [currentSector, setCurrentSector] = useState<string | null>(null);
  const [activeSector, setActiveSector] = useState<string>('simulation');

  const enterSector = (sectorId: string) => {
    setCurrentSector(sectorId);
    setActiveSector(sectorId);
  };

  const exitSector = () => {
    setCurrentSector(null);
    setActiveSector('simulation');
  };

  const renderSectorContent = () => {
    if (!currentSector) {
      // Main hub view with all sector portals
      return (
        <Suspense fallback={null}>
          <group>
            {SECTORS.map((sector) => (
              <SectorPortal
                key={sector.id}
                sector={sector}
                onEnter={enterSector}
                isActive={activeSector === sector.id}
              />
            ))}
            
            {/* Central Hub */}
            <mesh position={[0, 8, 0]}>
              <sphereGeometry args={[2, 32, 32]} />
              <meshStandardMaterial 
                color="#06b6d4" 
                emissive="#06b6d4" 
                emissiveIntensity={0.3}
                transparent 
                opacity={0.8}
              />
            </mesh>
            
            <Text
              position={[0, 12, 0]}
              fontSize={2}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              Talan Business Intelligence
            </Text>
            
            <Text
              position={[0, 10, 0]}
              fontSize={0.8}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
            >
              Navigate to any sector portal to explore
            </Text>

            {/* Navigation Instructions */}
            <Html position={[0, -8, 0]} transform>
              <div className="bg-black/80 text-white p-4 rounded-lg text-center">
                <h4 className="font-bold mb-2">Available Sectors</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {SECTORS.map((sector) => (
                    <div key={sector.id} className="p-2 bg-white/10 rounded">
                      {sector.name}
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-3 opacity-70">
                  Click on any portal above to enter that sector
                </p>
              </div>
            </Html>
          </group>
        </Suspense>
      );
    }

    // Render specific sector view
    switch (currentSector) {
      case 'simulation':
        return (
          <Suspense fallback={null}>
            <group>
              <Text
                position={[0, 8, 0]}
                fontSize={1.5}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                Investment Portfolio Simulator
              </Text>
              
              <Html position={[0, 4, 0]} transform>
                <div className="bg-black/80 text-white p-6 rounded-lg text-center min-w-[400px]">
                  <h3 className="text-xl font-bold mb-4">Interactive Investment Simulation</h3>
                  <p className="text-sm mb-4 opacity-80">
                    Advanced 3D investment simulation with AI-powered predictions and real-time market analysis.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setIs3DChartsOpen(true)}
                      className="w-full p-3 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                    >
                      Launch Interactive Charts
                    </button>
                    <button
                      onClick={exitSector}
                      className="w-full p-2 bg-gray-600 rounded hover:bg-gray-700 transition-colors"
                    >
                      Back to Hub
                    </button>
                  </div>
                </div>
              </Html>
            </group>
          </Suspense>
        );
      case 'competitive':
        return (
          <Suspense fallback={null}>
            <group>
              <CompetitiveLandscape />
              <Html position={[0, -12, 0]} transform>
                <button
                  onClick={exitSector}
                  className="p-3 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  ← Back to Hub
                </button>
              </Html>
            </group>
          </Suspense>
        );
      case 'opportunities':
        return (
          <Suspense fallback={null}>
            <group>
              <OpportunityRadar />
              <Html position={[0, -12, 0]} transform>
                <button
                  onClick={exitSector}
                  className="p-3 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  ← Back to Hub
                </button>
              </Html>
            </group>
          </Suspense>
        );
      case 'timeline':
        return (
          <Suspense fallback={null}>
            <group>
              <MarketTimeline />
              <Html position={[0, -12, 0]} transform>
                <button
                  onClick={exitSector}
                  className="p-3 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  ← Back to Hub
                </button>
              </Html>
            </group>
          </Suspense>
        );
      case 'geographic':
        return (
          <Suspense fallback={null}>
            <group>
              <GeographicMarketView />
              <Html position={[0, -15, 0]} transform>
                <button
                  onClick={exitSector}
                  className="p-3 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  ← Back to Hub
                </button>
              </Html>
            </group>
          </Suspense>
        );
      case 'agents':
        return (
          <Suspense fallback={null}>
            <group>
              <AgentNetwork />
              <Html position={[0, -12, 0]} transform>
                <button
                  onClick={exitSector}
                  className="p-3 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  ← Back to Hub
                </button>
              </Html>
            </group>
          </Suspense>
        );
      case 'scenarios':
        return (
          <Suspense fallback={null}>
            <group>
              <ScenarioPlanningRoom />
              <Html position={[0, -12, 0]} transform>
                <button
                  onClick={exitSector}
                  className="p-3 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  ← Back to Hub
                </button>
              </Html>
            </group>
          </Suspense>
        );
      default:
        return null;
    }
  };

  // If used as a modal/overlay
  if (isOpen === false) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-[600px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-xl overflow-hidden relative"
      >
        {/* Close button (only if onClose is provided) */}
        {onClose && (
          <div className="absolute top-4 right-4 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        )}

        {/* Sector Information Panel */}
        {currentSector && (
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-black/80 backdrop-blur-md rounded-lg p-3 text-white text-sm">
              <div className="font-medium">
                Current Sector: {SECTORS.find(s => s.id === currentSector)?.name}
              </div>
              <div className="text-xs opacity-70 mt-1">
                Use mouse to navigate • Click objects to interact
              </div>
            </div>
          </div>
        )}
        
        <Canvas camera={{ position: [0, 10, 20], fov: 75 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4f46e5" />
          <pointLight position={[0, 20, 0]} intensity={0.5} color="#06b6d4" />
          
          {renderSectorContent()}
          
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            maxDistance={60}
            minDistance={8}
          />
          <Stars radius={200} depth={100} count={8000} factor={6} saturation={0} fade />
        </Canvas>

        <InteractiveCharts3D 
          isOpen={is3DChartsOpen} 
          onClose={() => setIs3DChartsOpen(false)} 
        />
      </motion.div>
    </AnimatePresence>
  );
}
