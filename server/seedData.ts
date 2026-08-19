import {
  User,
  SolarInstallation,
  ConsumerProfile,
  TariffZone,
  NegotiationBid,
  TelemetryLog,
  MatchingRun,
  EnergyTransaction,
  Wallet,
  Invoice,
  SimulationState
} from '../src/types/index.ts';

export const INITIAL_USERS: User[] = [
  {
    id: 'user_prosumer_1',
    name: 'Maya Lin',
    email: 'maya.lin@solarhouse.io',
    role: 'PROSUMER',
    phone: '+1 (555) 234-5678',
    address: '42 Sunburst Way, Pine Valley',
    pincode: '94025',
    zoneId: 'zone_north',
    kycStatus: 'VERIFIED',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'user_prosumer_2',
    name: 'David Kim',
    email: 'david.kim@greenenergy.org',
    role: 'PROSUMER',
    phone: '+1 (555) 345-6789',
    address: '108 Helio Terrace, Metro Heights',
    pincode: '94103',
    zoneId: 'zone_central',
    kycStatus: 'VERIFIED',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-10T11:20:00Z'
  },
  {
    id: 'user_prosumer_3',
    name: 'GreenPeak AgriSolar',
    email: 'operations@greenpeakfarms.com',
    role: 'PROSUMER',
    phone: '+1 (555) 456-7890',
    address: '88 Valley Orchard Rd, West Valley',
    pincode: '94087',
    zoneId: 'zone_west',
    kycStatus: 'VERIFIED',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-03-01T14:00:00Z'
  },
  {
    id: 'user_prosumer_4',
    name: 'Solaria Eco-Condos',
    email: 'hoa@solariacondos.org',
    role: 'PROSUMER',
    phone: '+1 (555) 567-8901',
    address: '500 Amber Ridge Dr, South Haven',
    pincode: '95123',
    zoneId: 'zone_south',
    kycStatus: 'VERIFIED',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-03-12T08:30:00Z'
  },
  {
    id: 'user_consumer_1',
    name: 'Apex Tech Labs',
    email: 'facilities@apextechlabs.io',
    role: 'CONSUMER',
    phone: '+1 (555) 678-9012',
    address: '100 Innovation Parkway, Suite 400',
    pincode: '94025',
    zoneId: 'zone_north',
    kycStatus: 'VERIFIED',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-20T10:15:00Z'
  },
  {
    id: 'user_consumer_2',
    name: 'EcoBake Artisan Bakery',
    email: 'marcus@ecobakebakery.com',
    role: 'CONSUMER',
    phone: '+1 (555) 789-0123',
    address: '74 Market Street, Downtown',
    pincode: '94103',
    zoneId: 'zone_central',
    kycStatus: 'VERIFIED',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-05T13:45:00Z'
  },
  {
    id: 'user_consumer_3',
    name: 'Liam & Sophia Vance',
    email: 'liam.vance@resimail.com',
    role: 'CONSUMER',
    phone: '+1 (555) 890-1234',
    address: '219 Meadowlark Court, South Haven',
    pincode: '95123',
    zoneId: 'zone_south',
    kycStatus: 'VERIFIED',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-18T16:00:00Z'
  },
  {
    id: 'user_consumer_4',
    name: 'Cascade Community Center',
    email: 'admin@cascadecommunity.org',
    role: 'CONSUMER',
    phone: '+1 (555) 901-2345',
    address: '320 Evergreen Way, West Valley',
    pincode: '94087',
    zoneId: 'zone_west',
    kycStatus: 'VERIFIED',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-03-05T09:10:00Z'
  },
  {
    id: 'user_dispatcher_1',
    name: 'Alex Rivera',
    email: 'alex.rivera@xyzenergy.io',
    role: 'DISPATCHER',
    phone: '+1 (555) 111-2233',
    address: 'XYZ Grid Operations Command, Grid Station Alpha',
    pincode: '94103',
    zoneId: 'zone_central',
    kycStatus: 'VERIFIED',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user_admin_1',
    name: 'Elena Rostova',
    email: 'elena.rostova@xyzenergy.io',
    role: 'ADMIN',
    phone: '+1 (555) 999-8877',
    address: 'XYZ Energy Share HQ, 100 Renewable Way',
    pincode: '94103',
    zoneId: 'zone_central',
    kycStatus: 'VERIFIED',
    avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_INSTALLATIONS: SolarInstallation[] = [
  {
    id: 'inst_1',
    prosumerId: 'user_prosumer_1',
    plantCapacityKwp: 14.5,
    inverterModel: 'SolarEdge SE11400H-US HD-Wave + Optimizers',
    meterId: 'MTR-NOR-7741',
    installationDate: '2025-08-10',
    agreedBuybackRatePerKwh: 0.15, // $/kWh (Gov is $0.08)
    address: '42 Sunburst Way, Pine Valley',
    pincode: '94025',
    zoneId: 'zone_north',
    gridConnectionStatus: 'ACTIVE',
    efficiencyRatingPct: 97.5
  },
  {
    id: 'inst_2',
    prosumerId: 'user_prosumer_2',
    plantCapacityKwp: 9.2,
    inverterModel: 'Enphase IQ8+ Microinverters (24 units)',
    meterId: 'MTR-CEN-3329',
    installationDate: '2025-11-04',
    agreedBuybackRatePerKwh: 0.14, // $/kWh (Gov is $0.07)
    address: '108 Helio Terrace, Metro Heights',
    pincode: '94103',
    zoneId: 'zone_central',
    gridConnectionStatus: 'ACTIVE',
    efficiencyRatingPct: 96.8
  },
  {
    id: 'inst_3',
    prosumerId: 'user_prosumer_3',
    plantCapacityKwp: 48.0,
    inverterModel: 'SMA Sunny Tripower CORE1 50kW Dual MPPT',
    meterId: 'MTR-WST-9912',
    installationDate: '2025-05-22',
    agreedBuybackRatePerKwh: 0.145, // $/kWh (Gov is $0.075)
    address: '88 Valley Orchard Rd, West Valley',
    pincode: '94087',
    zoneId: 'zone_west',
    gridConnectionStatus: 'ACTIVE',
    efficiencyRatingPct: 98.2
  },
  {
    id: 'inst_4',
    prosumerId: 'user_prosumer_4',
    plantCapacityKwp: 28.0,
    inverterModel: 'Fronius Symo Advanced 24.0-3-M',
    meterId: 'MTR-SOU-5582',
    installationDate: '2025-09-18',
    agreedBuybackRatePerKwh: 0.13, // $/kWh (Gov is $0.06)
    address: '500 Amber Ridge Dr, South Haven',
    pincode: '95123',
    zoneId: 'zone_south',
    gridConnectionStatus: 'ACTIVE',
    efficiencyRatingPct: 97.1
  }
];

export const INITIAL_CONSUMER_PROFILES: ConsumerProfile[] = [
  {
    id: 'prof_1',
    consumerId: 'user_consumer_1',
    monthlyRequirementKwh: 2800,
    connectedLoadKw: 35.0,
    billingCycle: 'MONTHLY',
    contractType: 'SUBSCRIPTION',
    allocatedGreenQuotaKwh: 2500,
    preferredMaxRatePerKwh: 0.20,
    pincode: '94025',
    zoneId: 'zone_north'
  },
  {
    id: 'prof_2',
    consumerId: 'user_consumer_2',
    monthlyRequirementKwh: 1200,
    connectedLoadKw: 18.0,
    billingCycle: 'MONTHLY',
    contractType: 'SUBSCRIPTION',
    allocatedGreenQuotaKwh: 1000,
    preferredMaxRatePerKwh: 0.19,
    pincode: '94103',
    zoneId: 'zone_central'
  },
  {
    id: 'prof_3',
    consumerId: 'user_consumer_3',
    monthlyRequirementKwh: 550,
    connectedLoadKw: 8.0,
    billingCycle: 'PREPAID',
    contractType: 'ON_DEMAND',
    allocatedGreenQuotaKwh: 500,
    preferredMaxRatePerKwh: 0.18,
    pincode: '95123',
    zoneId: 'zone_south'
  },
  {
    id: 'prof_4',
    consumerId: 'user_consumer_4',
    monthlyRequirementKwh: 1900,
    connectedLoadKw: 22.0,
    billingCycle: 'MONTHLY',
    contractType: 'SUBSCRIPTION',
    allocatedGreenQuotaKwh: 1800,
    preferredMaxRatePerKwh: 0.195,
    pincode: '94087',
    zoneId: 'zone_west'
  }
];

export const INITIAL_TARIFF_ZONES: TariffZone[] = [
  {
    zoneId: 'zone_north',
    zoneName: 'North Silicon Corridor',
    region: 'North Bay Microgrid',
    pincodes: ['94025', '94027', '94301', '94306'],
    govtGridRetailRate: 0.26, // $0.26 / kWh from utility
    govtBuybackRate: 0.08,    // $0.08 / kWh utility export
    xyzDefaultBuyRate: 0.15,  // XYZ pays prosumer $0.15 (+87.5% vs govt!)
    xyzDefaultSellRate: 0.19, // XYZ sells to consumer $0.19 (-27% discount vs govt!)
    xyzPlatformMarginRate: 0.04, // $0.04 spread
    currency: 'USD',
    lastUpdated: '2026-08-01T00:00:00Z'
  },
  {
    zoneId: 'zone_central',
    zoneName: 'Central Metro Hub',
    region: 'Metro Downtown Grid',
    pincodes: ['94103', '94107', '94102', '94110'],
    govtGridRetailRate: 0.24,
    govtBuybackRate: 0.07,
    xyzDefaultBuyRate: 0.14,
    xyzDefaultSellRate: 0.18,
    xyzPlatformMarginRate: 0.04,
    currency: 'USD',
    lastUpdated: '2026-08-01T00:00:00Z'
  },
  {
    zoneId: 'zone_south',
    zoneName: 'South Green Haven',
    region: 'South Valley Residential',
    pincodes: ['95123', '95124', '95118', '95136'],
    govtGridRetailRate: 0.23,
    govtBuybackRate: 0.065,
    xyzDefaultBuyRate: 0.13,
    xyzDefaultSellRate: 0.17,
    xyzPlatformMarginRate: 0.04,
    currency: 'USD',
    lastUpdated: '2026-08-01T00:00:00Z'
  },
  {
    zoneId: 'zone_west',
    zoneName: 'West Valley Agri-Solar',
    region: 'West Foothills Microgrid',
    pincodes: ['94087', '94086', '95014', '95070'],
    govtGridRetailRate: 0.25,
    govtBuybackRate: 0.075,
    xyzDefaultBuyRate: 0.145,
    xyzDefaultSellRate: 0.185,
    xyzPlatformMarginRate: 0.04,
    currency: 'USD',
    lastUpdated: '2026-08-01T00:00:00Z'
  }
];

export const INITIAL_BIDS: NegotiationBid[] = [
  {
    id: 'bid_1',
    prosumerId: 'user_prosumer_1',
    prosumerName: 'Maya Lin',
    zoneId: 'zone_north',
    plantCapacityKwp: 14.5,
    currentAgreedRate: 0.15,
    proposedRatePerKwh: 0.165,
    estimatedMonthlyExportKwh: 1600,
    status: 'COUNTER_OFFER',
    counterRatePerKwh: 0.158,
    prosumerNotes: 'Upgraded to bifacial high-efficiency panels with battery backup. Exporting consistently high daytime yield.',
    adminNotes: 'Counter-offering $0.158/kWh based on North zone consumer demand elasticity and high peak morning export.',
    createdAt: '2026-08-16T10:30:00Z',
    updatedAt: '2026-08-17T14:15:00Z'
  },
  {
    id: 'bid_2',
    prosumerId: 'user_prosumer_3',
    prosumerName: 'GreenPeak AgriSolar',
    zoneId: 'zone_west',
    plantCapacityKwp: 48.0,
    currentAgreedRate: 0.145,
    proposedRatePerKwh: 0.155,
    estimatedMonthlyExportKwh: 5500,
    status: 'PENDING',
    prosumerNotes: 'High volume commercial solar array. Seeking contract adjustment for seasonal high output months.',
    createdAt: '2026-08-18T09:00:00Z',
    updatedAt: '2026-08-18T09:00:00Z'
  },
  {
    id: 'bid_3',
    prosumerId: 'user_prosumer_2',
    prosumerName: 'David Kim',
    zoneId: 'zone_central',
    plantCapacityKwp: 9.2,
    currentAgreedRate: 0.14,
    proposedRatePerKwh: 0.14,
    estimatedMonthlyExportKwh: 950,
    status: 'ACCEPTED',
    prosumerNotes: 'Annual renewal with standard agreed rate.',
    adminNotes: 'Accepted. Standard zone rate locked for 12 months.',
    createdAt: '2026-07-20T11:00:00Z',
    updatedAt: '2026-07-21T09:30:00Z',
    resolvedAt: '2026-07-21T09:30:00Z'
  }
];

export const INITIAL_SIMULATION_STATE: SimulationState = {
  isRunning: true,
  currentSimHour: 13.5, // 1:30 PM (Peak Solar Production)
  weatherCondition: 'SUNNY',
  solarIrradiancePct: 92,
  speedMultiplier: 1,
  autoMatchEnabled: true,
  lastTickTimestamp: new Date().toISOString()
};
