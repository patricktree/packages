import assert from "node:assert";
import net from "node:net";

import { check } from "@patricktree/commons-ecma/util/assert";

export const networkUtil = {
  getRandomFreePort,
};

/**
 * Based on
 * https://github.com/nestjs/nest/blob/8e3af065bb9abbecc91b4e6068c8e205ef79d165/integration/nest-application/get-url/e2e/utils.ts#L5
 */
async function getRandomFreePort(): Promise<number> {
  const server = net.createServer();
  return new Promise<number>((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      /* the server is listening on a TCP port here, so `address()` returns an `AddressInfo` */
      assert(check.isNotNullish(address) && typeof address !== "string");
      const { port } = address;
      server.close();
      resolve(port);
    });
  });
}
