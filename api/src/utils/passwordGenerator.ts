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
 * Converts to lowercase, removes spaces, adds random suffix
 */
export function generateUsername(name: string, existingUsernames: string[] = []): string {
  // Clean the name: lowercase, remove special characters, replace spaces with underscore
  const baseName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 20); // Limit length
  
  // Generate unique username by adding random suffix if needed
  let username = baseName;
  let attempts = 0;
  
  while (existingUsernames.includes(username) && attempts < 100) {
    const suffix = crypto.randomInt(100, 9999);
    username = `${baseName}_${suffix}`;
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

export function generateStudentCredentials(names: string[]): StudentCredentials[] {
  const existingUsernames: string[] = [];
  
  return names.map(name => {
    const username = generateUsername(name, existingUsernames);
    existingUsernames.push(username);
    
    return {
      name,
      username,
      password: generateStudentPassword(),
    };
  });
}
