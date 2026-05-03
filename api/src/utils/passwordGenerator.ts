import crypto from 'crypto';

/**
 * Generate a secure exam password
 * 8 characters, alphanumeric (A-Z, 0-9)
 */
export function generateExamPassword(): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 8;
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Generate a secure student password
 * 10 characters, alphanumeric (A-Z, a-z, 0-9)
 */
export function generateStudentPassword(): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 10;
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Generate a username from student name
 * Creates short username from first name + last initial + random number
 */
export function generateUsername(name: string, existingUsernames: string[] = []): string {
  // Split name into parts
  const parts = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(p => p.length > 0);
  
  if (parts.length === 0) {
    // Fallback for invalid names
    const randomNum = crypto.randomInt(1000, 9999);
    return `user${randomNum}`;
  }
  
  // Create base: first name + last initial (if exists)
  let baseName = parts[0];
  if (parts.length > 1) {
    baseName += parts[parts.length - 1].charAt(0);
  }
  
  // Limit to 8 characters
  baseName = baseName.substring(0, 8);
  
  // Add random 3-digit number to ensure uniqueness
  let username = baseName;
  let attempts = 0;
  
  while (existingUsernames.includes(username) && attempts < 100) {
    const suffix = crypto.randomInt(100, 999);
    username = `${baseName}${suffix}`;
    attempts++;
  }
  
  return username;
}

/**
 * Generate credentials for multiple students
 */
export interface StudentCredentials {
  name: string;
  username: string;
  password: string;
}

export function generateStudentCredentials(names: string[], existingUsernames: string[] = []): StudentCredentials[] {
  const usedUsernames = [...existingUsernames];
  
  return names.map(name => {
    const username = generateUsername(name, usedUsernames);
    usedUsernames.push(username);
    
    return {
      name,
      username,
      password: generateStudentPassword(),
    };
  });
}
