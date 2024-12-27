interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateFixturesData(data: any): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    return { isValid: false, errors: ['Data must be an array'] };
  }

  for (const fixture of data) {
    // Required fields validation
    const requiredFields = ['id', 'event', 'team_h', 'team_a', 'kickoff_time'];
    for (const field of requiredFields) {
      if (!(field in fixture)) {
        errors.push(`Missing required field: ${field} in fixture ${fixture.id || 'unknown'}`);
      }
    }

    // Type validation
    if (typeof fixture.id !== 'number') {
      errors.push(`Invalid id type for fixture ${fixture.id || 'unknown'}`);
    }
    if (typeof fixture.event !== 'number') {
      errors.push(`Invalid event type for fixture ${fixture.id || 'unknown'}`);
    }
    if (typeof fixture.team_h !== 'number') {
      errors.push(`Invalid team_h type for fixture ${fixture.id || 'unknown'}`);
    }
    if (typeof fixture.team_a !== 'number') {
      errors.push(`Invalid team_a type for fixture ${fixture.id || 'unknown'}`);
    }

    // Date validation
    if (fixture.kickoff_time && !isValidDate(fixture.kickoff_time)) {
      errors.push(`Invalid kickoff_time format for fixture ${fixture.id || 'unknown'}`);
    }

    // Stats validation if present
    if (fixture.stats && !Array.isArray(fixture.stats)) {
      errors.push(`Invalid stats format for fixture ${fixture.id || 'unknown'}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}