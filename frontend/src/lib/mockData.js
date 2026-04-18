const detailMap = {
  evt_wildfire_ca_2026_0418: {
    id: 'evt_wildfire_ca_2026_0418',
    title: 'Rapid-spread wildfire near Big Sur, CA',
    category: 'wildfire',
    severity: 'critical',
    lat: 36.2704,
    lng: -121.8081,
    location: 'Big Sur, California, USA',
    region: 'North America',
    countryCode: 'US',
    startedAt: '2026-04-18T14:22:00Z',
    updatedAt: '2026-04-18T18:41:00Z',
    sourcesCount: 14,
    previewImage: 'https://images.unsplash.com/photo-1602496339024-47a6c3fd3fd2?auto=format&fit=crop&w=1400&q=80',
    previewText:
      'A fast-moving wildfire has forced evacuations along Highway 1 as crews battle 40 mph winds and steep terrain.',
    tags: ['Wildfire', 'Evacuation', 'CA', 'Infrastructure'],
    aiSummary:
      'A wildfire that ignited in coastal scrub above Palo Colorado Canyon at 14:22 UTC expanded rapidly through mixed brush and timber during the afternoon burn period, reaching an estimated 2,400 acres in under four hours. Incident notes point to sustained onshore winds between 25 and 40 mph, low fuel moisture, and repeated spot fires throwing embers across containment lines near the Highway 1 corridor. Cal Fire and Monterey County officials have issued three mandatory evacuation zones and two warning zones, with vehicle traffic being directed north toward Carmel Highlands while southbound access remains closed. Ground crews are prioritizing structure defense around ridge-top homes and communications infrastructure, while fixed-wing support has been intermittent because of smoke columns and crosswinds. The immediate operational risk is less about total acreage than directional spread: if winds veer more northerly after sunset, the fire could run parallel to the highway and complicate night operations. Secondary impacts already include power shutoffs, degraded mobile coverage, and growing smoke transport into the Salinas Valley. For decision-makers, this is now a corridor-disruption event, not just a fire perimeter story.',
    impacts: {
      people: {
        headline: '~3,200 residents in evacuation zones',
        detail:
          'Three mandatory and two warning zones are active. Shelters opened at Carmel Middle School and Monterey Fairgrounds, with animal intake support standing by.',
      },
      infrastructure: {
        headline: 'Highway 1 closed in both directions',
        detail:
          'Closures stretch from Carmel Highlands to Lucia. Public safety power shutoffs affect roughly 8,400 PG&E customers, and telecom redundancy is degraded in canyon pockets.',
      },
      markets: {
        headline: 'Tourism and agriculture face weekend hit',
        detail:
          'Big Sur hospitality bookings are at risk through the weekend, and specialty growers in the inland corridor may see logistics disruption even without direct fire damage.',
      },
    },
    sources: [
      {
        id: 's1',
        outlet: 'Reuters',
        title: 'Crews battle wind-driven Big Sur blaze as evacuations widen',
        url: 'https://www.reuters.com/world/us/crews-battle-wind-driven-big-sur-blaze-2026-04-18/',
        publishedAt: '2026-04-18T17:10:00Z',
        favicon: 'https://www.reuters.com/favicon.ico',
      },
      {
        id: 's2',
        outlet: 'KSBW',
        title: 'Highway 1 shut as fire jumps ridge near Palo Colorado',
        url: 'https://www.ksbw.com/article/highway-1-shut-fire-palo-colorado/20260418',
        publishedAt: '2026-04-18T18:02:00Z',
        favicon: 'https://www.ksbw.com/favicon.ico',
      },
      {
        id: 's3',
        outlet: 'Cal Fire',
        title: 'Incident update: Palo Colorado Fire operational briefing',
        url: 'https://www.fire.ca.gov/incidents/2026/4/18/palo-colorado-fire/',
        publishedAt: '2026-04-18T18:30:00Z',
        favicon: 'https://www.fire.ca.gov/favicon.ico',
      },
      {
        id: 's4',
        outlet: 'Monterey County',
        title: 'Emergency alert expands mandatory evacuation footprint',
        url: 'https://www.co.monterey.ca.us/Home/Components/News/News/20260418',
        publishedAt: '2026-04-18T18:08:00Z',
        favicon: 'https://www.co.monterey.ca.us/favicon.ico',
      },
      {
        id: 's5',
        outlet: 'NWS Bay Area',
        title: 'Red Flag Warning remains in effect for Monterey County',
        url: 'https://www.weather.gov/mtr/redflag0418',
        publishedAt: '2026-04-18T16:44:00Z',
        favicon: 'https://www.weather.gov/favicon.ico',
      },
    ],
    whatToWatch: [
      'Wind shift expected after 22:00 UTC may push the fire toward the Highway 1 corridor.',
      'Red Flag Warning remains active for Monterey County through Saturday evening.',
      'Air quality alerts may expand into the Salinas Valley by the morning commute.',
    ],
    howToHelp: [
      { label: 'American Red Cross — Central Coast', url: 'https://www.redcross.org/' },
      { label: 'Monterey County SPCA evacuation support', url: 'https://www.spcamc.org/' },
      { label: 'Cal Fire evacuation map', url: 'https://www.fire.ca.gov/' },
    ],
  },
  evt_typhoon_ph_2026_0417: {
    id: 'evt_typhoon_ph_2026_0417',
    title: 'Typhoon Hainan tracks toward Luzon shipping lanes',
    category: 'storm',
    severity: 'high',
    lat: 14.5995,
    lng: 120.9842,
    location: 'Manila, Philippines',
    region: 'Southeast Asia',
    countryCode: 'PH',
    startedAt: '2026-04-17T08:15:00Z',
    updatedAt: '2026-04-18T17:54:00Z',
    sourcesCount: 11,
    previewImage: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80',
    previewText:
      'Authorities are preparing coastal evacuations as Typhoon Hainan strengthens east of Luzon and pushes rain bands toward Manila.',
    tags: ['Storm', 'Logistics', 'Luzon', 'Coastal'],
    aiSummary:
      'Typhoon Hainan has strengthened steadily over the Philippine Sea and is now being treated as a dual-risk event for Luzon: damaging rain and wind onshore, plus meaningful disruption to regional shipping approaches before landfall. Forecast cones still show some spread, but consensus tracks have narrowed toward a northern Luzon graze or crossing, which would expose dense coastal communities and industrial logistics corridors to prolonged rainfall. Emergency managers in Metro Manila are not yet dealing with the core of the storm, but they are already pre-positioning pumps, suspending some small-craft operations, and identifying low-lying barangays that could flood quickly if feeder bands stall overnight. The economic sensitivity sits in the overlap between weather and movement. Port operations, domestic ferries, and road freight into urban demand centers may all slow simultaneously, raising the odds of temporary food and fuel bottlenecks even without catastrophic structural damage. The immediate analytic question is not simply whether the storm intensifies again, but how fast protective shutdowns begin. Once operators start pulling vessels, cranes, and inter-island routes offline, recovery timelines tend to stretch beyond the official weather window.',
    impacts: {
      people: {
        headline: 'Flood exposure building across low-lying districts',
        detail:
          'Barangay officials are staging pre-evacuation notifications in flood-prone neighborhoods north of Manila and along the Pampanga river basin.',
      },
      infrastructure: {
        headline: 'Port and ferry slowdowns likely within 12 hours',
        detail:
          'Small-craft advisories are already limiting inter-island traffic. Container throughput may taper if crane operations pause ahead of the strongest bands.',
      },
      markets: {
        headline: 'Supply timing risk for fuel and staples',
        detail:
          'Short-duration delays in import handling could tighten delivery windows for food distributors and industrial users even if inventories remain sufficient overall.',
      },
    },
    sources: [
      {
        id: 's1',
        outlet: 'Reuters',
        title: 'Philippines braces for Typhoon Hainan as shipping routes tighten',
        url: 'https://www.reuters.com/world/asia-pacific/philippines-braces-typhoon-hainan-2026-04-18/',
        publishedAt: '2026-04-18T16:28:00Z',
        favicon: 'https://www.reuters.com/favicon.ico',
      },
      {
        id: 's2',
        outlet: 'PAGASA',
        title: 'Severe weather bulletin: Typhoon Hainan',
        url: 'https://bagong.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin',
        publishedAt: '2026-04-18T17:40:00Z',
        favicon: 'https://bagong.pagasa.dost.gov.ph/favicon.ico',
      },
      {
        id: 's3',
        outlet: 'ABS-CBN',
        title: 'Classes suspended in several Luzon provinces ahead of typhoon',
        url: 'https://news.abs-cbn.com/news/04/18/26/classes-suspended-typhoon-hainan',
        publishedAt: '2026-04-18T15:44:00Z',
        favicon: 'https://news.abs-cbn.com/favicon.ico',
      },
      {
        id: 's4',
        outlet: 'Philippine Coast Guard',
        title: 'Small-craft movement restricted in eastern approaches',
        url: 'https://coastguard.gov.ph/',
        publishedAt: '2026-04-18T14:58:00Z',
        favicon: 'https://coastguard.gov.ph/favicon.ico',
      },
    ],
    whatToWatch: [
      'Any southward jog in the forecast cone would materially raise flood risk around Metro Manila.',
      'Port precautionary shutdowns are the earliest signal of wider logistics drag.',
      'Rainfall totals, not just peak wind, will determine the urban disruption footprint.',
    ],
    howToHelp: [
      { label: 'Philippine Red Cross', url: 'https://redcross.org.ph/' },
      { label: 'NDRRMC advisory portal', url: 'https://ndrrmc.gov.ph/' },
      { label: 'PAGASA track and rainfall updates', url: 'https://bagong.pagasa.dost.gov.ph/' },
    ],
  },
  evt_port_nl_2026_0418: {
    id: 'evt_port_nl_2026_0418',
    title: 'Port of Rotterdam slows traffic after chemical berth incident',
    category: 'port',
    severity: 'moderate',
    lat: 51.9225,
    lng: 4.47917,
    location: 'Rotterdam, Netherlands',
    region: 'Europe',
    countryCode: 'NL',
    startedAt: '2026-04-18T05:42:00Z',
    updatedAt: '2026-04-18T17:22:00Z',
    sourcesCount: 9,
    previewImage: 'https://images.unsplash.com/photo-1563299796-17596ed6b017?auto=format&fit=crop&w=1400&q=80',
    previewText:
      'A localized berth incident is forcing vessel sequencing changes at Europe’s busiest port, extending wait times for tankers and feeders.',
    tags: ['Port', 'Shipping', 'Europe', 'Chemicals'],
    aiSummary:
      'The Port of Rotterdam is operating under a controlled slowdown after a morning safety incident at a chemical berth prompted inspections, tug reassignment, and temporary limits on adjacent vessel movement. Port authorities have not described the event as a major release, but they are treating it as enough of a safety and traffic-management problem to re-sequence incoming traffic across part of the harbor. That matters because Rotterdam is not just another port node; it is a synchronization point for container feeders, tankers, and inland barge transfers serving a broad stretch of European industry. The present picture is not one of systemic closure, yet even a partial berth disruption can ripple through berth windows, customs timing, and hinterland rail schedules by late day. Traders and operators will watch dwell times more closely than headline statements. If the inspection zone stays narrow, delays should remain measured in hours. If adjacent berths or navigation channels are pulled into the safety perimeter, the event could become a weekend backlog story that affects petrochemical deliveries and feeder reliability into Germany and Belgium. Watch operational notices, not just incident language, for the clearest signal.',
    impacts: {
      people: {
        headline: 'Worker access tightened around affected berth',
        detail:
          'Non-essential staff movement has been restricted in the immediate berth area while inspections and ventilation checks continue.',
      },
      infrastructure: {
        headline: 'Selective vessel sequencing and berth reassignment',
        detail:
          'Tankers and feeder ships are seeing longer approach windows as pilots and tugs are shifted to support the inspection zone.',
      },
      markets: {
        headline: 'Petrochemical and feeder schedules mildly exposed',
        detail:
          'The most likely commercial impact is timing slippage rather than volume loss, though weekend spillover would raise costs for just-in-time cargoes.',
      },
    },
    sources: [
      {
        id: 's1',
        outlet: 'Port of Rotterdam',
        title: 'Operational update on berth access and vessel sequencing',
        url: 'https://www.portofrotterdam.com/en/news-and-press-releases',
        publishedAt: '2026-04-18T15:55:00Z',
        favicon: 'https://www.portofrotterdam.com/favicon.ico',
      },
      {
        id: 's2',
        outlet: 'Bloomberg',
        title: 'Rotterdam berth incident slows tanker movements in Europe hub',
        url: 'https://www.bloomberg.com/news/articles/2026-04-18/rotterdam-berth-incident-slows-tanker-movements',
        publishedAt: '2026-04-18T16:10:00Z',
        favicon: 'https://www.bloomberg.com/favicon.ico',
      },
      {
        id: 's3',
        outlet: 'Lloyd’s List',
        title: 'Harbor operations trim capacity after safety response',
        url: 'https://lloydslist.com/',
        publishedAt: '2026-04-18T14:48:00Z',
        favicon: 'https://lloydslist.com/favicon.ico',
      },
      {
        id: 's4',
        outlet: 'NOS',
        title: 'Partial access restrictions remain in Rotterdam port zone',
        url: 'https://nos.nl/',
        publishedAt: '2026-04-18T13:44:00Z',
        favicon: 'https://nos.nl/favicon.ico',
      },
    ],
    whatToWatch: [
      'Tug and pilot allocation updates will signal whether this remains a localized delay.',
      'Weekend berth windows for chemical tankers are the clearest commercial pressure point.',
      'Any shift from “restricted” to “closed” language would materially change the risk profile.',
    ],
    howToHelp: [
      { label: 'Port of Rotterdam notices', url: 'https://www.portofrotterdam.com/' },
      { label: 'Dutch emergency updates', url: 'https://www.government.nl/' },
      { label: 'MarineTraffic vessel view', url: 'https://www.marinetraffic.com/' },
    ],
  },
  evt_quake_jp_2026_0418: {
    id: 'evt_quake_jp_2026_0418',
    title: 'M6.1 earthquake recorded off northeast Japan',
    category: 'earthquake',
    severity: 'high',
    lat: 38.3,
    lng: 141.6,
    location: 'Offshore Miyagi, Japan',
    region: 'East Asia',
    countryCode: 'JP',
    startedAt: '2026-04-18T03:11:00Z',
    updatedAt: '2026-04-18T16:09:00Z',
    sourcesCount: 10,
    previewImage: 'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1400&q=80',
    previewText:
      'A strong offshore quake shook northern Honshu, triggering transport inspections and brief coastal advisories.',
    tags: ['Earthquake', 'Japan', 'Transit', 'Inspection'],
    aiSummary:
      'A magnitude 6.1 earthquake struck offshore northeast Japan early in the local day, generating noticeable shaking across parts of Miyagi, Iwate, and Fukushima prefectures and triggering the familiar cascade of rail checks, industrial safety confirmations, and coastal advisories. Initial agency updates indicate no destructive tsunami, which materially lowers the upper bound of the event, but the operational disruption picture is still significant because Japan’s response system is intentionally conservative. High-speed rail operators, utilities, and major manufacturers routinely pause to inspect systems after even moderate offshore shaking, which means the near-term effect is often a burst of verification rather than visible damage. For analysts, that distinction matters. The event is less likely to evolve into a mass-casualty emergency and more likely to become a productivity and movement story if aftershocks continue or if any facility reports abnormalities. The strongest secondary risk remains infrastructure confidence: a single substation fault, rail line inspection finding, or refinery anomaly could extend consequences beyond the seismic headline. The immediate read is contained but not closed. Expect a disciplined sequence of status updates from transport, utilities, and coastal operators over the next several hours before the disruption picture fully settles.',
    impacts: {
      people: {
        headline: 'Strong shaking felt across northern Honshu',
        detail:
          'Authorities report minor injuries and precautionary building evacuations, but no broad casualty picture has emerged.',
      },
      infrastructure: {
        headline: 'Rail and industrial inspections under way',
        detail:
          'Segments of regional rail service paused for checks, while utilities and plant operators are validating structural and electrical systems.',
      },
      markets: {
        headline: 'Manufacturing continuity is the main watchpoint',
        detail:
          'The near-term market sensitivity is concentrated in production delays if aftershocks or inspection findings interrupt supply chains tied to autos and electronics.',
      },
    },
    sources: [
      {
        id: 's1',
        outlet: 'NHK',
        title: 'Strong offshore quake prompts inspections across northeast Japan',
        url: 'https://www3.nhk.or.jp/news/',
        publishedAt: '2026-04-18T15:21:00Z',
        favicon: 'https://www3.nhk.or.jp/favicon.ico',
      },
      {
        id: 's2',
        outlet: 'JMA',
        title: 'Earthquake information bulletin for offshore Miyagi event',
        url: 'https://www.jma.go.jp/jma/indexe.html',
        publishedAt: '2026-04-18T15:44:00Z',
        favicon: 'https://www.jma.go.jp/favicon.ico',
      },
      {
        id: 's3',
        outlet: 'Reuters',
        title: 'Japan train operators inspect lines after M6.1 offshore quake',
        url: 'https://www.reuters.com/world/asia-pacific/japan-quake-inspections-2026-04-18/',
        publishedAt: '2026-04-18T14:55:00Z',
        favicon: 'https://www.reuters.com/favicon.ico',
      },
      {
        id: 's4',
        outlet: 'Kyodo',
        title: 'No major damage reported after offshore tremor',
        url: 'https://english.kyodonews.net/',
        publishedAt: '2026-04-18T13:41:00Z',
        favicon: 'https://english.kyodonews.net/favicon.ico',
      },
    ],
    whatToWatch: [
      'Aftershock frequency will determine how quickly rail operators fully normalize service.',
      'Utility inspection summaries are more decision-useful than initial shaking maps at this stage.',
      'Any refinery or manufacturing anomaly would change the event from local disruption to supply-chain issue.',
    ],
    howToHelp: [
      { label: 'Japan Red Cross Society', url: 'https://www.jrc.or.jp/english/' },
      { label: 'JMA earthquake updates', url: 'https://www.jma.go.jp/' },
      { label: 'Cabinet Office disaster portal', url: 'https://www.bousai.go.jp/' },
    ],
  },
  evt_transit_uk_2026_0418: {
    id: 'evt_transit_uk_2026_0418',
    title: 'Signal fault stalls multiple London Underground lines',
    category: 'transit',
    severity: 'moderate',
    lat: 51.5074,
    lng: -0.1278,
    location: 'London, United Kingdom',
    region: 'Europe',
    countryCode: 'GB',
    startedAt: '2026-04-18T11:06:00Z',
    updatedAt: '2026-04-18T18:12:00Z',
    sourcesCount: 8,
    previewImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1400&q=80',
    previewText:
      'A networked signaling fault has stretched into the evening commute, forcing service suspensions and crowding across central London routes.',
    tags: ['Transit', 'Commuting', 'London', 'Signal Fault'],
    aiSummary:
      'London’s Underground network is dealing with a prolonged signaling problem that has spread beyond a single line failure into a broader network-coordination issue for the evening commute. Transport for London has been able to keep parts of the system moving, but the visible impact is a familiar urban cascade: line suspensions, platform crowding, and passenger re-routing pressure spilling onto buses, commuter rail, and ride-hail demand. What makes this more than a routine service advisory is duration. Once a signal fault survives through multiple service cycles and intersects with rush-hour density, the operational burden shifts from fixing a component to managing the city’s movement around it. That introduces second-order effects, including slower emergency vehicle movement in central corridors, delayed worker arrivals at major stations, and increased passenger density in already constrained interchange nodes. For business users, the story is not revenue shock but productivity drag and reliability loss. If resolution slips deeper into the night, downstream concerns include train positioning for tomorrow’s morning peak and higher overtime requirements for operators. The most useful indicator now is not the initial fault description but whether the disruption bulletin begins expanding to additional lines or stays bounded to a core control zone.',
    impacts: {
      people: {
        headline: 'Commuter crowding is the primary immediate risk',
        detail:
          'Passenger density has climbed at major interchange stations, with travel times extending across bus and overground alternatives.',
      },
      infrastructure: {
        headline: 'Control-room issue affecting multiple line segments',
        detail:
          'TfL has not described physical damage, pointing instead to signaling and service-positioning constraints across central corridors.',
      },
      markets: {
        headline: 'City-center productivity drag through evening',
        detail:
          'The main economic effect is labor and travel-time inefficiency, especially for retail, hospitality, and shift-based services.',
      },
    },
    sources: [
      {
        id: 's1',
        outlet: 'TfL',
        title: 'Service update: severe delays and suspensions on multiple lines',
        url: 'https://tfl.gov.uk/tube-dlr-overground/status/',
        publishedAt: '2026-04-18T17:48:00Z',
        favicon: 'https://tfl.gov.uk/favicon.ico',
      },
      {
        id: 's2',
        outlet: 'BBC',
        title: 'London Underground disruption stretches into evening commute',
        url: 'https://www.bbc.com/news/uk-england-london-20260418',
        publishedAt: '2026-04-18T16:58:00Z',
        favicon: 'https://www.bbc.com/favicon.ico',
      },
      {
        id: 's3',
        outlet: 'Evening Standard',
        title: 'Signal fault leaves commuters stranded across central London',
        url: 'https://www.standard.co.uk/news/transport/',
        publishedAt: '2026-04-18T17:22:00Z',
        favicon: 'https://www.standard.co.uk/favicon.ico',
      },
      {
        id: 's4',
        outlet: 'Citymapper',
        title: 'Live routing shifts as Tube suspensions persist',
        url: 'https://citymapper.com/news/',
        publishedAt: '2026-04-18T17:05:00Z',
        favicon: 'https://citymapper.com/favicon.ico',
      },
    ],
    whatToWatch: [
      'Whether disruption remains bounded to signal control or spreads to train-positioning for the morning peak.',
      'Crowding levels at major interchanges are a more immediate risk than train frequency alone.',
      'Late-night engineering notices will hint at whether service fully normalizes overnight.',
    ],
    howToHelp: [
      { label: 'TfL live service map', url: 'https://tfl.gov.uk/' },
      { label: 'National Rail updates', url: 'https://www.nationalrail.co.uk/' },
      { label: 'London emergency travel guidance', url: 'https://www.london.gov.uk/' },
    ],
  },
  evt_heatwave_es_2026_0418: {
    id: 'evt_heatwave_es_2026_0418',
    title: 'Early-season heat advisory expands across Madrid region',
    category: 'weather',
    severity: 'moderate',
    lat: 40.4168,
    lng: -3.7038,
    location: 'Madrid, Spain',
    region: 'Southern Europe',
    countryCode: 'ES',
    startedAt: '2026-04-18T09:35:00Z',
    updatedAt: '2026-04-18T16:33:00Z',
    sourcesCount: 7,
    previewImage: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80',
    previewText:
      'Meteorologists have issued an unusual April heat advisory as Madrid heads toward temperatures more typical of early summer.',
    tags: ['Heatwave', 'Weather', 'Europe', 'Power Demand'],
    aiSummary:
      'An unusual early-season heat event is developing across central Spain, with Madrid expected to push well above normal April temperatures and remain elevated long enough to trigger health advisories, power-demand concerns, and operational stress on outdoor work schedules. This is not the kind of heatwave that headlines itself through dramatic imagery on day one, yet it matters because timing amplifies vulnerability. Households, municipal services, and employers are not fully transitioned into summer operating patterns, which means cooling readiness, hydration behavior, and labor protections can lag behind meteorological reality. The public-health risk is still manageable, but it climbs sharply if overnight lows stay high and if advisory language expands to include sensitive populations. For infrastructure, the watchpoint is electricity demand and localized transport strain, especially if rail assets and road surfaces see sustained peak temperatures earlier than expected in the season. Markets are more indirectly exposed through utilities, agriculture, and consumption shifts rather than acute shutdowns. The right frame is mounting stress, not sudden disaster. Analysts should watch whether this remains a short, isolated spike or becomes part of a broader European early-heat pattern that compounds water, fire, and tourism concerns over the coming weeks.',
    impacts: {
      people: {
        headline: 'Heat exposure rising for elderly and outdoor workers',
        detail:
          'Local advisories focus on hydration, shade access, and midday exposure reduction for seniors, children, and construction crews.',
      },
      infrastructure: {
        headline: 'Power demand and transit wear are key watchpoints',
        detail:
          'Cooling demand is expected to rise, while early-season thermal stress may affect rail maintenance schedules and urban operations.',
      },
      markets: {
        headline: 'Utilities and agriculture carry the main sensitivity',
        detail:
          'Near-term market effects are tied to electricity load, water usage, and crop stress rather than any immediate citywide shutdown.',
      },
    },
    sources: [
      {
        id: 's1',
        outlet: 'AEMET',
        title: 'Heat advisory extends across Comunidad de Madrid',
        url: 'https://www.aemet.es/en/portada',
        publishedAt: '2026-04-18T15:30:00Z',
        favicon: 'https://www.aemet.es/favicon.ico',
      },
      {
        id: 's2',
        outlet: 'El País',
        title: 'Madrid faces unusual April heat as temperatures surge',
        url: 'https://english.elpais.com/',
        publishedAt: '2026-04-18T14:58:00Z',
        favicon: 'https://english.elpais.com/favicon.ico',
      },
      {
        id: 's3',
        outlet: 'Reuters',
        title: 'Early heat raises concerns across central Spain',
        url: 'https://www.reuters.com/world/europe/spain-heat-2026-04-18/',
        publishedAt: '2026-04-18T14:12:00Z',
        favicon: 'https://www.reuters.com/favicon.ico',
      },
    ],
    whatToWatch: [
      'Overnight temperatures will determine whether health risk meaningfully compounds.',
      'Any extension beyond Madrid into a wider Iberian pattern would raise water and fire concern.',
      'Power-demand curves are the best early signal of infrastructure stress.',
    ],
    howToHelp: [
      { label: 'Spanish Red Cross', url: 'https://www2.cruzroja.es/' },
      { label: 'AEMET heat alerts', url: 'https://www.aemet.es/' },
      { label: 'Madrid emergency guidance', url: 'https://www.madrid.es/' },
    ],
  },
  evt_protest_ar_2026_0418: {
    id: 'evt_protest_ar_2026_0418',
    title: 'Labor march builds near central Buenos Aires corridors',
    category: 'protest',
    severity: 'low',
    lat: -34.6037,
    lng: -58.3816,
    location: 'Buenos Aires, Argentina',
    region: 'South America',
    countryCode: 'AR',
    startedAt: '2026-04-18T12:48:00Z',
    updatedAt: '2026-04-18T18:05:00Z',
    sourcesCount: 6,
    previewImage: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1400&q=80',
    previewText:
      'A labor-backed march is expected to slow traffic around government buildings, with a peaceful but disruptive footprint.',
    tags: ['Protest', 'Labor', 'Traffic', 'Civic'],
    aiSummary:
      'A coordinated labor march is building across central Buenos Aires, with organizers consolidating near government corridors and transport hubs ahead of an afternoon demonstration focused on wage pressure and public-sector policy. At present, officials are describing the march as largely peaceful, and there are no strong indicators of escalation into widespread disorder. That keeps the event in a lower severity band, but it still matters for movement, public safety posture, and the optics of state response. In dense urban settings, even peaceful demonstrations can generate significant corridor disruption when organizers converge near ministries, arterial roads, and transit interchange points. The likely short-term impact is concentrated in travel reliability, business access, and heightened police visibility rather than physical damage. Markets are only indirectly exposed, mainly through perception and any spillover into transport schedules or government operations. The key analytic variable is crowd behavior at chokepoints. If police cordons hold and organizers retain discipline, the event should remain a manageable urban-disruption story. If secondary groups form near transit entrances or if dispersal is delayed into the evening, the city could see a wider footprint of slowdowns and minor clashes. For now, the posture is watchful, not alarmed.',
    impacts: {
      people: {
        headline: 'Pedestrian density and traffic friction near civic core',
        detail:
          'The highest public-safety concern is crowd movement around road crossings and transit exits, rather than violence or broad unrest.',
      },
      infrastructure: {
        headline: 'Temporary traffic reroutes in central districts',
        detail:
          'Road closures and bus diversions are the main operational effect, with limited impact expected outside the downtown corridor.',
      },
      markets: {
        headline: 'Minimal direct market impact expected',
        detail:
          'Economic relevance is mostly symbolic unless turnout expands or the march delays formal government activity into the next day.',
      },
    },
    sources: [
      {
        id: 's1',
        outlet: 'La Nación',
        title: 'March organizers announce route through central Buenos Aires',
        url: 'https://www.lanacion.com.ar/',
        publishedAt: '2026-04-18T16:40:00Z',
        favicon: 'https://www.lanacion.com.ar/favicon.ico',
      },
      {
        id: 's2',
        outlet: 'Buenos Aires City',
        title: 'Traffic advisory issued for afternoon demonstration',
        url: 'https://buenosaires.gob.ar/',
        publishedAt: '2026-04-18T15:52:00Z',
        favicon: 'https://buenosaires.gob.ar/favicon.ico',
      },
      {
        id: 's3',
        outlet: 'Clarín',
        title: 'Transit riders warned of downtown delays during labor march',
        url: 'https://www.clarin.com/',
        publishedAt: '2026-04-18T15:14:00Z',
        favicon: 'https://www.clarin.com/favicon.ico',
      },
    ],
    whatToWatch: [
      'Transit entrance blockages would matter more than total crowd size.',
      'Police posture near government buildings will shape whether the event stays low-risk.',
      'Evening dispersal timing is the clearest sign of whether disruption widens.',
    ],
    howToHelp: [
      { label: 'Buenos Aires traffic updates', url: 'https://buenosaires.gob.ar/' },
      { label: 'SAME emergency guidance', url: 'https://www.buenosaires.gob.ar/salud/same' },
      { label: 'Local transit service alerts', url: 'https://www.emova.com.ar/' },
    ],
  },
  evt_culture_de_2026_0418: {
    id: 'evt_culture_de_2026_0418',
    title: 'Major Berlin concert canceled after venue power issue',
    category: 'culture',
    severity: 'low',
    lat: 52.52,
    lng: 13.405,
    location: 'Berlin, Germany',
    region: 'Europe',
    countryCode: 'DE',
    startedAt: '2026-04-18T10:18:00Z',
    updatedAt: '2026-04-18T17:18:00Z',
    sourcesCount: 5,
    previewImage: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=80',
    previewText:
      'A sold-out arena show has been canceled after a backstage electrical fault forced venue operators to halt load-in and audience entry.',
    tags: ['Culture', 'Venue', 'Power', 'Crowds'],
    aiSummary:
      'A sold-out arena concert in Berlin has been canceled after venue operators reported a power-system fault affecting backstage services and audience entry controls. By crisis standards this is a lower-severity event, but it still has the ingredients of a modern live-operations disruption: large crowds, emotionally charged attendees, constrained transport windows, and reputational exposure for organizers. Officials have emphasized that the decision was precautionary, suggesting the issue is rooted in reliability and safety certification rather than an active fire or structural failure. That matters because the operational challenge is now crowd dispersal and customer handling, not incident response alone. Thousands of attendees may converge on refund desks, rideshare pickup points, and transit nodes at once, creating a short but visible pressure spike around the venue. Secondary effects are limited, though nearby hospitality and transport services can see immediate demand swings. The main business sensitivity is reputational and financial, especially if the cancellation comes late enough that fans were already en route or inside queuing zones. Watch for whether organizers announce a rapid reschedule, because that would signal the problem is bounded to a single equipment fault rather than a deeper venue systems issue.',
    impacts: {
      people: {
        headline: 'Crowd dispersal and refund communication are immediate priorities',
        detail:
          'Thousands of attendees are being redirected with limited notice, raising pressure on transport and customer-service channels.',
      },
      infrastructure: {
        headline: 'Venue power fault halted entry systems and production load-in',
        detail:
          'The issue appears localized to arena electrical infrastructure, but safety sign-off has not yet been restored.',
      },
      markets: {
        headline: 'Low macro impact, moderate event-business exposure',
        detail:
          'The main commercial effect sits with promoters, ticketing support, and nearby hospitality, not broader city systems.',
      },
    },
    sources: [
      {
        id: 's1',
        outlet: 'Tagesspiegel',
        title: 'Berlin arena show canceled after technical power problem',
        url: 'https://www.tagesspiegel.de/',
        publishedAt: '2026-04-18T16:20:00Z',
        favicon: 'https://www.tagesspiegel.de/favicon.ico',
      },
      {
        id: 's2',
        outlet: 'Venue Statement',
        title: 'Event organizers confirm cancellation and ticket guidance',
        url: 'https://www.mercedes-benz-arena-berlin.de/en/',
        publishedAt: '2026-04-18T16:48:00Z',
        favicon: 'https://www.mercedes-benz-arena-berlin.de/favicon.ico',
      },
      {
        id: 's3',
        outlet: 'RBB',
        title: 'Transport monitors crowd dispersal after concert cancellation',
        url: 'https://www.rbb24.de/',
        publishedAt: '2026-04-18T15:36:00Z',
        favicon: 'https://www.rbb24.de/favicon.ico',
      },
    ],
    whatToWatch: [
      'A quick reschedule announcement would suggest the issue is narrow and repairable.',
      'Transit crowding around the venue is a bigger immediate concern than the power fault itself.',
      'Any mention of broader electrical inspections would widen the operational significance.',
    ],
    howToHelp: [
      { label: 'Venue update page', url: 'https://www.mercedes-benz-arena-berlin.de/' },
      { label: 'BVG transit updates', url: 'https://www.bvg.de/en' },
      { label: 'Berlin emergency services', url: 'https://www.berlin.de/' },
    ],
  },
}

