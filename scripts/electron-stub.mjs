// Minimal electron stand-in so pure modules can be bundled and unit-tested
// under plain Node. Only the members touched at import time need to exist;
// the tested functions never call these.
import * as os from "node:os";
export const app = { getPath: () => os.tmpdir() };
export const safeStorage = {
  isEncryptionAvailable: () => false,
  encryptString: () => Buffer.from(""),
  decryptString: () => ""
};
export default { app, safeStorage };
