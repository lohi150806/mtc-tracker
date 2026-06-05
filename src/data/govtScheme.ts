import { SchemeUsageRecord } from '../types';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const corridors = [
  ['T. Nagar', 'Tambaram', '18A', 'Tambaram', 18200, 18],
  ['Broadway', 'Tambaram', '21G', 'Tambaram', 21400, 19],
  ['CMBT', 'Velachery', '70', 'Vadapalani', 16600, 17],
  ['Perambur', 'Thiruvanmiyur', '29A', 'Washermanpet', 13800, 18],
  ['Adyar', 'Medavakkam', 'M15', 'Adyar', 12100, 16],
  ['Anna Nagar', 'Velachery', 'A21', 'Anna Nagar', 14500, 17],
  ['Tambaram', 'Thiruvanmiyur', '95', 'Tambaram', 17100, 18],
  ['Guindy', 'Chemmenchery', '119', 'Adyar', 10400, 20],
  ['Red Hills', 'CMBT', '114', 'Washermanpet', 9800, 16],
  ['Saidapet', 'Medavakkam', 'M15', 'Adyar', 11200, 15],
  ['Avadi', 'T. Nagar', '47', 'Anna Nagar', 12600, 17],
  ['CMBT', 'Siruseri', '570', 'Thiruvanmiyur', 15800, 22],
  ['Villivakkam', 'Foreshore Estate', '27D', 'Anna Nagar', 9200, 15],
  ['Broadway', 'Kelambakkam', '102', 'Thiruvanmiyur', 10100, 21],
  ['Koyambedu', 'Medavakkam', '76', 'Vadapalani', 11800, 16],
] as const;

export const govtSchemeUsage: SchemeUsageRecord[] = corridors.flatMap(
  ([origin, destination, route, depot, baseTickets, avgFare], corridorIndex) =>
    months.map((month, monthIndex) => {
      const seasonality = 1 + Math.sin((monthIndex + corridorIndex / 2) * 0.66) * 0.09;
      const commuterPulse = 1 + ((monthIndex % 5) - 2) * 0.018;
      const freeTicketsIssued = Math.round(baseTickets * seasonality * commuterPulse);
      const womenBeneficiaries = Math.round(freeTicketsIssued * (0.58 + (corridorIndex % 4) * 0.035));
      const reimbursementAmount = Math.round(freeTicketsIssued * avgFare);

      return {
        origin,
        destination,
        route,
        depot,
        month,
        freeTicketsIssued,
        womenBeneficiaries,
        reimbursementAmount,
      };
    }),
);
