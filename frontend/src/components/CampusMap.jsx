import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// SR University center coordinates
const SR_CENTER = [17.9812, 79.5315]

// Fix leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const makeIcon = (emoji, size = 36) => L.divIcon({
  html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${emoji}</div>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size],
  className: '',
})

export default function CampusMap({ graphData, routePath, runnerLocation, highlightNodes = [] }) {
  const mapRef = useRef(null)

  const nodes = graphData?.nodes || []
  const edges = graphData?.edges || []

  // Edge polylines
  const edgeLines = edges.map((e, i) => ({
    key: i,
    positions: [[e.from_lat, e.from_lon], [e.to_lat, e.to_lon]],
  }))

  // Route path polyline
  const routePositions = routePath?.map(n => [n.lat, n.lon]) || []

  return (
    <div className="map-container">
      <MapContainer
        center={SR_CENTER}
        zoom={17}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Campus road network edges */}
        {edgeLines.map(e => (
          <Polyline key={e.key} positions={e.positions}
            pathOptions={{ color: '#334155', weight: 3, opacity: 0.6 }} />
        ))}

        {/* Highlighted delivery route */}
        {routePositions.length > 1 && (
          <Polyline positions={routePositions}
            pathOptions={{ color: '#FF6B35', weight: 5, opacity: 0.9, dashArray: '10,5' }} />
        )}

        {/* Campus nodes */}
        {nodes.map(node => {
          const isHighlighted = highlightNodes.includes(node.id)
          const isRoute = routePath?.some(r => r.id === node.id)
          const icon = nodeIcon(node.id)
          return (
            <Marker key={node.id}
              position={[node.lat, node.lon]}
              icon={makeIcon(icon, isHighlighted ? 44 : 32)}>
              <Popup>
                <div style={{ background: '#111827', color: '#f1f5f9', padding: '8px', borderRadius: '8px', minWidth: '160px' }}>
                  <strong style={{ fontSize: '1rem' }}>{icon} {node.label}</strong>
                  <br />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{node.lat.toFixed(4)}, {node.lon.toFixed(4)}</span>
                  {isRoute && <div style={{ marginTop: '6px', color: '#FF6B35', fontSize: '0.8rem', fontWeight: 700 }}>📍 On delivery route</div>}
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Runner live location */}
        {runnerLocation && (
          <>
            <Marker position={runnerLocation} icon={makeIcon('🏃', 40)}>
              <Popup><strong>Runner Location</strong></Popup>
            </Marker>
            <Circle center={runnerLocation} radius={30}
              pathOptions={{ color: '#FF6B35', fillColor: '#FF6B35', fillOpacity: 0.15 }} />
          </>
        )}
      </MapContainer>
    </div>
  )
}

function nodeIcon(id) {
  const icons = {
    main_gate: '🚪', central_canteen: '🍽️', juice_center: '🧃',
    food_court_2: '🍱', block_a: '🏫', block_b: '🔬', block_c: '💼',
    library: '📚', hostel_boys: '🏠', hostel_girls: '🏠',
    sports_complex: '⚽', auditorium: '🎭', lab_block: '🧪', admin_block: '🏢',
  }
  return icons[id] || '📍'
}