const stripDetails = ({
  aiSummary,
  impacts,
  sources,
  whatToWatch,
  howToHelp,
  tags,
  region,
  ...event
}) => event

export const events = Object.values(detailMap).map(stripDetails)

export const eventDetail = (id) => detailMap[id] ?? detailMap.evt_wildfire_ca_2026_0418

export const trending = [
  {
    id: 'tr_01',
    title: 'Evacuations widen as Big Sur fire pushes toward Highway 1',
    outlet: 'Reuters',
    location: 'California, USA',
    publishedAt: '2026-04-18T18:12:00Z',
    image: detailMap.evt_wildfire_ca_2026_0418.previewImage,
    previewText: 'Crews are racing gusty winds while traffic is redirected north out of the corridor.',
    eventId: 'evt_wildfire_ca_2026_0418',
  },
  {
    id: 'tr_02',
    title: 'PAGASA warns of stronger rain bands ahead of Typhoon Hainan',
    outlet: 'PAGASA',
    location: 'Luzon, Philippines',
    publishedAt: '2026-04-18T17:40:00Z',
    image: detailMap.evt_typhoon_ph_2026_0417.previewImage,
    previewText: 'Coastal towns and ferry operators are shifting to readiness posture as the storm nears.',
    eventId: 'evt_typhoon_ph_2026_0417',
  },
  {
    id: 'tr_03',
    title: 'Rotterdam operators re-sequence vessel arrivals after berth response',
    outlet: 'Bloomberg',
    location: 'Rotterdam, Netherlands',
    publishedAt: '2026-04-18T16:10:00Z',
    image: detailMap.evt_port_nl_2026_0418.previewImage,
    previewText: 'The slowdown remains partial, but tanker and feeder timings are slipping into evening windows.',
    eventId: 'evt_port_nl_2026_0418',
  },
  {
    id: 'tr_04',
    title: 'Northern Honshu rail checks continue after offshore quake',
    outlet: 'NHK',
    location: 'Miyagi, Japan',
    publishedAt: '2026-04-18T15:21:00Z',
    image: detailMap.evt_quake_jp_2026_0418.previewImage,
    previewText: 'No major damage has been confirmed, but inspections are slowing normal service restoration.',
    eventId: 'evt_quake_jp_2026_0418',
  },
  {
    id: 'tr_05',
    title: 'Tube disruption spills into buses as central lines remain suspended',
    outlet: 'BBC',
    location: 'London, UK',
    publishedAt: '2026-04-18T16:58:00Z',
    image: detailMap.evt_transit_uk_2026_0418.previewImage,
    previewText: 'Rush-hour movement is slowing across central London as riders crowd interchange stations.',
    eventId: 'evt_transit_uk_2026_0418',
  },
  {
    id: 'tr_06',
    title: 'Madrid heat advisory raises early-season strain concerns',
    outlet: 'El País',
    location: 'Madrid, Spain',
    publishedAt: '2026-04-18T14:58:00Z',
    image: detailMap.evt_heatwave_es_2026_0418.previewImage,
    previewText: 'Authorities are urging hydration and midday caution as temperatures jump beyond seasonal norms.',
    eventId: 'evt_heatwave_es_2026_0418',
  },
  {
    id: 'tr_07',
    title: 'Downtown labor march expected to slow Buenos Aires civic core',
    outlet: 'La Nación',
    location: 'Buenos Aires, Argentina',
    publishedAt: '2026-04-18T16:40:00Z',
    image: detailMap.evt_protest_ar_2026_0418.previewImage,
    previewText: 'Traffic and pedestrian density are rising even as officials keep the tone calm and procedural.',
    eventId: 'evt_protest_ar_2026_0418',
  },
  {
    id: 'tr_08',
    title: 'Berlin arena cancels sold-out show after power reliability issue',
    outlet: 'Tagesspiegel',
    location: 'Berlin, Germany',
    publishedAt: '2026-04-18T16:20:00Z',
    image: detailMap.evt_culture_de_2026_0418.previewImage,
    previewText: 'Organizers are managing crowd dispersal and refunds as fans leave the venue district.',
    eventId: 'evt_culture_de_2026_0418',
  },
  {
    id: 'tr_09',
    title: 'Air quality monitors spike near Salinas Valley as smoke drifts inland',
    outlet: 'KSBW',
    location: 'Monterey County, USA',
    publishedAt: '2026-04-18T18:19:00Z',
    image: detailMap.evt_wildfire_ca_2026_0418.previewImage,
    previewText: 'Smoke transport is becoming a secondary issue beyond the immediate evacuation footprint.',
    eventId: 'evt_wildfire_ca_2026_0418',
  },
  {
    id: 'tr_10',
    title: 'Cargo insurers monitor Rotterdam dwell-time risk after partial slowdown',
    outlet: 'Lloyd’s List',
    location: 'North Sea, Europe',
    publishedAt: '2026-04-18T15:12:00Z',
    image: detailMap.evt_port_nl_2026_0418.previewImage,
    previewText: 'Weekend spillover remains the key threshold for whether the incident becomes commercially meaningful.',
    eventId: 'evt_port_nl_2026_0418',
  },
  {
    id: 'tr_11',
    title: 'Coastal evacuations quietly expand north of Manila as storm track tightens',
    outlet: 'ABS-CBN',
    location: 'Luzon, Philippines',
    publishedAt: '2026-04-18T15:44:00Z',
    image: detailMap.evt_typhoon_ph_2026_0417.previewImage,
    previewText: 'Officials are shifting from advisories to neighborhood-level prep in exposed districts.',
    eventId: 'evt_typhoon_ph_2026_0417',
  },
  {
    id: 'tr_12',
    title: 'European utilities watch power-demand curve as early heat spreads',
    outlet: 'Reuters',
    location: 'Southern Europe',
    publishedAt: '2026-04-18T14:02:00Z',
    image: detailMap.evt_heatwave_es_2026_0418.previewImage,
    previewText: 'A short spike is manageable, but analysts are watching for signs of a broader early-season pattern.',
    eventId: 'evt_heatwave_es_2026_0418',
  },
]

