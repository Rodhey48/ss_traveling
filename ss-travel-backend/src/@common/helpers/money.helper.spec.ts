import { MoneyHelper } from './money.helper';

describe('MoneyHelper', () => {
  describe('toAmount', () => {
    it('should format numbers and strings to 2 decimal places', () => {
      expect(MoneyHelper.toAmount('1500000')).toBe('1500000.00');
      expect(MoneyHelper.toAmount(1500000.5)).toBe('1500000.50');
      expect(MoneyHelper.toAmount(null)).toBe('0.00');
      expect(MoneyHelper.toAmount(undefined)).toBe('0.00');
      expect(MoneyHelper.toAmount('')).toBe('0.00');
      expect(MoneyHelper.toAmount('invalid')).toBe('0.00');
    });
  });

  describe('arithmetic operations', () => {
    it('should accurately add amounts without floating point errors', () => {
      // 0.1 + 0.2 in JS float is 0.30000000000000004
      expect(MoneyHelper.add('0.1', '0.2')).toBe('0.30');
      expect(MoneyHelper.add('1500000.00', '250000.50')).toBe('1750000.50');
    });

    it('should accurately subtract amounts', () => {
      expect(MoneyHelper.sub('3500000.00', '2600000.00')).toBe('900000.00');
      expect(MoneyHelper.sub('100.00', '150.00')).toBe('-50.00');
    });

    it('should accurately multiply amounts', () => {
      // 24 pax * 250,000 = 6,000,000
      expect(MoneyHelper.mul('24', '250000.00')).toBe('6000000.00');
      // 20% cargo commission of 350,000
      expect(MoneyHelper.mul('350000.00', '0.20')).toBe('70000.00');
    });

    it('should accurately divide amounts and handle zero safely', () => {
      expect(MoneyHelper.div('1000000.00', '4')).toBe('250000.00');
      expect(MoneyHelper.div('1000000.00', '0')).toBe('0.00');
    });

    it('should accurately sum an array of amounts', () => {
      const expenses = ['1600000.00', '900000.00', '100000.00'];
      expect(MoneyHelper.sum(expenses)).toBe('2600000.00');
    });
  });

  describe('comparisons and validations', () => {
    it('should compare equality correctly', () => {
      expect(MoneyHelper.isEqual('100.00', '100')).toBe(true);
      expect(MoneyHelper.isEqual('100.00', '100.01')).toBe(false);
    });

    it('should detect zero and positivity', () => {
      expect(MoneyHelper.isZero('0.00')).toBe(true);
      expect(MoneyHelper.isZero('0')).toBe(true);
      expect(MoneyHelper.isZero('10')).toBe(false);

      expect(MoneyHelper.isPositive('10')).toBe(true);
      expect(MoneyHelper.isPositive('0')).toBe(false);
      expect(MoneyHelper.isPositive('-10')).toBe(false);
    });

    it('should handle relational comparisons', () => {
      expect(MoneyHelper.isGreaterThan('150.00', '100.00')).toBe(true);
      expect(MoneyHelper.isGreaterOrEqual('100.00', '100.00')).toBe(true);
      expect(MoneyHelper.isLessThan('50.00', '100.00')).toBe(true);
      expect(MoneyHelper.isLessOrEqual('100.00', '100.00')).toBe(true);
    });

    it('should validate balanced journals accurately', () => {
      const debits = [
        '2350000.00', // Kas Pool
        '1600000.00', // BBM Solar
        '900000.00',  // Tol
        '100000.00',  // Cuci & Armada
        '400000.00',  // Uang Makan Kru
        '650000.00',  // Premi Ritase
        '150000.00',  // Bonus Full Seat
        '90000.00',   // Komisi Kargo Kru
        '440000.00',  // Jasa Korlap
        '5500000.00', // AR OTA
        '4500000.00', // AR Agen Offline
      ];

      const credits = [
        '3500000.00',  // UJ Kru
        '11000000.00', // Pendapatan Tiket
        '450000.00',   // Pendapatan Kargo
        '640000.00',   // Kas Dibayar ke Kru
        '650000.00',   // Utang Premi Kru
        '440000.00',   // Utang Korlap
      ];

      expect(MoneyHelper.sum(debits)).toBe('16680000.00');
      expect(MoneyHelper.sum(credits)).toBe('16680000.00');
      expect(MoneyHelper.isBalanced(debits, credits)).toBe(true);

      // If unbalanced
      const unbalancedCredits = [...credits, '1000.00'];
      expect(MoneyHelper.isBalanced(debits, unbalancedCredits)).toBe(false);
    });
  });

  describe('formatRupiah', () => {
    it('should format amounts to Rupiah string', () => {
      expect(MoneyHelper.formatRupiah('1500000')).toBe('Rp 1.500.000');
      expect(MoneyHelper.formatRupiah('1500000.50')).toBe('Rp 1.500.000,50');
      expect(MoneyHelper.formatRupiah('1500000', false)).toBe('1.500.000');
      expect(MoneyHelper.formatRupiah('-250000')).toBe('-Rp 250.000');
    });
  });
});
