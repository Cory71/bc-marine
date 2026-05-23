// App color theme — dark coastal style
export const COLORS = {
  background: '#0a1628',
  navBar: '#060f1e',
  accent: '#7ecef4',
  cardBorder: 'rgba(126,206,244,0.2)',
  cardBg: 'rgba(126,206,244,0.08)',
  textPrimary: '#ffffff',
  textSecondary: '#9cc8e8',
  textMuted: '#4a7090',
  warning: '#ff9f43',
  safe: '#4dcc88',
};

// BC stations organized by official EC marine weather areas
// id field is the DFO IWLS MongoDB ObjectID used for tide API calls
export const BC_REGIONS = [
  {
    name: 'North Coast',
    areas: [
      {
        name: 'Dixon Entrance',
        stations: [
          { id: '5cebf1de3d0f4a073c4bba06', name: 'Prince Rupert', lat: 54.3167, lon: -130.3167 },
          { id: '5cebf1de3d0f4a073c4bba44', name: 'Masset', lat: 54.0167, lon: -132.1500 },
        ],
      },
      {
        name: 'Hecate Strait',
        stations: [
          { id: '5cebf1de3d0f4a073c4bba06', name: 'Sandspit', lat: 53.2500, lon: -131.8167 },
        ],
      },
      {
        name: 'Queen Charlotte Sound',
        stations: [
          { id: '5cebf1de3d0f4a073c4bb9c7', name: 'Port Hardy', lat: 50.7197, lon: -127.4897 },
          { id: '5cebf1de3d0f4a073c4bb9c7', name: 'Winter Harbour', lat: 50.5167, lon: -128.0333 },
        ],
      },
    ],
  },
  {
    name: 'Central Coast',
    areas: [
      {
        name: 'Milbanke Sound',
        stations: [
          { id: '5cebf1de3d0f4a073c4bb9c7', name: 'Bella Bella', lat: 52.1581, lon: -128.1439 },
        ],
      },
      {
        name: 'Queen Charlotte Strait',
        stations: [
          { id: '5cebf1de3d0f4a073c4bb9ac', name: 'Alert Bay', lat: 50.5833, lon: -126.9167 },
          { id: '5cebf1de3d0f4a073c4bb9ae', name: 'Port McNeill', lat: 50.5833, lon: -127.0833 },
        ],
      },
      {
        name: 'Johnstone Strait',
        stations: [
          { id: '5cebf1de3d0f4a073c4bb996', name: 'Campbell River', lat: 50.0419, lon: -125.2442 },
          { id: '5cebf1de3d0f4a073c4bb9a5', name: 'Port Neville', lat: 50.5000, lon: -126.0833 },
        ],
      },
    ],
  },
  {
    name: 'West Coast Vancouver Island',
    areas: [
      {
        name: 'Nootka Sound',
        stations: [
          { id: '5cebf1de3d0f4a073c4bb9c7', name: 'Gold River', lat: 49.6667, lon: -126.1167 },
        ],
      },
      {
        name: 'Clayoquot Sound',
        stations: [
          { id: '5cebf1e23d0f4a073c4bc062', name: 'Tofino', lat: 49.1531, lon: -125.9069 },
        ],
      },
      {
        name: 'Barkley Sound',
        stations: [
          { id: '5cebf1e23d0f4a073c4bc062', name: 'Ucluelet', lat: 48.9333, lon: -125.5500 },
          { id: '5cebf1e23d0f4a073c4bc062', name: 'Port Alberni', lat: 49.2333, lon: -124.8167 },
        ],
      },
    ],
  },
  {
    name: 'Strait of Georgia',
    areas: [
      {
        name: 'Georgia Strait North',
        stations: [
          { id: '5cebf1de3d0f4a073c4bb960', name: 'Powell River', lat: 49.8353, lon: -124.5247 },
          { id: '5cebf1de3d0f4a073c4bb979', name: 'Comox', lat: 49.6667, lon: -124.9500 },
        ],
      },
      {
        name: 'Georgia Strait South',
        stations: [
          { id: '5cebf1de3d0f4a073c4bb96d', name: 'Nanaimo', lat: 49.1667, lon: -123.9333 },
          { id: '5cebf1de3d0f4a073c4bb943', name: 'Vancouver', lat: 49.2833, lon: -123.1167 },
        ],
      },
      {
        name: 'Howe Sound',
        stations: [
          { id: '5cebf1de3d0f4a073c4bb94e', name: 'Squamish', lat: 49.7000, lon: -123.1500 },
        ],
      },
    ],
  },
  {
    name: 'Juan de Fuca & South Coast',
    areas: [
      {
        name: 'Juan de Fuca Strait',
        stations: [
          { id: '5cebf1df3d0f4a073c4bbd1e', name: 'Victoria', lat: 48.4244, lon: -123.3699 },
          { id: '5cebf1e23d0f4a073c4bc060', name: 'Port Renfrew', lat: 48.5500, lon: -124.4167 },
        ],
      },
      {
        name: 'Saanich Inlet',
        stations: [
          { id: '5cebf1df3d0f4a073c4bbd26', name: 'Sidney', lat: 48.6500, lon: -123.4000 },
        ],
      },
    ],
  },
];

