import { RoutePerformance } from '../types';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const routeSeeds = [
  ['1', 'Tollgate to Thiruvanmiyur', 'Thiruvanmiyur', 'Normal', 26, 34, 18, 9.2, 5.9, 58],
  ['5E', 'T. Nagar to Besant Nagar', 'T. Nagar', 'Normal', 18, 42, 16, 8.5, 5.1, 72],
  ['12B', 'Foreshore Estate to Vadapalani', 'Vadapalani', 'Normal', 21, 38, 15, 7.4, 5.0, 64],
  ['18A', 'Broadway to Tambaram', 'Tambaram', 'Normal', 31, 46, 24, 12.8, 8.3, 81],
  ['21G', 'Broadway to Tambaram East', 'Tambaram', 'Normal', 32, 48, 26, 13.6, 8.6, 84],
  ['23C', 'Ayanavaram to Besant Nagar', 'Anna Nagar', 'Normal', 25, 35, 17, 7.1, 5.6, 56],
  ['27D', 'Villivakkam to Foreshore Estate', 'Anna Nagar', 'Normal', 28, 32, 14, 6.2, 5.4, 49],
  ['29A', 'Perambur to Thiruvanmiyur', 'Washermanpet', 'Normal', 30, 40, 20, 9.8, 6.8, 68],
  ['47', 'Avadi to T. Nagar', 'Anna Nagar', 'Normal', 29, 36, 18, 7.9, 6.1, 61],
  ['51', 'Tambaram to Broadway', 'Chromepet', 'Normal', 34, 50, 28, 14.9, 9.2, 88],
  ['70', 'CMBT to Velachery', 'Vadapalani', 'Normal', 24, 44, 19, 10.7, 6.2, 78],
  ['76', 'Koyambedu to Medavakkam', 'Vadapalani', 'Normal', 27, 39, 18, 8.4, 6.5, 65],
  ['88C', 'Adyar to Kundrathur', 'Adyar', 'Normal', 33, 30, 13, 5.8, 6.0, 47],
  ['95', 'Tambaram to Thiruvanmiyur', 'Tambaram', 'Normal', 24, 43, 21, 10.2, 6.3, 76],
  ['102', 'Broadway to Kelambakkam', 'Thiruvanmiyur', 'Normal', 36, 28, 14, 6.7, 7.2, 53],
  ['114', 'Red Hills to CMBT', 'Washermanpet', 'Normal', 26, 33, 15, 6.1, 5.6, 51],
  ['119', 'Guindy to Chemmenchery', 'Adyar', 'Normal', 38, 31, 16, 7.3, 7.0, 57],
  ['121C', 'CMBT to Ennore', 'Washermanpet', 'Normal', 35, 27, 12, 5.3, 6.9, 43],
  ['170C', 'Tambaram to Marina', 'Chromepet', 'Normal', 33, 37, 19, 8.2, 6.6, 63],
  ['221', 'Central to Kelambakkam', 'Thiruvanmiyur', 'Normal', 42, 26, 14, 6.0, 7.7, 48],
  ['570', 'CMBT to Siruseri', 'Thiruvanmiyur', 'Normal', 45, 36, 24, 13.1, 9.1, 82],
  ['A21', 'Anna Nagar to Velachery', 'Anna Nagar', 'Normal', 27, 41, 17, 9.1, 5.9, 70],
  ['D70', 'Ambattur to Velachery', 'Vadapalani', 'Normal', 33, 35, 18, 8.9, 6.8, 66],
  ['M15', 'Saidapet to Medavakkam', 'Adyar', 'Normal', 22, 39, 15, 7.0, 5.2, 59],
  ['AC18', 'Broadway to Tambaram AC', 'Tambaram', 'AC', 31, 24, 12, 8.8, 6.9, 68],
  ['AC21', 'CMBT to Siruseri AC', 'Thiruvanmiyur', 'AC', 45, 22, 14, 9.6, 8.1, 73],
  ['AC51', 'Tambaram to Broadway AC', 'Chromepet', 'AC', 34, 26, 15, 10.4, 7.7, 76],
  ['AC70', 'CMBT to Velachery AC', 'Vadapalani', 'AC', 24, 28, 13, 8.2, 6.2, 70],
  ['AC95', 'Tambaram to Thiruvanmiyur AC', 'Tambaram', 'AC', 24, 24, 11, 7.8, 6.4, 66],
  ['AC102', 'Broadway to Kelambakkam AC', 'Thiruvanmiyur', 'AC', 36, 18, 10, 6.9, 7.0, 58],
  ['AC170', 'Tambaram to Marina AC', 'Chromepet', 'AC', 33, 20, 11, 7.4, 6.8, 62],
  ['AC570', 'CMBT to Siruseri Express AC', 'Thiruvanmiyur', 'AC', 45, 27, 18, 12.1, 8.8, 79],
  ['ACD70', 'Ambattur to Velachery AC', 'Vadapalani', 'AC', 33, 19, 10, 7.2, 6.9, 60],
  ['ACM15', 'Saidapet to Medavakkam AC', 'Adyar', 'AC', 22, 21, 9, 6.4, 5.8, 57],
] as const;

export const routes: RoutePerformance[] = routeSeeds.map(
  ([routeNumber, routeName, depot, busType, distanceKm, tripsPerDay, fleet, baseRevenue, baseCost, baseLoad], routeIndex) => ({
    routeNumber,
    routeName,
    depot,
    busType,
    distanceKm,
    tripsPerDay,
    fleet,
    monthly: months.map((month, monthIndex) => {
      const seasonality = 1 + Math.sin((monthIndex + routeIndex / 3) * 0.72) * 0.08;
      const servicePulse = 1 + ((monthIndex % 4) - 1.5) * 0.018;
      const revenue = Math.round(baseRevenue * seasonality * servicePulse * 100000);
      const cost = Math.round(baseCost * (1 + monthIndex * 0.006) * (1 + distanceKm / 1200) * 100000);
      const passengers = Math.round(revenue / (17 + (routeIndex % 5)) + tripsPerDay * 1100);
      const loadFactor = Math.max(38, Math.min(96, Math.round(baseLoad * seasonality + (monthIndex % 3) * 1.8)));

      return { month, revenue, cost, passengers, loadFactor };
    }),
  }),
);

export const monthOrder = [...months];
