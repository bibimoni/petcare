import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isCronExpression', async: false })
export class IsCronExpressionConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return true;
    }

    if (typeof value !== 'string') {
      return false;
    }

    // Standard cron expression pattern: second minute hour day month weekday
    // Format: "0 0 8 * * *" or "0 0 8 * * * *"
    const cronPattern =
      /^(\d+|[*]|[0-9]+-[0-9]+|[0-9]+\/[0-9]+|(\d+,)+\d+|\*\/\d+)(\s+(\d+|[*]|[0-9]+-[0-9]+|[0-9]+\/[0-9]+|(\d+,)+\d+|\*\/\d+)){5,6}$/;

    if (!cronPattern.test(value)) {
      return false;
    }

    const parts = value.trim().split(/\s+/);
    if (parts.length < 5 || parts.length > 7) {
      return false;
    }

    // Validate ranges for each field
    const fieldConstraints = [
      { name: 'second', min: 0, max: 59, index: 0 },
      { name: 'minute', min: 0, max: 59, index: parts.length === 6 ? 0 : 1 },
      { name: 'hour', min: 0, max: 23, index: parts.length === 6 ? 1 : 2 },
      { name: 'day', min: 1, max: 31, index: parts.length === 6 ? 2 : 3 },
      { name: 'month', min: 1, max: 12, index: parts.length === 6 ? 3 : 4 },
      { name: 'weekday', min: 0, max: 7, index: parts.length === 6 ? 4 : 5 },
    ];

    // For 5-field cron (minute hour day month weekday), skip second
    // For 6-field cron (minute hour day month weekday second), skip nothing
    // For 7-field cron (second minute hour day month weekday year), include all
    const startIndex = parts.length === 5 ? 1 : 0;

    for (let i = startIndex; i < parts.length; i++) {
      const part = parts[i];
      if (part === '*') continue;

      // Check for ranges and steps
      if (part.includes('-')) {
        const rangeParts = part.split('-');
        if (rangeParts.length !== 2) return false;
        const [start, end] = rangeParts.map(Number);
        if (isNaN(start) || isNaN(end)) return false;
      } else if (part.includes('/')) {
        const stepParts = part.split('/');
        if (stepParts.length !== 2) return false;
        const [base, step] = stepParts;
        if (step === '0') return false; // step cannot be 0
        if (base !== '*' && isNaN(Number(base))) return false;
        if (isNaN(Number(step))) return false;
      } else if (part.includes(',')) {
        const numbers = part.split(',');
        for (const num of numbers) {
          if (isNaN(Number(num))) return false;
        }
      } else {
        if (isNaN(Number(part))) return false;
      }
    }

    return true;
  }

  defaultMessage(): string {
    return 'Invalid cron expression format. Expected format: "minute hour day month weekday" (e.g., "0 0 8 * * *" for 8am daily) or with optional seconds/year';
  }
}

export function IsCronExpression(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCronExpressionConstraint,
    });
  };
}