export const user = {
  id: 'usr_01',
  name: 'Alex Chen',
  handle: '@alex',
  email: 'alex@crisislens.app',
  avatar: 'https://i.pravatar.cc/128?img=12',
  role: 'Analyst',
  joinedAt: '2025-11-04',
  savedEventIds: ['evt_wildfire_ca_2026_0418', 'evt_typhoon_ph_2026_0417', 'evt_port_nl_2026_0418'],
  stats: {
    savedEvents: 12,
    eventsSeen: 47,
    watchlists: 1,
  },
  activity: [5, 4, 6, 3, 7, 8, 5, 9, 11, 7, 10, 12, 9, 13],
}

export const savedEvents = user.savedEventIds.map((id) => stripDetails(detailMap[id])).filter(Boolean)

export const watchlists = [
  {
    id: 'wl_01',
    kind: 'automated',
    name: 'AI Suggested Watchlist',
    description: 'Built from saved intel and recent activity.',
    count: 5,
    eventIds: [
      'evt_port_nl_2026_0418',
      'evt_typhoon_ph_2026_0417',
      'evt_quake_jp_2026_0418',
      'evt_transit_uk_2026_0418',
      'evt_heatwave_es_2026_0418',
    ],
  },
]

export const globalStats = {
  activeEvents: 47,
  countries: 23,
  sources: 312,
  updatedLastHour: 14,
}

export const mock = {
  events,
  eventDetail,
  trending,
  user,
  savedEvents,
  watchlists,
  globalStats,
}
