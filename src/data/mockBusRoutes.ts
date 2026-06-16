export interface MockBusRoute {
  busNumber: string;
  routeName: string;
  startPoint: string;
  endPoint: string;
  stops: string[];
  coordinates: [number, number][];
}

// Local mock data only — no external APIs. Coordinates are [lat, lng] and roughly
// follow each corridor across Chennai so polylines render sensibly on the map.
export const mockBusRoutes: MockBusRoute[] = [
  {
    busNumber: '21G',
    routeName: 'Broadway to Tambaram',
    startPoint: 'Broadway',
    endPoint: 'Tambaram',
    stops: ['Broadway', 'Guindy', 'Chromepet', 'Tambaram'],
    coordinates: [
      [13.0925, 80.287],
      [13.0067, 80.2206],
      [12.9516, 80.1422],
      [12.9249, 80.1],
    ],
  },
  {
    busNumber: '47A',
    routeName: 'CMBT to Thiruvanmiyur',
    startPoint: 'CMBT',
    endPoint: 'Thiruvanmiyur',
    stops: ['CMBT', 'Vadapalani', 'T. Nagar', 'Adyar', 'Thiruvanmiyur'],
    coordinates: [
      [13.0694, 80.1948],
      [13.0501, 80.2121],
      [13.0418, 80.2341],
      [13.0012, 80.2565],
      [12.9829, 80.2594],
    ],
  },
  {
    busNumber: 'M15',
    routeName: 'Mylapore to Anna Nagar',
    startPoint: 'Mylapore',
    endPoint: 'Anna Nagar',
    stops: ['Mylapore', 'Nungambakkam', 'Aminjikarai', 'Anna Nagar'],
    coordinates: [
      [13.0368, 80.2676],
      [13.0604, 80.2496],
      [13.0732, 80.2206],
      [13.085, 80.21],
    ],
  },
  {
    busNumber: '27H',
    routeName: 'CMBT to Broadway',
    startPoint: 'CMBT',
    endPoint: 'Broadway',
    stops: ['CMBT', 'Aminjikarai', 'Egmore', 'Broadway'],
    coordinates: [
      [13.0694, 80.1948],
      [13.0732, 80.2206],
      [13.0786, 80.2546],
      [13.0925, 80.287],
    ],
  },
  {
    busNumber: '570S',
    routeName: 'Kelambakkam to T. Nagar',
    startPoint: 'Kelambakkam',
    endPoint: 'T. Nagar',
    stops: ['Kelambakkam', 'Sholinganallur', 'Thiruvanmiyur', 'Adyar', 'T. Nagar'],
    coordinates: [
      [12.7847, 80.2206],
      [12.901, 80.2279],
      [12.9829, 80.2594],
      [13.0012, 80.2565],
      [13.0418, 80.2341],
    ],
  },
  {
    busNumber: '102',
    routeName: 'Broadway to Kelambakkam',
    startPoint: 'Broadway',
    endPoint: 'Kelambakkam',
    stops: ['Broadway', 'Mylapore', 'Adyar', 'Sholinganallur', 'Kelambakkam'],
    coordinates: [
      [13.0925, 80.287],
      [13.0368, 80.2676],
      [13.0012, 80.2565],
      [12.901, 80.2279],
      [12.7847, 80.2206],
    ],
  },
  {
    busNumber: '19B',
    routeName: 'Saidapet to Velachery',
    startPoint: 'Saidapet',
    endPoint: 'Velachery',
    stops: ['Saidapet', 'Guindy', 'Velachery'],
    coordinates: [
      [13.0214, 80.2236],
      [13.0067, 80.2206],
      [12.9791, 80.2212],
    ],
  },
  {
    busNumber: '5E',
    routeName: 'Parry’s to Besant Nagar',
    startPoint: 'Parry’s Corner',
    endPoint: 'Besant Nagar',
    stops: ['Parry’s Corner', 'Triplicane', 'Mylapore', 'Adyar', 'Besant Nagar'],
    coordinates: [
      [13.0925, 80.287],
      [13.0569, 80.2766],
      [13.0368, 80.2676],
      [13.0012, 80.2565],
      [12.9986, 80.2669],
    ],
  },
  {
    busNumber: '70V',
    routeName: 'CMBT to Vadapalani',
    startPoint: 'CMBT',
    endPoint: 'Vadapalani',
    stops: ['CMBT', 'Ashok Nagar', 'Vadapalani'],
    coordinates: [
      [13.0694, 80.1948],
      [13.0359, 80.2103],
      [13.0501, 80.2121],
    ],
  },
  {
    busNumber: '29C',
    routeName: 'Perambur to Adyar',
    startPoint: 'Perambur',
    endPoint: 'Adyar',
    stops: ['Perambur', 'Kilpauk', 'Egmore', 'Nungambakkam', 'Adyar'],
    coordinates: [
      [13.1143, 80.2329],
      [13.0846, 80.2419],
      [13.0786, 80.2546],
      [13.0604, 80.2496],
      [13.0012, 80.2565],
    ],
  },
];

const normalize = (value: string) => value.trim().toLowerCase();

export function findBusRoute(busNumber: string): MockBusRoute | undefined {
  const query = normalize(busNumber);
  if (!query) return undefined;
  return mockBusRoutes.find((route) => normalize(route.busNumber) === query);
}
