import Decimal from 'decimal.js';

export class MoneyHelper {
  private static readonly DEFAULT_DECIMAL_PLACES = 2;

  /**
   * Mengonversi nilai ke instance Decimal yang aman
   */
  public static toDecimal(value: string | number | Decimal | null | undefined): Decimal {
    if (value === null || value === undefined || value === '') {
      return new Decimal(0);
    }
    if (value instanceof Decimal) {
      return value;
    }
    try {
      return new Decimal(value);
    } catch {
      return new Decimal(0);
    }
  }

  /**
   * Mengembalikan format string nominal standar database (numeric(20,2))
   * Contoh: "1500000.00"
   */
  public static toAmount(
    value: string | number | Decimal | null | undefined,
    decimalPlaces: number = MoneyHelper.DEFAULT_DECIMAL_PLACES,
  ): string {
    return MoneyHelper.toDecimal(value).toFixed(decimalPlaces);
  }

  /**
   * Penjumlahan: a + b
   */
  public static add(
    a: string | number | Decimal,
    b: string | number | Decimal,
    decimalPlaces: number = MoneyHelper.DEFAULT_DECIMAL_PLACES,
  ): string {
    const decA = MoneyHelper.toDecimal(a);
    const decB = MoneyHelper.toDecimal(b);
    return decA.plus(decB).toFixed(decimalPlaces);
  }

  /**
   * Pengurangan: a - b
   */
  public static sub(
    a: string | number | Decimal,
    b: string | number | Decimal,
    decimalPlaces: number = MoneyHelper.DEFAULT_DECIMAL_PLACES,
  ): string {
    const decA = MoneyHelper.toDecimal(a);
    const decB = MoneyHelper.toDecimal(b);
    return decA.minus(decB).toFixed(decimalPlaces);
  }

  /**
   * Perkalian: a * b
   */
  public static mul(
    a: string | number | Decimal,
    b: string | number | Decimal,
    decimalPlaces: number = MoneyHelper.DEFAULT_DECIMAL_PLACES,
  ): string {
    const decA = MoneyHelper.toDecimal(a);
    const decB = MoneyHelper.toDecimal(b);
    return decA.times(decB).toFixed(decimalPlaces);
  }

  /**
   * Pembagian: a / b (aman dari pembagian dengan 0)
   */
  public static div(
    a: string | number | Decimal,
    b: string | number | Decimal,
    decimalPlaces: number = MoneyHelper.DEFAULT_DECIMAL_PLACES,
  ): string {
    const decA = MoneyHelper.toDecimal(a);
    const decB = MoneyHelper.toDecimal(b);
    if (decB.isZero()) {
      return new Decimal(0).toFixed(decimalPlaces);
    }
    return decA.dividedBy(decB).toFixed(decimalPlaces);
  }

  /**
   * Total penjumlahan array nominal
   */
  public static sum(
    amounts: (string | number | Decimal)[],
    decimalPlaces: number = MoneyHelper.DEFAULT_DECIMAL_PLACES,
  ): string {
    if (!amounts || amounts.length === 0) {
      return new Decimal(0).toFixed(decimalPlaces);
    }
    const total = amounts.reduce<Decimal>((acc, curr) => {
      return acc.plus(MoneyHelper.toDecimal(curr));
    }, new Decimal(0));
    return total.toFixed(decimalPlaces);
  }

  /**
   * Mengecek apakah a sama dengan b
   */
  public static isEqual(
    a: string | number | Decimal,
    b: string | number | Decimal,
  ): boolean {
    return MoneyHelper.toDecimal(a).equals(MoneyHelper.toDecimal(b));
  }

  /**
   * Mengecek apakah bernilai 0
   */
  public static isZero(value: string | number | Decimal): boolean {
    return MoneyHelper.toDecimal(value).isZero();
  }

  /**
   * Mengecek apakah bernilai positif (> 0)
   */
  public static isPositive(value: string | number | Decimal): boolean {
    return MoneyHelper.toDecimal(value).isPositive() && !MoneyHelper.toDecimal(value).isZero();
  }

  /**
   * Mengecek apakah a > b
   */
  public static isGreaterThan(
    a: string | number | Decimal,
    b: string | number | Decimal,
  ): boolean {
    return MoneyHelper.toDecimal(a).greaterThan(MoneyHelper.toDecimal(b));
  }

  /**
   * Mengecek apakah a >= b
   */
  public static isGreaterOrEqual(
    a: string | number | Decimal,
    b: string | number | Decimal,
  ): boolean {
    return MoneyHelper.toDecimal(a).greaterThanOrEqualTo(MoneyHelper.toDecimal(b));
  }

  /**
   * Mengecek apakah a < b
   */
  public static isLessThan(
    a: string | number | Decimal,
    b: string | number | Decimal,
  ): boolean {
    return MoneyHelper.toDecimal(a).lessThan(MoneyHelper.toDecimal(b));
  }

  /**
   * Mengecek apakah a <= b
   */
  public static isLessOrEqual(
    a: string | number | Decimal,
    b: string | number | Decimal,
  ): boolean {
    return MoneyHelper.toDecimal(a).lessThanOrEqualTo(MoneyHelper.toDecimal(b));
  }

  /**
   * Selisih absolut: |a - b|
   */
  public static difference(
    a: string | number | Decimal,
    b: string | number | Decimal,
    decimalPlaces: number = MoneyHelper.DEFAULT_DECIMAL_PLACES,
  ): string {
    const decA = MoneyHelper.toDecimal(a);
    const decB = MoneyHelper.toDecimal(b);
    return decA.minus(decB).abs().toFixed(decimalPlaces);
  }

  /**
   * Memvalidasi keseimbangan jurnal (Total Debit == Total Kredit)
   */
  public static isBalanced(
    debits: (string | number | Decimal)[],
    credits: (string | number | Decimal)[],
  ): boolean {
    const totalDebit = MoneyHelper.sum(debits);
    const totalCredit = MoneyHelper.sum(credits);
    return MoneyHelper.isEqual(totalDebit, totalCredit);
  }

  /**
   * Format Rupiah untuk tampilan teks
   * Contoh: "Rp 1.500.000" atau "Rp 1.500.000,50"
   */
  public static formatRupiah(
    value: string | number | Decimal | null | undefined,
    withPrefix: boolean = true,
  ): string {
    const dec = MoneyHelper.toDecimal(value);
    const isNegative = dec.isNegative();
    const absDec = dec.abs();
    const parts = absDec.toFixed(MoneyHelper.DEFAULT_DECIMAL_PLACES).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1];

    let formatted = integerPart;
    if (decimalPart && decimalPart !== '00') {
      formatted += `,${decimalPart}`;
    }

    if (withPrefix) {
      return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
    }
    return isNegative ? `-${formatted}` : formatted;
  }
}