// Flat list of all stations for search and nearest-station lookup
export const BC_STATIONS = BC_REGIONS.flatMap(r =>
  r.areas.flatMap(a =>
    a.stations.map(s => ({ ...s, region: a.name, coast: r.name }))
  )
);

// Additional BC coastal communities for search — use nearest DFO station for tide data
export const BC_COMMUNITIES = [
  // Sunshine Coast
  { id: '5cebf1de3d0f4a073c4bb94e', name: 'Gibsons', lat: 49.3972, lon: -123.5069, region: 'Georgia Strait North', coast: 'Strait of Georgia' },
  { id: '5cebf1de3d0f4a073c4bb94e', name: 'Sechelt', lat: 49.4739, lon: -123.7572, region: 'Georgia Strait North', coast: 'Strait of Georgia' },
  { id: '5cebf1de3d0f4a073c4bb960', name: 'Pender Harbour', lat: 49.6267, lon: -124.0261, region: 'Georgia Strait North', coast: 'Strait of Georgia' },
  { id: '5cebf1de3d0f4a073c4bb960', name: 'Halfmoon Bay', lat: 49.5106, lon: -123.9081, region: 'Georgia Strait North', coast: 'Strait of Georgia' },
  // East Vancouver Island
  { id: '5cebf1de3d0f4a073c4bb979', name: 'Courtenay', lat: 49.6858, lon: -124.9897, region: 'Georgia Strait North', coast: 'Strait of Georgia' },
  { id: '5cebf1de3d0f4a073c4bb96d', name: 'Parksville', lat: 49.3161, lon: -124.3122, region: 'Georgia Strait South', coast: 'Strait of Georgia' },
  { id: '5cebf1de3d0f4a073c4bb96d', name: 'Ladysmith', lat: 49.0006, lon: -123.8197, region: 'Georgia Strait South', coast: 'Strait of Georgia' },
  { id: '5cebf1de3d0f4a073c4bb96d', name: 'Chemainus', lat: 48.9267, lon: -123.7097, region: 'Georgia Strait South', coast: 'Strait of Georgia' },
  // South Vancouver Island
  { id: '5cebf1df3d0f4a073c4bbd1e', name: 'Sooke', lat: 48.3769, lon: -123.7264, region: 'Juan de Fuca Strait', coast: 'Juan de Fuca & South Coast' },
  { id: '5cebf1df3d0f4a073c4bbd26', name: 'Ganges', lat: 48.8594, lon: -123.5028, region: 'Saanich Inlet', coast: 'Juan de Fuca & South Coast' },
  // West Coast Vancouver Island
  { id: '5cebf1e23d0f4a073c4bc062', name: 'Bamfield', lat: 48.8356, lon: -125.1350, region: 'Barkley Sound', coast: 'West Coast Vancouver Island' },
  { id: '5cebf1de3d0f4a073c4bb9c7', name: 'Tahsis', lat: 49.9167, lon: -126.6667, region: 'Nootka Sound', coast: 'West Coast Vancouver Island' },
  // Central Coast
  { id: '5cebf1de3d0f4a073c4bb9c7', name: 'Bella Coola', lat: 52.3667, lon: -126.7667, region: 'Milbanke Sound', coast: 'Central Coast' },
  { id: '5cebf1de3d0f4a073c4bb9c7', name: 'Ocean Falls', lat: 52.3500, lon: -127.6833, region: 'Milbanke Sound', coast: 'Central Coast' },
  { id: '5cebf1de3d0f4a073c4bb9c7', name: 'Klemtu', lat: 52.5833, lon: -128.5167, region: 'Milbanke Sound', coast: 'Central Coast' },
  { id: '5cebf1de3d0f4a073c4bb91e', name: 'Hartley Bay', lat: 53.4242, lon: -129.2519, region: 'Milbanke Sound', coast: 'Central Coast' },
  { id: '5cebf1de3d0f4a073c4bb925', name: 'Kitimat', lat: 53.9890, lon: -128.6960, region: 'Milbanke Sound', coast: 'Central Coast' },
  // Metro Vancouver area
  { id: '5cebf1de3d0f4a073c4bb943', name: 'White Rock', lat: 49.0253, lon: -122.8028, region: 'Georgia Strait South', coast: 'Strait of Georgia' },
  { id: '5cebf1de3d0f4a073c4bb943', name: 'Tsawwassen', lat: 49.0133, lon: -123.1317, region: 'Georgia Strait South', coast: 'Strait of Georgia' },
];

// API base URLs
export const API = {
  DFO_BASE: 'https://api-iwls.dfo-mpo.gc.ca/api/v1',
  EC_MARINE_BASE: 'https://weather.gc.ca/rss/marine',
  OPEN_METEO_MARINE: 'https://marine-api.open-meteo.com/v1/marine',
  OPEN_METEO_WEATHER: 'https://api.open-meteo.com/v1/forecast',
};
