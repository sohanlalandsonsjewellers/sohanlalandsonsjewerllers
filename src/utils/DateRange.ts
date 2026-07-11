export interface DateRange {

  from: Date;

  to: Date;

}

export function getDateRange(
  days: number = 7
): DateRange {

  const to = new Date();

  const from = new Date();

  from.setHours(
    0,
    0,
    0,
    0
  );

  from.setDate(

    from.getDate() - days + 1

  );

  return {

    from,

    to

  };

}