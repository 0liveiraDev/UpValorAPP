/**
 * UpValor Native Biometric Service
 * Autenticação biométrica (digital/face) usando Capacitor
 */

let NativeBiometric = null;

// Lazy load para funcionar em browser (Next.js SSR safe)
async function getBiometricPlugin() {
  if (typeof window === 'undefined') return null;
  if (!NativeBiometric) {
    try {
      const { NativeBiometric: Plugin } = await import('capacitor-native-biometric');
      NativeBiometric = Plugin;
    } catch {
      return null;
    }
  }
  return NativeBiometric;
}

/**
 * Verifica se o dispositivo suporta biometria
 * @returns {{ isAvailable: boolean, biometryType: string }}
 */
export async function checkBiometricAvailability() {
  const plugin = await getBiometricPlugin();
  if (!plugin) return { isAvailable: false, biometryType: 'none' };

  try {
    const result = await plugin.isAvailable();
    return result;
  } catch {
    return { isAvailable: false, biometryType: 'none' };
  }
}

/**
 * Autentica o usuário via biometria
 * @param {string} reason - Mensagem exibida ao usuário
 * @returns {Promise<boolean>} - true se autenticado com sucesso
 */
export async function authenticateWithBiometric(reason = 'Confirme sua identidade para acessar o UpValor') {
  const plugin = await getBiometricPlugin();
  if (!plugin) return false;

  try {
    await plugin.verifyIdentity({
      reason,
      title: 'UpValor',
      subtitle: 'Autenticação segura',
      description: reason,
      negativeButtonText: 'Usar senha',
      maxAttempts: 3,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Salva credenciais de forma segura no dispositivo (Keystore/Keychain)
 * @param {string} username
 * @param {string} password
 */
export async function saveCredentials(username, password) {
  const plugin = await getBiometricPlugin();
  if (!plugin) return;

  try {
    await plugin.setCredentials({
      username,
      password,
      server: 'com.upvalor.app',
    });
  } catch (err) {
    console.error('[Biometric] Erro ao salvar credenciais:', err);
  }
}

/**
 * Recupera credenciais salvas do Keystore
 * @returns {{ username: string, password: string } | null}
 */
export async function getSavedCredentials() {
  const plugin = await getBiometricPlugin();
  if (!plugin) return null;

  try {
    const creds = await plugin.getCredentials({ server: 'com.upvalor.app' });
    return creds;
  } catch {
    return null;
  }
}

/**
 * Remove credenciais salvas
 */
export async function deleteCredentials() {
  const plugin = await getBiometricPlugin();
  if (!plugin) return;

  try {
    await plugin.deleteCredentials({ server: 'com.upvalor.app' });
  } catch (err) {
    console.error('[Biometric] Erro ao deletar credenciais:', err);
  }
}
