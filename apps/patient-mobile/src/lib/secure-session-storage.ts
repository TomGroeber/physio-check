import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import aesjs from "aes-js";

/**
 * Sitzungs-Speicher für Supabase (D-061): SecureStore (Keychain/
 * Keystore) kann nur ~2 KB pro Eintrag, eine Supabase-Session ist
 * größer. Deshalb das von Supabase dokumentierte Muster: ein zufälliger
 * AES-256-Schlüssel liegt im SecureStore, die verschlüsselte Session in
 * AsyncStorage. Tokens landen dadurch nie im Klartext auf der Platte.
 */
export class SecureSessionStorage {
  private keyId(key: string): string {
    // SecureStore erlaubt nur [A-Za-z0-9._-]
    return key.replace(/[^A-Za-z0-9._-]/g, "_");
  }

  private async encryptionKey(storageKey: string): Promise<Uint8Array> {
    const id = this.keyId(storageKey);
    const stored = await SecureStore.getItemAsync(id);
    if (stored) return aesjs.utils.hex.toBytes(stored);
    const fresh = Crypto.getRandomBytes(32);
    await SecureStore.setItemAsync(id, aesjs.utils.hex.fromBytes(fresh));
    return fresh;
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    const keyBytes = await SecureStore.getItemAsync(this.keyId(key));
    if (!keyBytes) return null;
    try {
      const [ivHex, dataHex] = encrypted.split(":");
      if (!ivHex || !dataHex) return null;
      const cipher = new aesjs.ModeOfOperation.ctr(
        aesjs.utils.hex.toBytes(keyBytes),
        new aesjs.Counter(aesjs.utils.hex.toBytes(ivHex))
      );
      return aesjs.utils.utf8.fromBytes(
        cipher.decrypt(aesjs.utils.hex.toBytes(dataHex))
      );
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const keyBytes = await this.encryptionKey(key);
    const iv = Crypto.getRandomBytes(16);
    const cipher = new aesjs.ModeOfOperation.ctr(
      keyBytes,
      new aesjs.Counter(iv)
    );
    const data = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await AsyncStorage.setItem(
      key,
      `${aesjs.utils.hex.fromBytes(iv)}:${aesjs.utils.hex.fromBytes(data)}`
    );
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(this.keyId(key));
  }
}
