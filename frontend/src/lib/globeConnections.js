export const linkedPairs = [
  ['evt_wildfire_ca_2026_0418', 'evt_heatwave_es_2026_0418'],
  ['evt_typhoon_ph_2026_0417', 'evt_port_nl_2026_0418'],
  ['evt_quake_jp_2026_0418', 'evt_transit_uk_2026_0418'],
  ['evt_port_nl_2026_0418', 'evt_transit_uk_2026_0418'],
  ['evt_typhoon_ph_2026_0417', 'evt_quake_jp_2026_0418'],
]

export const getConnectedEventIds = (eventId) => {
  const related = new Set([eventId])

  linkedPairs.forEach(([startId, endId]) => {
    if (startId === eventId) related.add(endId)
    if (endId === eventId) related.add(startId)
  })

  return related
}
